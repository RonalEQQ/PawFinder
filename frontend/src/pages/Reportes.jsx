import { useState, useRef, useEffect, useCallback } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ModalCartel from "./Cartel"
import { auth, db } from "../firebase/firebaseConfig"
import {
    collection, addDoc, onSnapshot, query, orderBy,
    deleteDoc, doc, updateDoc, serverTimestamp, where
} from "firebase/firestore"
import { useNavigate } from "react-router-dom"

// ── ASSETS ─────────────────────────────────────────────
import perritoImg from "../assets/perrito.png"
import huellaImg  from "../assets/huella.png"
import lupaImg    from "../assets/lupa.png"

const API = import.meta.env.VITE_API_URL

// ── PALETA DE COLORES ─────────────────────────────────
const C = {
    orange: "#E07B27",
    orangeLight: "#F5E6D0",
    orangeGlow: "rgba(224,123,39,0.15)",
    beige: "#D9C4A0",
    beigeLight: "#F2EDE3",
    tealDark: "#0B5C5C",
    teal: "#1A7A7A",
    tealLight: "#E0F2F2",
    tealGlow: "rgba(26,122,122,0.15)",
    white: "#FFFFFF",
    text: "#1a1a1a",
    muted: "#6b6b6b",
    success: "#27ae60",
    successLight: "#d5f5e3",
    surface: "#FAFAF8",
}

const TIPO_CONFIG = {
    perdido: { label: "Perdido", bg: "#fff0e6", color: "#E07B27", border: "#f5c6a0" },
    encontrado: { label: "Encontrado", bg: "#e8f5e9", color: "#1A7A7A", border: "#b2dfdb" },
    posible_perdido: { label: "Posiblemente Perdido", bg: "#FEA02F20", color: "#CC8800", border: "#ffe082" },
}

const COLORES_PERROS = [
    "Blanco", "Negro", "Marrón", "Cafe", "Dorado", "Gris",
    "Atigrado", "Manchado", "Bicolor", "Tricolor", "Otro"
]

const CALLES_PUNO = [
    "Jr. Lima", "Jr. Ica", "Jr. Tacna", "Jr. Arequipa", "Jr. Moquegua",
    "Jr. Ayacucho", "Jr. Cusco", "Jr. Apurímac", "Jr. Junín", "Jr. Huancavelica",
    "Av. El Sol", "Av. La Cultura", "Av. Simón Bolívar", "Av. Costanera",
    "Av. Circunvalación", "Av. Chulluni", "Av. Titicaca", "Av. Los Incas",
    "Plaza de Armas", "Barrio Mañazo", "Barrio Bellavista", "Barrio Salcedo",
    "Barrio Vallecito", "Barrio 4 de Noviembre", "Barrio Azoguini", "Barrio Huaje",
    "Urb. Los Uros", "Urb. Las Mercedes", "Urb. Santa Rosa", "Urb. San Antonio",
    "Mercado Central", "Mercado Unión", "Mercado Laykakota", "Malecon Bahía",
    "Malecon Ecoturístico", "Isla Esteves", "Carretera a Chucuito"
]

const RAZAS = [
    "No lo sé", "Golden Retriever", "Labrador Retriever", "Pastor Alemán",
    "Bulldog Francés", "Bulldog Inglés", "Beagle", "Caniche / Poodle",
    "Rottweiler", "Yorkshire Terrier", "Chihuahua", "Dachshund / Salchicha",
    "Shih Tzu", "Husky Siberiano", "Doberman", "Boxer", "Border Collie",
    "Cocker Spaniel", "Maltés", "Schnauzer", "Pomerania", "Samoyedo",
    "Gran Danés", "Akita Inu", "Mestizo / Criollo", "Otro",
]

const FOTOS_PERROS = [
    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200&h=200&fit=crop",
]

const REPORTES_INICIALES = [
    { id: 1, nombre: "Max", raza: "Golden Retriever", color: "Dorado", sexo: "Macho", colorOtro: "", lugar: "Av. El Sol, Puno", lat: -15.8402, lng: -70.0219, direccionCompleta: "Av. El Sol 123, Puno", fecha: "20/01/2025", horaAproximada: "14:00", timestampRegistro: new Date().toISOString(), telefono: "+51 999 000 111", estado: "activo", diasActivo: 5, fotos: [FOTOS_PERROS[0]], descripcion: "Muy amigable, responde a su nombre", activoParaTodos: true, comentarios: [], tipo: "perdido", usuarioId: 1 },
    { id: 2, nombre: "Luna", raza: "Caniche / Poodle", color: "Blanco", sexo: "Hembra", colorOtro: "", lugar: "Barrio Salcedo, Puno", lat: -15.835, lng: -70.03, direccionCompleta: "Calle Grau 456, Barrio Salcedo", fecha: "10/01/2025", horaAproximada: "09:30", timestampRegistro: new Date().toISOString(), telefono: "+51 977 000 333", estado: "activo", diasActivo: 15, fotos: [FOTOS_PERROS[2]], descripcion: "Muy asustadiza, no se acerca a extraños", activoParaTodos: true, comentarios: [], tipo: "perdido", usuarioId: 2 },
    { id: 3, nombre: "Rocky", raza: "Rottweiler", color: "Negro con cafe", sexo: "Macho", colorOtro: "", lugar: "Plaza de Armas, Puno", lat: -15.829, lng: -70.025, direccionCompleta: "Plaza de Armas s/n, Puno", fecha: "18/01/2025", horaAproximada: "16:45", timestampRegistro: new Date().toISOString(), telefono: "+51 966 111 222", estado: "activo", diasActivo: 7, fotos: [FOTOS_PERROS[3]], descripcion: "Grande, muy docil a pesar de su apariencia", activoParaTodos: true, comentarios: [], tipo: "perdido", usuarioId: 3 },
]

const ESTADO_STYLE = {
    activo: { bg: "#fff0e6", color: C.orange, label: "Perdido" },
    posible_perdido: { bg: "#FEA02F20", color: "#CC8800", label: "Posiblemente Perdido" },
    resuelto: { bg: C.tealLight, color: C.teal, label: "Encontrado" },
}

// Convierte una fila de la BD (snake_case) al formato que usa el frontend
const dbToFrontend = (r) => ({
    id:                r.id,
    nombre:            r.nombre || "Sin nombre",
    raza:              r.raza || "—",
    color:             r.color || "—",
    sexo:              r.sexo || "",
    lugar:             r.lugar || "Puno",
    direccionCompleta: r.direccion_completa || r.lugar || "Puno",
    lat:               parseFloat(r.lat) || -15.8402,
    lng:               parseFloat(r.lng) || -70.0219,
    fecha:             r.fecha || new Date().toLocaleDateString("es-PE"),
    horaAproximada:    r.hora_aproximada || "",
    timestampRegistro: r.timestamp_registro || new Date().toISOString(),
    telefono:          r.telefono || "—",
    descripcion:       r.descripcion || "",
    tipo:              r.tipo || "perdido",
    estado:            r.estado || "activo",
    activoParaTodos:   r.activo_para_todos !== false,
    diasActivo:        r.dias_activo || 0,
    fotos:             Array.isArray(r.fotos) && r.fotos.length > 0 ? r.fotos : [FOTOS_PERROS[0]],
    comentarios:       [],
    usuarioId:         r.firebase_uid || null,
    usuarioNombre:     r.usuario_nombre || "Usuario",
})

const TAB_TOOLTIPS = {
    misReportes: "Administra y revisa todos tus reportes publicados.",
    reportesGenerales: "Explora mascotas perdidas reportadas por la comunidad.",
    posiblesPerdidas: "Mascotas vistas solas; ayuda comentando si las reconoces.",
    mascotasEncontradas: "Historias de éxito: mascotas reunidas con sus dueños.",
}

// ── GLOBAL CSS ──────────────────────────────────────────
const GLOBAL_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

    * { box-sizing: border-box; }

    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeInUp {
        from { transform: translateY(14px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes tooltipIn {
        from { opacity: 0; transform: translateY(4px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes statIn {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes dogBounce {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-7px); }
    }
    @keyframes floatUD {
        0%,100% { transform: translateY(0px)   rotate(var(--r,0deg)); }
        40%     { transform: translateY(-18px)  rotate(calc(var(--r,0deg) + 6deg)); }
        70%     { transform: translateY(-10px)  rotate(calc(var(--r,0deg) - 4deg)); }
    }
    @keyframes floatLR {
        0%,100% { transform: translateX(0px)   rotate(var(--r,0deg)); }
        35%     { transform: translateX(14px)   rotate(calc(var(--r,0deg) + 5deg)); }
        70%     { transform: translateX(-8px)   rotate(calc(var(--r,0deg) - 3deg)); }
    }
    @keyframes floatDiag {
        0%,100% { transform: translate(0,0)          rotate(var(--r,0deg)); }
        33%     { transform: translate(12px,-16px)    rotate(calc(var(--r,0deg) + 8deg)); }
        66%     { transform: translate(-8px,-10px)    rotate(calc(var(--r,0deg) - 5deg)); }
    }
    @keyframes geocodingPulse {
        0%,100% { opacity: 1; }
        50%     { opacity: 0.4; }
    }

    .pf-deco-float-ud   { animation: floatUD   var(--dur,7s) ease-in-out var(--del,0s) infinite; }
    .pf-deco-float-lr   { animation: floatLR   var(--dur,8s) ease-in-out var(--del,0s) infinite; }
    .pf-deco-float-diag { animation: floatDiag var(--dur,9s) ease-in-out var(--del,0s) infinite; }

    .pf-container * { font-family: 'Plus Jakarta Sans', sans-serif; }

    .pf-report-card {
        transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease;
    }
    .pf-report-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 14px 36px rgba(26,122,122,0.13) !important;
    }

    .pf-stat-card {
        transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease;
        animation: statIn 0.4s ease both;
    }
    .pf-stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 18px 36px rgba(0,0,0,0.1) !important;
    }

    .pf-tab-btn { position: relative; }
    .pf-tab-btn:hover .pf-tooltip {
        display: block;
        animation: tooltipIn 0.18s ease;
    }
    .pf-tooltip { display: none; }

    .pf-input:focus {
        outline: none;
        border-color: #1A7A7A !important;
        box-shadow: 0 0 0 3px rgba(26,122,122,0.12);
    }

    .pf-toggle-btn { transition: all 0.18s ease; }
    .pf-toggle-btn:hover { transform: scale(1.03); }

    .pf-action-btn {
        transition: all 0.18s ease;
        cursor: pointer;
    }
    .pf-action-btn:hover {
        filter: brightness(1.07);
        transform: translateY(-1px);
    }

    .pf-add-btn {
        transition: all 0.25s cubic-bezier(.34,1.56,.64,1);
    }
    .pf-add-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 36px rgba(224,123,39,0.4) !important;
    }
    .pf-add-btn-teal:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 36px rgba(26,122,122,0.4) !important;
    }

    .pf-foto-item { transition: transform 0.18s ease; }
    .pf-foto-item:hover { transform: scale(1.04); }

    .pf-restore-wrap { position: relative; display: inline-block; width: 100%; }
    .pf-restore-wrap:hover .pf-restore-tooltip {
        display: block;
        animation: tooltipIn 0.18s ease;
    }
    .pf-restore-tooltip { display: none; }

    /* Scrollbar elegante */
    .pf-scroll::-webkit-scrollbar { width: 5px; }
    .pf-scroll::-webkit-scrollbar-track { background: transparent; }
    .pf-scroll::-webkit-scrollbar-thumb { background: #D9C4A0; border-radius: 99px; }

    /* Barras 30 días en tarjeta */
    .pf-dias-bar { display: flex; gap: 2px; flex-wrap: wrap; margin-top: 5px; }
    .pf-dia-barra { width: 9px; height: 9px; border-radius: 3px; }

    /* Tooltip comentarios */
    .pf-comment-wrap { position: relative; display: inline-block; }
    .pf-comment-wrap:hover .pf-comment-tooltip { display: block; animation: tooltipIn 0.18s ease; }
    .pf-comment-tooltip {
        display: none; position: absolute; bottom: calc(100% + 7px); left: 50%;
        transform: translateX(-50%); width: 215px; background: #0B5C5C; color: white;
        padding: 8px 12px; border-radius: 11px; font-size: 11.5px; line-height: 1.5;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 200; text-align: center;
        font-weight: 500; pointer-events: none;
    }
    .pf-comment-tooltip::after {
        content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
        border: 6px solid transparent; border-top-color: #0B5C5C;
    }

    /* Geocoding spinner */
    .pf-geocoding-indicator {
        animation: geocodingPulse 1s ease-in-out infinite;
    }

    /* Leaflet cursor crosshair override */
    .pf-map-picker .leaflet-container {
        cursor: crosshair !important;
    }
    .pf-map-picker .leaflet-dragging .leaflet-container {
        cursor: grabbing !important;
    }

    /* ── RESPONSIVE MÓVIL ── */
    @media (max-width: 768px) {
        /* Formulario de reporte */
        .pf-modal-box { padding: 16px !important; margin: 8px !important; border-radius: 16px !important; }
        .pf-form-grid-2 { grid-template-columns: 1fr !important; }
        .pf-form-grid-3 { grid-template-columns: 1fr 1fr !important; }

        /* Lista de reportes */
        .pf-reporte-card { flex-direction: column !important; }
        .pf-reporte-fotos { flex-wrap: wrap !important; }

        /* Tabs */
        .pf-tabs { overflow-x: auto !important; white-space: nowrap !important; }

        /* Botones flotantes */
        .pf-fab { bottom: 76px !important; right: 16px !important; }
    }
    @media (max-width: 480px) {
        .pf-form-grid-3 { grid-template-columns: 1fr !important; }
        .pf-section-title { font-size: 18px !important; }
        .pf-detector-btns { flex-direction: column !important; }
    }
`

// ── FIX ÍCONOS LEAFLET ─────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── HELPERS DE MAPA ────────────────────────────────────────────

/** Centra el mapa cuando cambia `center` */
function MapCenterer({ center }) {
    const map = useMap()
    useEffect(() => {
        if (center) map.setView([center.lat, center.lng], 16)
    }, [center, map])
    return null
}

/** Pin naranja arrastrable; clic en el mapa también mueve el pin */
function PinArrastrable({ posicion, onChange }) {
    useMapEvents({
        click(e) {
            onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
        },
    })

    if (!posicion) return null

    const icon = L.divIcon({
        html: `<div style="
            width: 32px;
            height: 32px;
            background: #DD6600;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.35);
        "></div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    })

    return (
        <Marker
            position={[posicion.lat, posicion.lng]}
            icon={icon}
            draggable
            eventHandlers={{
                dragend(e) {
                    const ll = e.target.getLatLng()
                    onChange({ lat: ll.lat, lng: ll.lng })
                },
            }}
        />
    )
}

/** Geocodifica una dirección a { lat, lng } usando Nominatim */
async function geocodificar(direccion) {
    try {
        const q = encodeURIComponent(`${direccion}, Puno, Peru`)
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=pe`
        )
        const data = await res.json()
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        }
    } catch { /* sin internet */ }
    return null
}

// ── COMPONENTE: MAPA CON PIN ARRASTRABLE ─────────────────────
/**
 * Reemplaza el MapaPicker anterior.
 * - Input de texto con autogeocoding (debounce 600 ms)
 * - Botón GPS
 * - Mapa interactivo: clic coloca el pin, pin es arrastrable
 * - Muestra coordenadas y enlace a Google Maps cuando hay pin
 */
function MapaPickerNuevo({ pinPosicion, setPinPosicion, ubicacionTexto, setUbicacionTexto, onDireccionCompleta }) {
    const [geocodificando, setGeocodificando] = useState(false)
    const [usandoGPS, setUsandoGPS] = useState(false)
    const debounceRef = useRef(null)

    const PUNO_CENTER = { lat: -15.8402, lng: -70.0219 }

    // Geocoding con debounce al escribir
    const handleTextoChange = (e) => {
        const valor = e.target.value
        setUbicacionTexto(valor)
        if (onDireccionCompleta) onDireccionCompleta(valor)

        clearTimeout(debounceRef.current)
        if (valor.length < 4) return

        debounceRef.current = setTimeout(async () => {
            setGeocodificando(true)
            const coords = await geocodificar(valor)
            setGeocodificando(false)
            if (coords) {
                setPinPosicion(coords)
                if (onDireccionCompleta) onDireccionCompleta(`${valor}, Puno`)
            }
        }, 600)
    }

    // GPS
    const obtenerGPS = () => {
        setUsandoGPS(true)
        if (!("geolocation" in navigator)) { alert("GPS no soportado"); setUsandoGPS(false); return }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                setPinPosicion({ lat, lng })
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
                    )
                    const data = await res.json()
                    const calle = data.address?.road || data.address?.pedestrian || ""
                    const numero = data.address?.house_number || ""
                    const ciudad = data.address?.city || data.address?.town || "Puno"
                    const texto = calle ? `${calle}${numero ? " " + numero : ""}, ${ciudad}` : data.display_name.split(",")[0]
                    setUbicacionTexto(texto)
                    if (onDireccionCompleta) onDireccionCompleta(texto)
                } catch {
                    const texto = `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                    setUbicacionTexto(texto)
                    if (onDireccionCompleta) onDireccionCompleta(texto)
                }
                setUsandoGPS(false)
            },
            () => { alert("Error al obtener ubicación GPS"); setUsandoGPS(false) }
        )
    }

    const abrirGoogleMaps = () => {
        if (pinPosicion) {
            window.open(`https://www.google.com/maps?q=${pinPosicion.lat},${pinPosicion.lng}`, "_blank")
        }
    }

    return (
        <div>
            {/* ── Input de texto + botón GPS ── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Ej: Jiron Lima, Puno  · escribe para buscar en el mapa"
                        value={ubicacionTexto}
                        onChange={handleTextoChange}
                        className="pf-input"
                        style={{ ...S.input, paddingRight: geocodificando ? 38 : 14 }}
                    />
                    {geocodificando && (
                        <span className="pf-geocoding-indicator" style={{
                            position: "absolute", right: 12, top: "50%",
                            transform: "translateY(-50%)", fontSize: 16,
                        }}>
                            🔍
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={obtenerGPS}
                    className="pf-action-btn"
                    disabled={usandoGPS}
                    style={{
                        padding: "10px 14px",
                        background: usandoGPS ? "#ccc" : C.tealLight,
                        color: usandoGPS ? "#888" : C.teal,
                        border: `1.5px solid ${C.beige}`,
                        borderRadius: 12, fontWeight: 700,
                        cursor: usandoGPS ? "not-allowed" : "pointer",
                        fontSize: 13, whiteSpace: "nowrap",
                        display: "flex", alignItems: "center", gap: 5,
                    }}
                >
                    {usandoGPS ? "Buscando…" : "Usar mi ubicacion"}
                </button>
            </div>

            {/* ── Mapa con pin arrastrable ── */}
            <div className="pf-map-picker" style={{
                borderRadius: 16, overflow: "hidden",
                border: `1.5px solid ${C.beige}`,
                boxShadow: "0 4px 18px rgba(26,122,122,0.10)",
            }}>
                <MapContainer
                    center={[pinPosicion?.lat || PUNO_CENTER.lat, pinPosicion?.lng || PUNO_CENTER.lng]}
                    zoom={15}
                    style={{ height: 300, width: "100%" }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {pinPosicion && <MapCenterer center={pinPosicion} />}
                    <PinArrastrable posicion={pinPosicion} onChange={setPinPosicion} />
                </MapContainer>
            </div>

            {/* ── Info de posición / instrucción ── */}
            {pinPosicion ? (
                <div style={{
                    marginTop: 8, padding: "10px 14px",
                    background: C.orangeLight,
                    borderRadius: 12, border: `1px solid ${C.beige}`,
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: 8,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.tealDark }}>
                        📍 {pinPosicion.lat.toFixed(5)}, {pinPosicion.lng.toFixed(5)}
                        <span style={{ color: C.muted, fontWeight: 500, marginLeft: 6 }}>
                            · Puedes arrastrar el pin para ajustar
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={abrirGoogleMaps}
                        className="pf-action-btn"
                        style={{
                            padding: "5px 12px", background: "#4285F4",
                            color: "white", border: "none", borderRadius: 8,
                            fontSize: 12, cursor: "pointer", fontWeight: 700,
                        }}
                    >
                        Ver en Google Maps
                    </button>
                </div>
            ) : (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: C.muted, fontStyle: "italic", fontWeight: 500 }}>
                    Haz clic en el mapa o usa GPS para colocar el pin 📌
                </p>
            )}
        </div>
    )
}

// ── COMPONENTE: ALERTA ────────────────────────────────────────
function Alerta({ mensaje, tipo, onCerrar }) {
    useEffect(() => {
        const timer = setTimeout(onCerrar, 3500)
        return () => clearTimeout(timer)
    }, [onCerrar])

    const colores = {
        success: { bg: "#e8f8ef", text: "#1a7a4a", border: "#27ae60", icon: "✓" },
        error: { bg: "#ffeaea", text: "#c0392b", border: "#e74c3c", icon: "✗" },
        info: { bg: C.tealLight, text: C.teal, border: C.teal, icon: "i" }
    }
    const c = colores[tipo] || colores.info

    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24,
            background: c.bg, color: c.text,
            padding: "14px 20px", borderRadius: 16,
            borderLeft: `4px solid ${c.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 3000, animation: "slideInRight 0.35s ease",
            display: "flex", alignItems: "center", gap: 10,
            fontWeight: 600, fontSize: 15, maxWidth: 340,
        }}>
            <span style={{ fontSize: 18, fontWeight: 800, width: 20, textAlign: "center" }}>{c.icon}</span>
            {mensaje}
        </div>
    )
}

// ── COMPONENTE: MODAL AUTH (sin sesión) ───────────────────────
function ModalAuth({ onCerrar, onLogin, onRegistro, mensaje = "reporte" }) {
    const textoMensaje = mensaje === "comentario"
        ? <>🐾 ¡Woof! Para publicar una opinión primero debes iniciar sesión. ¡Únete a la comunidad <span style={{ color: C.orange }}>PAW FINDER</span>!</>
        : <>🐾 ¡Woof! Para crear reportes primero debes iniciar sesión y formar parte de la comunidad <span style={{ color: C.orange }}>PAW FINDER</span>.</>

    return (
        <div style={{ ...S.modalOverlay, zIndex: 9999 }} onClick={onCerrar}>
            <div style={{
                background: "#FDF8F3", borderRadius: 28, width: "92%", maxWidth: 390,
                boxShadow: "0 40px 100px rgba(0,0,0,0.32)", animation: "fadeInUp 0.3s ease",
                position: "relative", overflow: "hidden",
            }} onClick={e => e.stopPropagation()}>

                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                    {[
                        { top: "4%", left: "2%", size: 36, rot: -18, isHuella: true },
                        { top: "6%", right: "3%", size: 28, rot: 25, isHuella: false },
                        { bottom: "8%", left: "4%", size: 30, rot: 12, isHuella: false },
                        { bottom: "6%", right: "2%", size: 34, rot: -22, isHuella: true },
                    ].map((d, i) => (
                        <img key={i} src={d.isHuella ? huellaImg : lupaImg} alt=""
                            style={{
                                position: "absolute", top: d.top, left: d.left, right: d.right, bottom: d.bottom,
                                width: d.size, height: d.size, transform: `rotate(${d.rot}deg)`,
                                opacity: 0.08,
                                filter: i % 2 === 0
                                    ? "sepia(1) saturate(5) hue-rotate(-10deg)"
                                    : "sepia(1) saturate(4) hue-rotate(140deg) brightness(0.7)",
                            }} />
                    ))}
                </div>

                <div style={{ padding: "28px 26px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0, position: "relative" }}>
                    <div style={{
                        background: C.white, border: `2.5px solid ${C.orange}`,
                        borderRadius: 18, padding: "14px 18px", textAlign: "center",
                        position: "relative", marginBottom: 16, width: "100%",
                        boxShadow: "0 4px 20px rgba(224,123,39,0.15)",
                    }}>
                        <div style={{ position: "absolute", bottom: -13, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "13px solid transparent", borderRight: "13px solid transparent", borderTop: `13px solid ${C.orange}` }} />
                        <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "11px solid transparent", borderRight: "11px solid transparent", borderTop: "11px solid white" }} />
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.tealDark, lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {textoMensaje}
                        </p>
                    </div>

                    <img src={perritoImg} alt="Woof!" style={{ width: 130, height: 130, objectFit: "contain", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.18))", animation: "dogBounce 2.2s ease-in-out infinite", marginBottom: 8 }} />

                    <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 12 }}>
                        <button onClick={onLogin} className="pf-action-btn"
                            style={{ flex: 1, padding: "13px 0", background: `linear-gradient(135deg, ${C.orange}, #c96a1a)`, color: "white", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Iniciar sesión
                        </button>
                        <button onClick={onRegistro} className="pf-action-btn"
                            style={{ flex: 1, padding: "13px 0", background: `linear-gradient(135deg, ${C.tealDark}, ${C.teal})`, color: "white", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Registrarme
                        </button>
                    </div>

                    <button onClick={onCerrar} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.07)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>×</button>
                </div>
            </div>
        </div>
    )
}

// ── COMPONENTE: SELECTOR HORA AM/PM ───────────────────────────
function SelectorHora({ value, onChange, name }) {
    const parsear = (val) => {
        if (!val) return { horas: "08", minutos: "00", periodo: "AM" }
        const [h, m] = val.split(":")
        const hNum = parseInt(h, 10)
        if (hNum === 0) return { horas: "12", minutos: m || "00", periodo: "AM" }
        if (hNum < 12) return { horas: String(hNum).padStart(2, "0"), minutos: m || "00", periodo: "AM" }
        if (hNum === 12) return { horas: "12", minutos: m || "00", periodo: "PM" }
        return { horas: String(hNum - 12).padStart(2, "0"), minutos: m || "00", periodo: "PM" }
    }

    const { horas, minutos, periodo } = parsear(value)

    const actualizar = (h, m, p) => {
        let h24 = parseInt(h, 10)
        if (p === "AM" && h24 === 12) h24 = 0
        if (p === "PM" && h24 !== 12) h24 += 12
        onChange({ target: { name: name || "horaAproximada", value: `${String(h24).padStart(2, "0")}:${m}` } })
    }

    const horasList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
    const minsList = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]

    return (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select value={horas} onChange={e => actualizar(e.target.value, minutos, periodo)}
                className="pf-input" style={{ ...S.input, width: "auto", padding: "11px 10px" }}>
                {horasList.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ fontWeight: 800, color: C.teal, fontSize: 18 }}>:</span>
            <select value={minutos} onChange={e => actualizar(horas, e.target.value, periodo)}
                className="pf-input" style={{ ...S.input, width: "auto", padding: "11px 10px" }}>
                {minsList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1.5px solid ${C.beige}` }}>
                {["AM", "PM"].map(p => (
                    <button key={p} type="button" onClick={() => actualizar(horas, minutos, p)}
                        style={{ padding: "10px 14px", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13, background: periodo === p ? C.teal : C.white, color: periodo === p ? "white" : C.muted, transition: "all 0.15s ease" }}>
                        {p}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ── COMPONENTE: INDICADOR 30 DÍAS ─────────────────────────────
function Indicador30Dias({ diasActivo }) {
    const dias = Math.min(diasActivo || 0, 30)
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.tealDark, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Duración de publicación
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: dias >= 28 ? C.orange : C.teal }}>
                    Día {dias}/30
                </span>
            </div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} style={{ width: 14, height: 14, borderRadius: 4, background: i < dias ? (dias >= 28 ? C.orange : C.teal) : C.beige, transition: "background 0.2s ease" }} />
                ))}
            </div>
            {dias >= 30 && (
                <div style={{ marginTop: 8, padding: "8px 12px", background: "#fff0e6", borderRadius: 10, fontSize: 13, fontWeight: 700, color: C.orange, border: `1px solid ${C.beige}` }}>
                    ⚠️ Esta publicación ha expirado. Usa "Restaurar publicación" para reactivarla.
                </div>
            )}
        </div>
    )
}

// ── COMPONENTE: COMENTARIOS MODAL (Firebase Tiempo Real) ──────
function ComentariosModal({ reporte, onCerrar, usuarioActual, onNecesitaAuth }) {
    const [comentarios, setComentarios] = useState([])
    const [nuevoComentario, setNuevoComentario] = useState("")
    const [enviando, setEnviando] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [textoEdit, setTextoEdit] = useState("")
    const listRef = useRef(null)

    useEffect(() => {
        if (!reporte?.id) return
        const q = query(
            collection(db, "comentarios"),
            where("reporteId", "==", String(reporte.id)),
            orderBy("creadoEn", "asc")
        )
        const unsub = onSnapshot(q, snap => {
            setComentarios(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            setTimeout(() => {
                if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
            }, 80)
        })
        return () => unsub()
    }, [reporte?.id])

    const handleEnviar = async () => {
        if (!usuarioActual) { onNecesitaAuth(); return }
        if (!nuevoComentario.trim()) return
        setEnviando(true)
        try {
            await addDoc(collection(db, "comentarios"), {
                reporteId: String(reporte.id),
                texto: nuevoComentario.trim(),
                usuarioId: usuarioActual.uid,
                usuarioNombre: usuarioActual.displayName || usuarioActual.email?.split("@")[0] || "Usuario",
                usuarioFoto: usuarioActual.photoURL || null,
                creadoEn: serverTimestamp(),
                fechaDisplay: new Date().toLocaleString("es-PE"),
            })
            setNuevoComentario("")
        } catch (e) { console.error("Error al comentar:", e) }
        setEnviando(false)
    }

    const handleEliminar = async (comentarioId, comentarioUid) => {
        if (usuarioActual?.uid !== comentarioUid) return
        await deleteDoc(doc(db, "comentarios", comentarioId))
    }

    const iniciarEdicion = (c) => { setEditandoId(c.id); setTextoEdit(c.texto) }
    const guardarEdicion = async () => {
        if (!textoEdit.trim()) return
        await updateDoc(doc(db, "comentarios", editandoId), { texto: textoEdit.trim() })
        setEditandoId(null)
    }

    const avatarUrl = (c) => c.usuarioFoto ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(c.usuarioNombre || "U")}&background=1A7A7A&color=fff`

    return (
        <div style={S.modalOverlay} onClick={onCerrar}>
            <div style={{ ...S.modalBox, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                <div style={S.modalHeader}>
                    <div>
                        <h3 style={S.modalTitle}>Comentarios — {reporte.nombre || "Mascota"}</h3>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                            🟢 En tiempo real · {comentarios.length} comentario{comentarios.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <button onClick={onCerrar} style={S.closeBtn}>×</button>
                </div>

                <div ref={listRef} className="pf-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, background: C.surface, maxHeight: 350 }}>
                    {comentarios.length === 0 ? (
                        <div style={{ textAlign: "center", color: C.muted, padding: "32px 0" }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Sin comentarios aún</p>
                            <p style={{ margin: "4px 0 0", fontSize: 13 }}>Sé el primero en comentar</p>
                        </div>
                    ) : comentarios.map(c => (
                        <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "fadeInUp 0.2s ease" }}>
                            <img src={avatarUrl(c)} alt={c.usuarioNombre} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                            <div style={{ flex: 1, background: C.white, padding: "10px 14px", borderRadius: 14, border: `1px solid ${C.beige}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 4 }}>
                                    <strong style={{ color: C.teal, fontSize: 13 }}>{c.usuarioNombre}</strong>
                                    <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                                        <small style={{ color: C.muted, fontSize: 11 }}>{c.fechaDisplay || "Ahora"}</small>
                                        {usuarioActual?.uid === c.usuarioId && editandoId !== c.id && (
                                            <>
                                                <button onClick={() => iniciarEdicion(c)} style={{ background: C.tealLight, border: "none", cursor: "pointer", color: C.teal, fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>Editar</button>
                                                <button onClick={() => handleEliminar(c.id, c.usuarioId)} style={{ background: "#ffeaea", border: "none", cursor: "pointer", color: "#c0392b", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>Eliminar</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {editandoId === c.id ? (
                                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                                        <input value={textoEdit} onChange={e => setTextoEdit(e.target.value)} className="pf-input" style={{ ...S.input, flex: 1, padding: "7px 10px", fontSize: 13 }} onKeyPress={e => e.key === "Enter" && guardarEdicion()} />
                                        <button onClick={guardarEdicion} style={{ padding: "7px 12px", background: C.teal, color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>✓</button>
                                        <button onClick={() => setEditandoId(null)} style={{ padding: "7px 9px", background: C.beigeLight, color: C.muted, border: "none", borderRadius: 9, cursor: "pointer", fontSize: 13 }}>✕</button>
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.5 }}>{c.texto}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.beige}`, background: C.white }}>
                    {usuarioActual ? (
                        <>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                                <img src={usuarioActual.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioActual.displayName || "U")}&background=1A7A7A&color=fff`} alt="yo" style={{ width: 30, height: 30, borderRadius: "50%" }} />
                                <span style={{ fontWeight: 700, color: C.teal, fontSize: 13 }}>{usuarioActual.displayName || usuarioActual.email?.split("@")[0]}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input type="text" placeholder="Escribe un comentario..." value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)} onKeyPress={e => e.key === "Enter" && handleEnviar()} className="pf-input" style={S.input} disabled={enviando} />
                                <button onClick={handleEnviar} className="pf-action-btn" disabled={enviando}
                                    style={{ padding: "10px 18px", background: enviando ? "#ccc" : C.teal, color: "white", border: "none", borderRadius: 12, cursor: enviando ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14 }}>
                                    {enviando ? "..." : "Enviar"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <button onClick={onNecesitaAuth} style={{ width: "100%", padding: "12px", background: C.orangeLight, color: C.orange, border: `1.5px solid ${C.orange}`, borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                            🐾 Inicia sesión para comentar
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── COMPONENTE: MULTI FOTO UPLOADER ─────────────────────────────
// ══════════════════════════════════════════════════════════════
//  TEACHABLE MACHINE — Detector de razas caninas
//  Modelo: https://teachablemachine.withgoogle.com/models/Rbig8w1zM/
//  120 razas entrenadas — etiquetas en inglés, muestra en español
// ══════════════════════════════════════════════════════════════

// Mapa exacto de las 120 razas entrenadas (inglés → español)
const TM_RAZAS = {
    "Chihuahua":"Chihuahua","Japanese_spaniel":"Spaniel Japonés",
    "Maltese_dog":"Maltés","Pekinese":"Pekinés","Shih-Tzu":"Shih Tzu",
    "Blenheim_spaniel":"Spaniel Blenheim","papillon":"Papillon",
    "toy_terrier":"Toy Terrier","Rhodesian_ridgeback":"Ridgeback de Rodesia",
    "Afghan_hound":"Galgo Afgano","basset":"Basset Hound","beagle":"Beagle",
    "bloodhound":"Sabueso","bluetick":"Bluetick Coonhound",
    "black-and-tan_coonhound":"Coonhound Negro y Canela",
    "Walker_hound":"Walker Hound","English_foxhound":"Foxhound Inglés",
    "redbone":"Redbone Coonhound","borzoi":"Borzoi",
    "Irish_wolfhound":"Lebrel Irlandés","Italian_greyhound":"Galgo Italiano",
    "whippet":"Whippet","Ibizan_hound":"Podenco Ibicenco",
    "Norwegian_elkhound":"Elkhound Noruego","otterhound":"Otterhound",
    "Saluki":"Saluki","Scottish_deerhound":"Deerhound Escocés",
    "Weimaraner":"Weimaraner","Staffordshire_bullterrier":"Staffordshire Bull Terrier",
    "American_Staffordshire_terrier":"American Staffordshire Terrier",
    "Bedlington_terrier":"Bedlington Terrier","Border_terrier":"Border Terrier",
    "Kerry_blue_terrier":"Kerry Blue Terrier","Irish_terrier":"Terrier Irlandés",
    "Norfolk_terrier":"Norfolk Terrier","Norwich_terrier":"Norwich Terrier",
    "Yorkshire_terrier":"Yorkshire Terrier",
    "wire-haired_fox_terrier":"Fox Terrier Pelo Duro",
    "Lakeland_terrier":"Lakeland Terrier","Sealyham_terrier":"Sealyham Terrier",
    "Airedale":"Airedale Terrier","cairn":"Cairn Terrier",
    "Australian_terrier":"Terrier Australiano",
    "Dandie_Dinmont":"Dandie Dinmont Terrier","Boston_bull":"Boston Terrier",
    "miniature_schnauzer":"Schnauzer Miniatura","giant_schnauzer":"Schnauzer Gigante",
    "standard_schnauzer":"Schnauzer Estándar","Scotch_terrier":"Scottish Terrier",
    "Tibetan_terrier":"Terrier Tibetano","silky_terrier":"Silky Terrier",
    "soft-coated_wheaten_terrier":"Wheaten Terrier",
    "West_Highland_white_terrier":"West Highland White Terrier",
    "Lhasa":"Lhasa Apso","flat-coated_retriever":"Retriever Pelo Liso",
    "curly-coated_retriever":"Retriever Pelo Rizado",
    "golden_retriever":"Golden Retriever","Labrador_retriever":"Labrador Retriever",
    "Chesapeake_Bay_retriever":"Chesapeake Bay Retriever",
    "German_short-haired_pointer":"Braco Alemán","vizsla":"Vizsla",
    "English_setter":"Setter Inglés","Irish_setter":"Setter Irlandés",
    "Gordon_setter":"Gordon Setter","Brittany_spaniel":"Spaniel Bretón",
    "clumber":"Clumber Spaniel","English_springer":"Springer Inglés",
    "Welsh_springer_spaniel":"Springer Galés","cocker_spaniel":"Cocker Spaniel",
    "Sussex_spaniel":"Sussex Spaniel","Irish_water_spaniel":"Spaniel de Agua Irlandés",
    "kuvasz":"Kuvasz","schipperke":"Schipperke",
    "groenendael":"Pastor Belga Groenendael","malinois":"Pastor Belga Malinois",
    "briard":"Briard","kelpie":"Kelpie Australiano","komondor":"Komondor",
    "Old_English_sheepdog":"Bobtail (Old English Sheepdog)",
    "Shetland_sheepdog":"Shetland Sheepdog","collie":"Collie",
    "Border_collie":"Border Collie","Bouvier_des_Flandres":"Bouvier de Flandes",
    "Rottweiler":"Rottweiler","German_shepherd":"Pastor Alemán","Doberman":"Doberman",
    "miniature_pinscher":"Pinscher Miniatura",
    "Greater_Swiss_Mountain_dog":"Gran Boyero Suizo",
    "Bernese_mountain_dog":"Boyero de Berna","Appenzeller":"Boyero de Appenzell",
    "EntleBucher":"Boyero de Entlebuch","boxer":"Boxer","bull_mastiff":"Bullmastiff",
    "Tibetan_mastiff":"Mastín Tibetano","French_bulldog":"Bulldog Francés",
    "Great_Dane":"Gran Danés","Saint_Bernard":"San Bernardo",
    "Eskimo_dog":"Perro Esquimal","malamute":"Malamute de Alaska",
    "Siberian_husky":"Husky Siberiano","affenpinscher":"Affenpinscher",
    "basenji":"Basenji","pug":"Pug / Carlino","Leonberg":"Leonberger",
    "Newfoundland":"Terranova","Great_Pyrenees":"Gran Pirineo","Samoyed":"Samoyedo",
    "Pomeranian":"Pomeranio","chow":"Chow Chow","keeshond":"Keeshond",
    "Brabancon_griffon":"Grifón de Bravante","Pembroke":"Corgi Pembroke",
    "Cardigan":"Corgi Cardigan","toy_poodle":"Poodle Toy",
    "miniature_poodle":"Poodle Miniatura","standard_poodle":"Poodle Estándar",
    "Mexican_hairless":"Xoloitzcuintle","dingo":"Dingo","dhole":"Dhole",
    "African_hunting_dog":"Perro Salvaje Africano",
}

const TM_MODEL_URL = "https://teachablemachine.withgoogle.com/models/Rbig8w1zM/"

function tmTraducir(clave) {
    return TM_RAZAS[clave] || clave.replace(/_/g, " ")
}

// ── MobileNet: mapeo de clases a razas en español ───────────────────────
const MOBILENET_RAZAS = {
    "Chihuahua": "Chihuahua", "Japanese_spaniel": "Spaniel japonés",
    "Maltese_dog": "Maltés", "Pekinese": "Pekinés", "Shih-Tzu": "Shih Tzu",
    "Blenheim_spaniel": "Spaniel Blenheim", "papillon": "Papillón",
    "toy_terrier": "Toy Terrier", "Rhodesian_ridgeback": "Rhodesian Ridgeback",
    "Afghan_hound": "Lebrel afgano", "basset": "Basset Hound",
    "beagle": "Beagle", "bloodhound": "Sabueso", "bluetick": "Bluetick Coonhound",
    "black-and-tan_coonhound": "Coonhound negro y canela",
    "Walker_hound": "Walker Hound", "English_foxhound": "Foxhound inglés",
    "redbone": "Redbone Coonhound", "borzoi": "Borzoi", "Irish_wolfhound": "Lobero irlandés",
    "Italian_greyhound": "Galgo italiano", "whippet": "Whippet",
    "Ibizan_hound": "Podenco ibicenco", "Norwegian_elkhound": "Elkhound noruego",
    "otterhound": "Otterhound", "Saluki": "Saluki",
    "Scottish_deerhound": "Deerhound escocés", "Weimaraner": "Weimaraner",
    "Staffordshire_bullterrier": "Bull Terrier Staffordshire",
    "American_Staffordshire_terrier": "American Staffordshire Terrier",
    "Bedlington_terrier": "Bedlington Terrier", "Border_terrier": "Border Terrier",
    "Kerry_blue_terrier": "Kerry Blue Terrier", "Irish_terrier": "Terrier irlandés",
    "Norfolk_terrier": "Norfolk Terrier", "Norwich_terrier": "Norwich Terrier",
    "Yorkshire_terrier": "Yorkshire Terrier", "wire-haired_fox_terrier": "Fox Terrier de pelo duro",
    "Lakeland_terrier": "Lakeland Terrier", "Sealyham_terrier": "Sealyham Terrier",
    "Airedale": "Airedale Terrier", "cairn": "Cairn Terrier",
    "Australian_terrier": "Terrier australiano", "Dandie_Dinmont": "Dandie Dinmont Terrier",
    "Boston_bull": "Boston Terrier", "miniature_schnauzer": "Schnauzer miniatura",
    "giant_schnauzer": "Schnauzer gigante", "standard_schnauzer": "Schnauzer estándar",
    "Scotch_terrier": "Scottish Terrier", "Tibetan_terrier": "Terrier tibetano",
    "silky_terrier": "Terrier sedoso", "soft-coated_wheaten_terrier": "Wheaten Terrier",
    "West_Highland_white_terrier": "West Highland Terrier",
    "Lhasa": "Lhasa Apso", "flat-coated_retriever": "Retriever de pelo liso",
    "curly-coated_retriever": "Retriever de pelo rizado",
    "golden_retriever": "Golden Retriever", "Labrador_retriever": "Labrador Retriever",
    "Chesapeake_Bay_retriever": "Chesapeake Bay Retriever",
    "German_short-haired_pointer": "Pointer alemán de pelo corto",
    "vizsla": "Vizsla", "English_setter": "Setter inglés",
    "Irish_setter": "Setter irlandés", "Gordon_setter": "Setter Gordon",
    "Brittany_spaniel": "Spaniel bretón", "clumber": "Clumber Spaniel",
    "English_springer": "Springer inglés", "Welsh_springer_spaniel": "Springer galés",
    "cocker_spaniel": "Cocker Spaniel", "Sussex_spaniel": "Sussex Spaniel",
    "Irish_water_spaniel": "Spaniel de agua irlandés", "kuvasz": "Kuvasz",
    "schipperke": "Schipperke", "groenendael": "Groenendael",
    "malinois": "Malinois belga", "briard": "Briard",
    "kelpie": "Australian Kelpie", "komondor": "Komondor",
    "Old_English_sheepdog": "Bobtail", "Shetland_sheepdog": "Shetland Sheepdog",
    "collie": "Collie", "Border_collie": "Border Collie",
    "Bouvier_des_Flandres": "Bouvier des Flandres", "Rottweiler": "Rottweiler",
    "German_shepherd": "Pastor alemán", "Doberman": "Doberman",
    "miniature_pinscher": "Pinscher miniatura", "Greater_Swiss_Mountain_dog": "Boyero del Gran San Bernardo",
    "Bernese_mountain_dog": "Boyero de Berna", "Appenzeller": "Appenzeller",
    "EntleBucher": "Entlebucher", "boxer": "Boxer",
    "bull_mastiff": "Bull Mastiff", "Tibetan_mastiff": "Mastín tibetano",
    "French_bulldog": "Bulldog francés", "Great_Dane": "Gran Danés",
    "Saint_Bernard": "San Bernardo", "Eskimo_dog": "Perro esquimal",
    "malamute": "Malamute de Alaska", "Siberian_husky": "Husky siberiano",
    "affenpinscher": "Affenpinscher", "basenji": "Basenji",
    "pug": "Pug", "Leonberg": "Leonberger", "Newfoundland": "Terranova",
    "Great_Pyrenees": "Gran Pirineo", "Samoyed": "Samoyedo",
    "Pomeranian": "Pomerania", "chow": "Chow Chow",
    "keeshond": "Keeshond", "Brabancon_griffon": "Grifón de Brabante",
    "Pembroke": "Corgi Pembroke", "Cardigan": "Corgi Cardigan",
    "toy_poodle": "Poodle toy", "miniature_poodle": "Poodle miniatura",
    "standard_poodle": "Poodle estándar", "Mexican_hairless": "Xoloitzcuintle",
    "dingo": "Dingo", "dhole": "Dhole", "African_hunting_dog": "Licaón"
}

function mnTraducir(clave) {
    return MOBILENET_RAZAS[clave] || clave.replace(/_/g, " ")
}

// Singleton MobileNet
let _mnModelo = null
async function cargarMobileNet() {
    if (_mnModelo) return _mnModelo
    let intentos = 0
    while (!window.mobilenet && intentos < 100) {
        await new Promise(r => setTimeout(r, 100))
        intentos++
    }
    if (!window.mobilenet) throw new Error("MobileNet no disponible")
    _mnModelo = await window.mobilenet.load({ version: 2, alpha: 1.0 })
    return _mnModelo
}

// ── Componente: Detector MobileNet ───────────────────────────────────────
function DetectorMobileNet({ foto, onRazaDetectada }) {
    const [estado, setEstado] = useState("idle")
    const [resultados, setResultados] = useState([])
    const [msgError, setMsgError] = useState("")

    useEffect(() => { setEstado("idle"); setResultados([]); setMsgError("") }, [foto])

    const analizar = async () => {
        if (!foto) return
        setEstado("cargando"); setResultados([]); setMsgError("")
        try {
            const modelo = await cargarMobileNet()
            const img = new Image()
            img.crossOrigin = "anonymous"
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = foto })
            const preds = await modelo.classify(img, 5)
            // Filtrar solo razas de perros (clases que existen en MOBILENET_RAZAS o contienen palabras clave)
            const perros = preds
                .filter(p => {
                    const cls = p.className.split(",")[0].trim()
                    return MOBILENET_RAZAS[cls] || cls.toLowerCase().includes("dog") || cls.toLowerCase().includes("hound") || cls.toLowerCase().includes("terrier") || cls.toLowerCase().includes("retriever") || cls.toLowerCase().includes("spaniel") || cls.toLowerCase().includes("shepherd") || cls.toLowerCase().includes("bulldog") || cls.toLowerCase().includes("poodle") || cls.toLowerCase().includes("husky") || cls.toLowerCase().includes("collie")
                })
                .map(p => {
                    const cls = p.className.split(",")[0].trim()
                    return {
                        key: cls,
                        nombre: mnTraducir(cls),
                        pct: Math.round(p.probability * 100)
                    }
                })
                .slice(0, 4)

            if (perros.length === 0) {
                setMsgError("No se detectó un perro claramente. Intenta con otra foto más nítida.")
                setEstado("error")
                return
            }
            setResultados(perros)
            setEstado("listo")
            if (perros[0].pct >= 20) onRazaDetectada(perros[0].nombre, perros[0].key)
        } catch (e) {
            console.error("MobileNet error:", e)
            setMsgError("No se pudo analizar. Verifica la conexión.")
            setEstado("error")
        }
    }

    const colorBarra = (pct) => pct >= 50 ? "#1565C0" : pct >= 25 ? "#5C6BC0" : "#9e9e9e"
    const colorTexto = (pct) => pct >= 50 ? "#0d3b7a" : pct >= 25 ? "#303f9f" : "#666"

    if (!foto) return null

    return (
        <div style={{
            marginTop: 8,
            borderRadius: 16,
            border: `1.5px solid ${estado === "listo" ? "#1565C0" : "#5C6BC0"}`,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}>
            <div style={{
                background: estado === "listo" ? "#e3f2fd" : "#ede7f6",
                padding: "12px 16px",
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 12,
                borderBottom: estado !== "idle" ? "1px solid #bbdefb" : "none",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: estado === "listo" ? "#1565C0" : "#5C6BC0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                    }}>
                        {estado === "cargando" ? "⏳" : estado === "listo" ? "🧠" : estado === "error" ? "⚠️" : "🔬"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: estado === "listo" ? "#0d3b7a" : "#311b92" }}>
                            {estado === "listo" ? "Raza detectada — MobileNet" : estado === "cargando" ? "Analizando con MobileNet..." : "Análisis MobileNet (Google)"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b6b6b", marginTop: 1 }}>
                            Modelo de Google — 1000+ razas y objetos
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={analizar}
                    disabled={estado === "cargando"}
                    style={{
                        padding: "8px 16px", borderRadius: 20, border: "none",
                        background: estado === "cargando" ? "#ccc" : estado === "listo" ? "#1565C0" : "#5C6BC0",
                        color: "white", fontWeight: 800, fontSize: 12,
                        cursor: estado === "cargando" ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap", flexShrink: 0, transition: "background .2s",
                    }}>
                    {estado === "cargando" ? "Analizando..." : estado === "listo" ? "🔄 Reanálisis" : "🔬 Analizar"}
                </button>
            </div>

            {estado === "error" && (
                <div style={{ padding: "10px 16px", fontSize: 12, color: "#c62828", background: "#fff0f0", fontWeight: 600 }}>
                    ⚠️ {msgError}
                </div>
            )}

            {estado === "listo" && resultados.length > 0 && (
                <div style={{ padding: "14px 16px" }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: "#6b6b6b",
                        textTransform: "uppercase", letterSpacing: "0.5px",
                        marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <span style={{ width: 3, height: 14, background: "#1565C0", borderRadius: 2, display: "inline-block" }} />
                        Razas identificadas por MobileNet
                    </div>
                    {resultados.map((r, i) => (
                        <div key={r.key} style={{ marginBottom: i < resultados.length - 1 ? 14 : 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {i === 0 && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 800, padding: "2px 7px",
                                            borderRadius: 10, background: "#e3f2fd", color: "#0d3b7a",
                                            border: "1px solid #90caf9",
                                        }}>PRINCIPAL</span>
                                    )}
                                    <span style={{ fontSize: 13, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? "#1565C0" : "#555" }}>
                                        {r.nombre}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: 13, fontWeight: 800, color: colorTexto(r.pct),
                                    background: r.pct >= 25 ? "#e3f2fd" : "#f5f5f5",
                                    padding: "2px 8px", borderRadius: 10,
                                }}>
                                    {r.pct}%
                                </span>
                            </div>
                            <div style={{ height: 7, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", width: `${r.pct}%`,
                                    background: colorBarra(r.pct), borderRadius: 4,
                                    transition: "width .7s cubic-bezier(.4,0,.2,1)",
                                }} />
                            </div>
                            {i === 0 && r.pct >= 20 && (
                                <button
                                    type="button"
                                    onClick={() => onRazaDetectada(r.nombre, null)}
                                    style={{
                                        marginTop: 6, padding: "5px 14px",
                                        borderRadius: 10, border: "1.5px solid #1565C0",
                                        background: "#e3f2fd", color: "#0d3b7a",
                                        fontSize: 11, fontWeight: 800, cursor: "pointer",
                                    }}>
                                    ✓ Usar "{r.nombre}" como raza
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Singleton: carga el modelo una sola vez en toda la sesión
let _tmModelo = null
async function cargarModeloTM() {
    if (_tmModelo) return _tmModelo
    // esperar hasta que los scripts estén disponibles (máx 10s)
    let intentos = 0
    while (!window.tmImage && intentos < 100) {
        await new Promise(r => setTimeout(r, 100))
        intentos++
    }
    if (!window.tmImage) throw new Error("Librería Teachable Machine no disponible")
    _tmModelo = await window.tmImage.load(
        TM_MODEL_URL + "model.json",
        TM_MODEL_URL + "metadata.json"
    )
    return _tmModelo
}

// ── Componente: Detector de raza con IA ─────────────────────────────────
function DetectorRazaIA({ foto, onRazaDetectada, modo }) {
    // modo: "perdida" | "avistamiento"
    const [estado,     setEstado]     = useState("idle")   // idle | cargando | listo | error
    const [resultados, setResultados] = useState([])
    const [msgError,   setMsgError]   = useState("")

    // Resetea cuando cambia la foto
    useEffect(() => {
        setEstado("idle"); setResultados([]); setMsgError("")
    }, [foto])

    const analizar = async () => {
        if (!foto) return
        setEstado("cargando"); setResultados([]); setMsgError("")
        try {
            const modelo = await cargarModeloTM()
            const img    = new Image()
            img.crossOrigin = "anonymous"
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = foto })
            const preds = await modelo.predict(img)
            const top4  = [...preds]
                .sort((a, b) => b.probability - a.probability)
                .slice(0, 4)
                .map(p => ({
                    key:    p.className,
                    nombre: tmTraducir(p.className),
                    pct:    Math.round(p.probability * 100),
                }))
            setResultados(top4)
            setEstado("listo")
            if (top4[0].pct >= 40) onRazaDetectada(top4[0].nombre, top4[0].key)
        } catch (e) {
            console.error("TM error:", e)
            setMsgError("No se pudo analizar. Verifica la conexión e inténtalo de nuevo.")
            setEstado("error")
        }
    }

    const usarRaza = (nombre) => onRazaDetectada(nombre, null)

    // colores de la barra según porcentaje
    const colorBarra = (pct) => pct >= 70 ? "#27ae60" : pct >= 40 ? "#E07B27" : "#9e9e9e"
    const colorTexto = (pct) => pct >= 70 ? "#1a6b3a" : pct >= 40 ? "#8b4a00" : "#666"

    const esPerdida = modo === "perdida"

    if (!foto) return null

    return (
        <div style={{
            marginTop: 12,
            borderRadius: 16,
            border: `1.5px solid ${estado === "listo" ? "#27ae60" : "#1A7A7A"}`,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}>
            {/* ── Cabecera ── */}
            <div style={{
                background: estado === "listo" ? "#e8f8ef" : "#E0F2F2",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                borderBottom: estado !== "idle" ? "1px solid #d0e8d8" : "none",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                        background: estado === "listo" ? "#27ae60" : "#1A7A7A",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                    }}>
                        {estado === "cargando" ? "⏳" : estado === "listo" ? "✅" : estado === "error" ? "⚠️" : "🤖"}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: estado === "listo" ? "#0e6b3a" : "#0B5C5C" }}>
                            {estado === "listo"
                                ? "Raza identificada por IA"
                                : estado === "cargando"
                                    ? "Analizando imagen..."
                                    : "Identificar raza con IA"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b6b6b", marginTop: 1 }}>
                            {esPerdida
                                ? "La IA analiza tu foto y sugiere la raza automáticamente"
                                : "Detecta la raza para buscar coincidencias con reportes activos"}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={analizar}
                    disabled={estado === "cargando"}
                    style={{
                        padding: "8px 16px",
                        borderRadius: 20,
                        border: "none",
                        background: estado === "cargando" ? "#ccc" : estado === "listo" ? "#1A7A7A" : "#E07B27",
                        color: "white",
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: estado === "cargando" ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        transition: "background .2s",
                    }}>
                    {estado === "cargando" ? "Analizando..." : estado === "listo" ? "🔄 Reanálisis" : "🔍 Analizar foto"}
                </button>
            </div>

            {/* ── Error ── */}
            {estado === "error" && (
                <div style={{ padding: "10px 16px", fontSize: 12, color: "#c62828", background: "#fff0f0", fontWeight: 600 }}>
                    ⚠️ {msgError}
                </div>
            )}

            {/* ── Resultados ── */}
            {estado === "listo" && resultados.length > 0 && (
                <div style={{ padding: "14px 16px" }}>

                    {/* Subtítulo según modo */}
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: "#6b6b6b",
                        textTransform: "uppercase", letterSpacing: "0.5px",
                        marginBottom: 12,
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <span style={{ width: 3, height: 14, background: esPerdida ? "#27ae60" : "#E07B27", borderRadius: 2, display: "inline-block" }} />
                        {esPerdida ? "Razas más probables" : "Coincidencias detectadas"}
                    </div>

                    {/* Barras */}
                    {resultados.map((r, i) => (
                        <div key={r.key} style={{ marginBottom: i < resultados.length - 1 ? 14 : 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {i === 0 && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 800, padding: "2px 7px",
                                            borderRadius: 10, background: "#e8f8ef", color: "#1a6b3a",
                                            border: "1px solid #b2dfdb",
                                        }}>
                                            PRINCIPAL
                                        </span>
                                    )}
                                    <span style={{
                                        fontSize: 13, fontWeight: i === 0 ? 800 : 600,
                                        color: i === 0 ? "#0B5C5C" : "#555",
                                    }}>
                                        {r.nombre}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: 13, fontWeight: 800,
                                    color: colorTexto(r.pct),
                                    background: r.pct >= 40 ? (r.pct >= 70 ? "#e8f8ef" : "#fff3e0") : "#f5f5f5",
                                    padding: "2px 8px", borderRadius: 10,
                                }}>
                                    {r.pct}%
                                </span>
                            </div>

                            {/* Barra de progreso */}
                            <div style={{ height: 7, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%",
                                    width: `${r.pct}%`,
                                    background: colorBarra(r.pct),
                                    borderRadius: 4,
                                    transition: "width .7s cubic-bezier(.4,0,.2,1)",
                                }} />
                            </div>

                            {/* Botón "Usar esta raza" solo para la principal con >40% */}
                            {i === 0 && r.pct >= 40 && (
                                <button
                                    type="button"
                                    onClick={() => usarRaza(r.nombre)}
                                    style={{
                                        marginTop: 6,
                                        padding: "5px 14px",
                                        borderRadius: 10,
                                        border: "1.5px solid #27ae60",
                                        background: "#e8f8ef",
                                        color: "#0e6b3a",
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        transition: "all .15s",
                                    }}>
                                    ✓ Usar "{r.nombre}" como raza
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Aviso especial para avistamiento */}
                    {!esPerdida && resultados[0]?.pct >= 30 && (
                        <div style={{
                            marginTop: 16,
                            padding: "10px 12px",
                            background: "linear-gradient(135deg, #fff3e0, #fff8ec)",
                            borderRadius: 12,
                            border: "1.5px solid #E07B27",
                            display: "flex", gap: 10, alignItems: "flex-start",
                        }}>
                            <span style={{ fontSize: 20, flexShrink: 0 }}>📣</span>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: "#8b4a00", marginBottom: 3 }}>
                                    Notificación automática al dueño
                                </div>
                                <div style={{ fontSize: 11, color: "#6b3e00", lineHeight: 1.5 }}>
                                    Al publicar, se notificará a los dueños de <strong>{resultados[0].nombre}</strong> que
                                    tengan reportes activos cerca de tu ubicación.
                                    Ellos verán la similitud detectada por la IA.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function MultiFotoUploader({ fotos, onFotosChange, maxFotos = 3, requerida = false }) {
    const fileInputRef    = useRef(null)
    const cameraBackRef   = useRef(null)
    const cameraFrontRef  = useRef(null)
    const [showCamMenu, setShowCamMenu] = useState(false)

    const handleFotoChange = async (e) => {
        const files = Array.from(e.target.files)
        if (!files.length) return

        // Convertir cada archivo a base64 (necesario para guardar en BD)
        const toBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload  = () => resolve(reader.result)
            reader.onerror = reject
            // Comprimir antes de convertir (max 800px, 75% calidad)
            const img = new Image()
            img.onload = () => {
                const MAX = 800
                let w = img.width, h = img.height
                if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
                const canvas = document.createElement('canvas')
                canvas.width = w; canvas.height = h
                canvas.getContext('2d').drawImage(img, 0, 0, w, h)
                resolve(canvas.toDataURL('image/jpeg', 0.75))
            }
            img.onerror = reject
            img.src = URL.createObjectURL(file)
        })

        try {
            const nuevasFotos = await Promise.all(files.map(toBase64))
            onFotosChange([...fotos, ...nuevasFotos].slice(0, maxFotos))
        } catch (err) {
            console.error('Error procesando fotos:', err)
        }
        e.target.value = ""
        setShowCamMenu(false)
    }

    const eliminarFoto = (index) => onFotosChange(fotos.filter((_, i) => i !== index))
    const puedeAgregar = fotos.length < maxFotos

    return (
        <div>
            <input type="file" ref={cameraBackRef}  accept="image/*" capture="environment" onChange={handleFotoChange} style={{ display: "none" }} />
            <input type="file" ref={cameraFrontRef} accept="image/*" capture="user"        onChange={handleFotoChange} style={{ display: "none" }} />
            <input type="file" ref={fileInputRef}   accept="image/*" multiple              onChange={handleFotoChange} style={{ display: "none" }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                {fotos.map((foto, idx) => (
                    <div key={idx} className="pf-foto-item" style={{ position: "relative" }}>
                        <img src={foto} alt={`Foto ${idx + 1}`} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 14, border: `2.5px solid ${C.teal}`, display: "block" }} />
                        <button type="button" onClick={() => eliminarFoto(idx)}
                            style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", background: C.orange, color: "white", border: "2px solid white", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                            ×
                        </button>
                    </div>
                ))}



                {puedeAgregar && (
                    <div style={{ display: "flex", gap: 10, width: "100%", position: "relative" }}>


                        <button type="button" onClick={() => cameraBackRef.current.click()} className="pf-action-btn"
                            style={{ flex: 1, height: 120, borderRadius: 14, border: `2px dashed ${C.teal}`, background: C.tealLight, color: C.teal, cursor: "pointer", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            📷 Cámara
                        </button>

                        <button type="button" onClick={() => { setShowCamMenu(false); fileInputRef.current.click() }} className="pf-action-btn"
                            style={{ flex: 1, height: 120, borderRadius: 14, border: `2px dashed ${C.beige}`, background: C.orangeLight, color: C.orange, cursor: "pointer", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                        🖼 Galería
                        </button>
                    </div>
                )}



                {puedeAgregar && fotos.length > 0 && Array.from({ length: Math.min(maxFotos - fotos.length - 1, 2) }, (_, i) => (
                    <div key={`extra-${i}`} onClick={() => fileInputRef.current.click()}
                        style={{ width: 96, height: 96, borderRadius: 14, border: `2px dashed ${C.beige}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 26, gap: 2, background: C.surface, cursor: "pointer" }}>
                        <span>+</span>
                        <span style={{ fontSize: 10, fontWeight: 700 }}>Foto {fotos.length + i + 2}</span>
                    </div>
                ))}
            </div>

            <div style={{ fontSize: 12, color: fotos.length === 0 && requerida ? C.orange : C.muted, marginTop: 4, fontWeight: 600 }}>
                {fotos.length}/{maxFotos} fotos · {fotos.length === 0 && requerida ? "⚠️ Se requiere al menos 1 foto para publicar" : "Usa cámara trasera, frontal/webcam o galería"}
            </div>
        </div>
    )
}

// ── COMPONENTE: SELECTOR DE COLOR ─────────────────────────────
function SelectorColor({ value, otroValor, onChange, onOtroChange }) {
    const [mostrarOtro, setMostrarOtro] = useState(value === "Otro")

    const handleChange = (e) => {
        const newValue = e.target.value
        onChange(newValue)
        if (newValue === "Otro") {
            setMostrarOtro(true)
        } else {
            setMostrarOtro(false)
            onOtroChange("")
        }
    }

    return (
        <div>
            <select value={value} onChange={handleChange} className="pf-input" style={S.input}>
                {COLORES_PERROS.map(c => <option key={c}>{c}</option>)}
            </select>
            {mostrarOtro && (
                <input type="text" placeholder="Describe el color..." value={otroValor}
                    onChange={(e) => onOtroChange(e.target.value)}
                    className="pf-input" style={{ ...S.input, marginTop: 8 }} />
            )}
        </div>
    )
}

// ── COMPONENTE: SELECTOR DE SEXO ─────────────────────────────
function SelectorSexo({ value, onChange }) {
    return (
        <div style={{ display: "flex", gap: 10 }}>
            {["Macho", "Hembra"].map(sexo => (
                <button key={sexo} type="button" onClick={() => onChange(sexo)} className="pf-toggle-btn"
                    style={{
                        flex: 1, padding: "10px 0", borderRadius: 12, border: "2px solid",
                        fontWeight: 700, fontSize: 14, cursor: "pointer",
                        borderColor: value === sexo ? C.teal : C.beige,
                        background: value === sexo ? C.teal : C.white,
                        color: value === sexo ? "white" : C.muted,
                    }}>
                    {sexo}
                </button>
            ))}
        </div>
    )
}

// ── COMPONENTE: MODAL DETALLE ──────────────────────────────────
function ModalDetalle({ reporte, onCerrar, onEditar, onRestaurar, onVerMapa, soloLectura = false }) {
    const [editando, setEditando] = useState(false)
    const [form, setForm] = useState({ ...reporte })
    const [colorOtro, setColorOtro] = useState(reporte.colorOtro || "")
    const [fotosEdit, setFotosEdit] = useState(reporte.fotos || [])
    const [isDirty, setIsDirty] = useState(false)
    const [guardado, setGuardado] = useState(false)

    if (!reporte) return null

    const handleFieldChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }))
        setIsDirty(true)
    }

    const handleColorChange = (value) => {
        setForm(prev => ({ ...prev, color: value }))
        setIsDirty(true)
    }

    const handleFotosChange = (nuevasFotos) => {
        setFotosEdit(nuevasFotos)
        setIsDirty(true)
    }

    const handleGuardar = () => {
        if (isDirty) {
            onEditar({ ...form, colorOtro, fotos: fotosEdit })
            setEditando(false)
            setIsDirty(false)
            setGuardado(true)
            setTimeout(() => setGuardado(false), 2500)
        }
    }

    const handleRestaurar = () => {
        onRestaurar(reporte.id)
        onCerrar()
    }

    const mostrarBotonRestaurar = reporte.tipo !== "posible_perdido" && reporte.estado !== "resuelto"
    const colorMostrar = form.color === "Otro" && colorOtro ? colorOtro : form.color
    const estadoInfo = ESTADO_STYLE[reporte.estado] || {}

    return (
        <div style={S.modalOverlay} onClick={onCerrar}>
            <div className="pf-scroll" style={{ ...S.modalBox, maxWidth: 560, maxHeight: "92vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
                <div style={S.modalHeader}>
                    <div>
                        <h3 style={{ ...S.modalTitle, marginBottom: 3 }}>{reporte.nombre || "Mascota"}</h3>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.2)", color: "white" }}>
                            {estadoInfo.label}
                        </span>
                    </div>
                    <button onClick={onCerrar} style={S.closeBtn}>×</button>
                </div>

                <div style={{ padding: "20px 24px" }}>
                    {guardado && (
                        <div style={{ background: "#e8f8ef", color: "#27ae60", padding: "10px 14px", borderRadius: 12, marginBottom: 16, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8, animation: "fadeInUp 0.3s ease" }}>
                            Cambios guardados correctamente
                        </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                        {editando ? (
                            <div>
                                <label style={S.label}>FOTOS (Máximo 3)</label>
                                <MultiFotoUploader fotos={fotosEdit} onFotosChange={handleFotosChange} maxFotos={3} requerida={true} />
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
                                {(reporte.fotos || [reporte.foto]).filter(Boolean).map((foto, idx) => (
                                    <img key={idx} src={foto} alt={`${reporte.nombre} ${idx + 1}`}
                                        style={{ width: 110, height: 110, borderRadius: 16, objectFit: "cover", border: `3px solid ${C.teal}`, flexShrink: 0 }} />
                                ))}
                            </div>
                        )}
                    </div>

                    {!editando && reporte.tipo !== "posible_perdido" && (
                        <Indicador30Dias diasActivo={reporte.diasActivo} />
                    )}

                    <div className="pf-form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={S.label}>NOMBRE</label>
                            {editando
                                ? <input value={form.nombre} onChange={e => handleFieldChange("nombre", e.target.value)} className="pf-input" style={S.input} />
                                : <div style={S.valorField}>{reporte.nombre || "—"}</div>}
                        </div>
                        <div>
                            <label style={S.label}>RAZA</label>
                            {editando
                                ? <select value={form.raza} onChange={e => handleFieldChange("raza", e.target.value)} className="pf-input" style={S.input}>{RAZAS.map(r => <option key={r}>{r}</option>)}</select>
                                : <div style={S.valorField}>{reporte.raza || "—"}</div>}
                        </div>
                        <div>
                            <label style={S.label}>COLOR / SEÑAS</label>
                            {editando
                                ? <SelectorColor value={form.color} otroValor={colorOtro} onChange={handleColorChange} onOtroChange={setColorOtro} />
                                : <div style={S.valorField}>{colorMostrar || "—"}</div>}
                        </div>
                        <div>
                            <label style={S.label}>SEXO</label>
                            {editando
                                ? <SelectorSexo value={form.sexo || ""} onChange={v => handleFieldChange("sexo", v)} />
                                : <div style={S.valorField}>{reporte.sexo || "—"}</div>}
                        </div>
                        <div>
                            <label style={S.label}>Fecha de pérdida</label>
                            {editando
                                ? <input type="date" value={form.fecha ? form.fecha.split('/').reverse().join('-') : ""} onChange={e => { const [year, month, day] = e.target.value.split('-'); handleFieldChange("fecha", `${day}/${month}/${year}`) }} className="pf-input" style={S.input} />
                                : <div style={S.valorField}>{reporte.fecha || "—"}</div>}
                        </div>
                        <div>
                            <label style={S.label}>Hora aproximada</label>
                            {editando
                                ? <SelectorHora value={form.horaAproximada || ""} onChange={e => handleFieldChange("horaAproximada", e.target.value)} name="horaAproximada" />
                                : <div style={S.valorField}>{reporte.horaAproximada ? (() => { const [h, m] = (reporte.horaAproximada || "").split(":"); const hNum = parseInt(h || 0, 10); const p = hNum >= 12 ? "PM" : "AM"; const h12 = hNum === 0 ? 12 : hNum > 12 ? hNum - 12 : hNum; return `${String(h12).padStart(2, "0")}:${m || "00"} ${p}` })() : "—"}</div>}
                        </div>
                        <div>
                            <label style={S.label}>TELÉFONO</label>
                            {editando
                                ? <input value={form.telefono} onChange={e => handleFieldChange("telefono", e.target.value)} className="pf-input" style={S.input} />
                                : <div style={S.valorField}>{reporte.telefono || "—"}</div>}
                        </div>
                        {reporte.tipo !== "posible_perdido" && (
                            <div>
                                <label style={S.label}>Registro automático</label>
                                <div style={{ ...S.valorField, fontSize: 13 }}>{reporte.timestampRegistro ? new Date(reporte.timestampRegistro).toLocaleString("es-PE") : "—"}</div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={S.label}>DESCRIPCIÓN</label>
                        {editando
                            ? <textarea value={form.descripcion} onChange={e => handleFieldChange("descripcion", e.target.value)} rows={3} className="pf-input" style={{ ...S.input, resize: "vertical" }} />
                            : <div style={{ background: C.surface, padding: "12px 14px", borderRadius: 14, fontSize: 14, color: C.text, border: `1px solid ${C.beige}`, lineHeight: 1.6 }}>{reporte.descripcion || "Sin descripción"}</div>}
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={S.label}>Perdido en (ubicación)</label>
                        {editando ? (
                            <input value={form.lugar} onChange={e => handleFieldChange("lugar", e.target.value)} className="pf-input" style={S.input} placeholder="Dirección..." />
                        ) : (
                            <div style={{ background: C.orangeLight, padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.beige}` }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: C.tealDark }}>{reporte.direccionCompleta || reporte.lugar || "—"}</span>
                            </div>
                        )}
                    </div>

                    {!soloLectura && (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {editando ? (
                                <>
                                    <button onClick={handleGuardar} disabled={!isDirty} className="pf-action-btn"
                                        style={{ flex: 1, padding: "13px 0", background: isDirty ? C.teal : "#ccc", color: "white", border: "none", borderRadius: 14, fontWeight: 800, cursor: isDirty ? "pointer" : "not-allowed", fontSize: 15 }}>
                                        Guardar cambios
                                    </button>
                                    <button onClick={() => { setEditando(false); setForm({ ...reporte }); setIsDirty(false) }}
                                        style={{ padding: "13px 18px", background: C.beigeLight, color: C.muted, border: "none", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 15 }}>
                                        Cancelar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setEditando(true)} className="pf-action-btn"
                                        style={{ flex: 1, padding: "13px 0", background: C.orange, color: "white", border: "none", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 15 }}>
                                        Editar detalles
                                    </button>
                                    <button onClick={() => onVerMapa(reporte)} className="pf-action-btn"
                                        style={{ flex: 1, padding: "13px 0", background: C.teal, color: "white", border: "none", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 15 }}>
                                        Ver en mapa
                                    </button>
                                </>
                            )}
                            {mostrarBotonRestaurar && (
                                <div className="pf-restore-wrap" style={{ width: "100%", marginTop: 4 }}>
                                    <button onClick={handleRestaurar} className="pf-action-btn"
                                        style={{ width: "100%", padding: "13px 0", background: `linear-gradient(135deg, ${C.tealDark}, ${C.teal})`, color: "white", border: "none", borderRadius: 14, fontWeight: 800, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                        🔄 Restaurar publicación por 30 días
                                    </button>
                                    <div className="pf-restore-tooltip" style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", width: 260, background: C.tealDark, color: "white", padding: "10px 14px", borderRadius: 12, fontSize: 12.5, boxShadow: "0 8px 24px rgba(0,0,0,0.22)", lineHeight: 1.6, zIndex: 200, textAlign: "center", fontWeight: 500, pointerEvents: "none" }}>
                                        <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 12, height: 12, background: C.tealDark, borderRadius: 2, rotate: "45deg" }} />
                                        Las publicaciones expiran después de 30 días. Desde aquí puedes volver a activarla por otros 30 días.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── COMPONENTE: FORMULARIO PERDIDA ─────────────────────────────
function FormPerdida({ onPublicar, onMostrarAlerta }) {
    const [form, setForm] = useState({
        nombre: "", raza: "", color: "", sexo: "",
        telefono: "", descripcion: "", horaAproximada: "", fechaSeleccionada: ""
    })
    const [colorOtro, setColorOtro] = useState("")
    const [fotos, setFotos] = useState([])
    const [enviando, setEnviando] = useState(false)

    // ── Estado del nuevo mapa ──
    const [pinPosicion, setPinPosicion] = useState(null)
    const [ubicacionTexto, setUbicacionTexto] = useState("")

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (fotos.length === 0) {
            onMostrarAlerta("Debes agregar al menos una foto para publicar el reporte.", "error")
            return
        }
        setEnviando(true)
        const colorFinal = form.color === "Otro" ? colorOtro : form.color
        const ahora = new Date()
        let fechaFinal = ahora.toLocaleDateString("es-PE")
        if (form.fechaSeleccionada) {
            const [year, month, day] = form.fechaSeleccionada.split('-')
            fechaFinal = `${day}/${month}/${year}`
        }
        try {
            await onPublicar({
                ...form,
                color: colorFinal,
                tipo: "perdido",
                fotos,
                estado: "activo",
                fecha: fechaFinal,
                timestampRegistro: ahora.toISOString(),
                lugar: ubicacionTexto || "Puno",
                direccionCompleta: ubicacionTexto || "Puno",
                lat: pinPosicion?.lat ?? -15.8402,
                lng: pinPosicion?.lng ?? -70.0219,
            })
            onMostrarAlerta("¡Reporte publicado con éxito! Ya aparece en el mapa.", "success")
            setForm({ nombre: "", raza: "", color: "", sexo: "", telefono: "", descripcion: "", horaAproximada: "", fechaSeleccionada: "" })
            setColorOtro("")
            setFotos([])
            setPinPosicion(null)
            setUbicacionTexto("")
        } catch (err) {
            onMostrarAlerta(`❌ ${err.message || "Error al guardar. Intenta de nuevo."}`, "error")
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div style={S.formContainer}>
            <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: C.tealDark }}>Reportar perdida de mi perro</h3>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>FOTOS (Máximo 3) <span style={{ color: C.orange }}>*</span></label>
                    <MultiFotoUploader fotos={fotos} onFotosChange={setFotos} maxFotos={3} requerida={true} />
                    <DetectorRazaIA
                        foto={fotos[0] || null}
                        onRazaDetectada={(nombre) => {
                            const match = RAZAS.find(r => r.toLowerCase().includes(nombre.toLowerCase().split("/")[0].trim()))
                            if (match) setForm(prev => ({ ...prev, raza: match }))
                        }}
                        modo="perdida"
                    />
                    <DetectorMobileNet
                        foto={fotos[0] || null}
                        onRazaDetectada={(nombre) => {
                            const match = RAZAS.find(r => r.toLowerCase().includes(nombre.toLowerCase().split("/")[0].trim()))
                            if (match) setForm(prev => ({ ...prev, raza: match }))
                        }}
                    />
                </div>

                <div className="pf-form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div><label style={S.label}>NOMBRE</label><input name="nombre" value={form.nombre} onChange={handleChange} className="pf-input" style={S.input} required placeholder="Nombre de tu mascota" /></div>
                    <div>
                        <label style={S.label}>RAZA</label>
                        <select name="raza" value={form.raza} onChange={handleChange} className="pf-input" style={S.input} required>
                            <option value="">Seleccionar raza</option>
                            {RAZAS.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div><label style={S.label}>COLOR / SEÑAS</label><SelectorColor value={form.color} otroValor={colorOtro} onChange={v => setForm({ ...form, color: v })} onOtroChange={setColorOtro} /></div>
                    <div><label style={S.label}>SEXO</label><SelectorSexo value={form.sexo} onChange={v => setForm({ ...form, sexo: v })} /></div>
                </div>

                {/* ── SECCIÓN UBICACIÓN CON MAPA NUEVO ── */}
                <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Perdido en (ubicación)</label>
                    <MapaPickerNuevo
                        pinPosicion={pinPosicion}
                        setPinPosicion={setPinPosicion}
                        ubicacionTexto={ubicacionTexto}
                        setUbicacionTexto={setUbicacionTexto}
                        onDireccionCompleta={(v) => { /* ya se guarda en ubicacionTexto */ }}
                    />
                </div>

                <div className="pf-form-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                        <label style={S.label}>Fecha de pérdida</label>
                        <input type="date" name="fechaSeleccionada" value={form.fechaSeleccionada || ""} onChange={handleChange} className="pf-input" style={S.input} />
                    </div>
                    <div>
                        <label style={S.label}>Hora aproximada</label>
                        <SelectorHora value={form.horaAproximada} onChange={handleChange} name="horaAproximada" />
                    </div>
                    <div>
                        <label style={S.label}>TELÉFONO</label>
                        <input name="telefono" value={form.telefono} onChange={handleChange} className="pf-input" style={S.input} required placeholder="+51 9XX XXX XXX" />
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>DESCRIPCIÓN</label>
                    <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} className="pf-input" style={{ ...S.input, resize: "vertical" }} placeholder="Características especiales, comportamiento, collar, chip..." />
                </div>

                <button type="submit" className="pf-action-btn" disabled={enviando}
                    style={{ width: "100%", padding: "15px 0", background: enviando ? "#ccc" : C.teal, color: "white", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: enviando ? "not-allowed" : "pointer" }}>
                    {enviando ? "Guardando..." : "Publicar reporte de pérdida"}
                </button>
            </form>
        </div>
    )
}

// ── COMPONENTE: FORMULARIO POSIBLE PERDIDA ─────────────────────
function FormPosiblePerdida({ onPublicar, onMostrarAlerta }) {
    const [form, setForm] = useState({ raza: "", color: "", telefono: "", descripcion: "" })
    const [colorOtro, setColorOtro] = useState("")
    const [fotos, setFotos] = useState([])
    const [enviando, setEnviando] = useState(false)

    // ── Estado del nuevo mapa ──
    const [pinPosicion, setPinPosicion] = useState(null)
    const [ubicacionTexto, setUbicacionTexto] = useState("")

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (fotos.length === 0) {
            onMostrarAlerta("Debes agregar al menos una foto para publicar el reporte.", "error")
            return
        }
        setEnviando(true)
        const colorFinal = form.color === "Otro" ? colorOtro : form.color
        const ahora = new Date()
        try {
            await onPublicar({
                ...form,
                color: colorFinal,
                nombre: "Mascota en avistamiento",
                tipo: "posible_perdido",
                fotos,
                estado: "posible_perdido",
                fecha: ahora.toLocaleDateString("es-PE"),
                horaAproximada: ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
                timestampRegistro: ahora.toISOString(),
                lugar: ubicacionTexto || "Puno",
                direccionCompleta: ubicacionTexto || "Puno",
                lat: pinPosicion?.lat ?? -15.8402,
                lng: pinPosicion?.lng ?? -70.0219,
            })
            onMostrarAlerta("Avistamiento publicado con éxito.", "success")
            setForm({ raza: "", color: "", telefono: "", descripcion: "" })
            setColorOtro("")
            setFotos([])
            setPinPosicion(null)
            setUbicacionTexto("")
        } catch (err) {
            onMostrarAlerta(`❌ ${err.message || "Error al guardar. Intenta de nuevo."}`, "error")
        } finally {
            setEnviando(false)
        }
    }

    const ahora = new Date()

    return (
        <div style={S.formContainer}>
            <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: C.tealDark }}>Reportar un perro encontrado</h3>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>FOTOS (Máximo 3) <span style={{ color: C.orange }}>*</span></label>
                    <MultiFotoUploader fotos={fotos} onFotosChange={setFotos} maxFotos={3} requerida={true} />
                    <DetectorRazaIA
                        foto={fotos[0] || null}
                        onRazaDetectada={(nombre) => {
                            const match = RAZAS.find(r => r.toLowerCase().includes(nombre.toLowerCase().split("/")[0].trim()))
                            if (match) setForm(prev => ({ ...prev, raza: match }))
                        }}
                        modo="avistamiento"
                    />
                    <DetectorMobileNet
                        foto={fotos[0] || null}
                        onRazaDetectada={(nombre) => {
                            const match = RAZAS.find(r => r.toLowerCase().includes(nombre.toLowerCase().split("/")[0].trim()))
                            if (match) setForm(prev => ({ ...prev, raza: match }))
                        }}
                    />
                </div>

                <div className="pf-form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                        <label style={S.label}>RAZA (si la conoces)</label>
                        <select name="raza" value={form.raza} onChange={handleChange} className="pf-input" style={S.input}>
                            <option value="">No lo sé</option>
                            {RAZAS.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div><label style={S.label}>COLOR / SEÑAS</label><SelectorColor value={form.color} otroValor={colorOtro} onChange={v => setForm({ ...form, color: v })} onOtroChange={setColorOtro} /></div>
                </div>

                {/* Fecha y hora automáticas */}
                <div style={{ marginBottom: 14, background: C.tealLight, borderRadius: 14, padding: "12px 16px", border: `1px solid ${C.beige}` }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: C.tealDark, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>Registro automático del sistema</div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: C.teal }}>
                        {ahora.toLocaleDateString("es-PE")} — {ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>La fecha y hora se registran automáticamente al publicar</div>
                </div>

                {/* ── SECCIÓN UBICACIÓN CON MAPA NUEVO ── */}
                <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Visto en (ubicación)</label>
                    <MapaPickerNuevo
                        pinPosicion={pinPosicion}
                        setPinPosicion={setPinPosicion}
                        ubicacionTexto={ubicacionTexto}
                        setUbicacionTexto={setUbicacionTexto}
                        onDireccionCompleta={(v) => { /* ya se guarda en ubicacionTexto */ }}
                    />
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>TELÉFONO DE CONTACTO (opcional)</label>
                    <input name="telefono" value={form.telefono} onChange={handleChange} className="pf-input" style={S.input} placeholder="+51 9XX XXX XXX" />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>DESCRIPCIÓN</label>
                    <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} className="pf-input" style={{ ...S.input, resize: "vertical" }} placeholder="Describe dónde viste a la mascota, su comportamiento, hacia dónde iba..." />
                </div>

                <button type="submit" className="pf-action-btn" disabled={enviando}
                    style={{ width: "100%", padding: "15px 0", background: enviando ? "#ccc" : C.teal, color: "white", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 16, cursor: enviando ? "not-allowed" : "pointer" }}>
                    {enviando ? "Guardando..." : "Publicar avistamiento"}
                </button>
            </form>
        </div>
    )
}

// ── ESTILOS BASE ──────────────────────────────────────────────
const S = {
    input: {
        width: "100%", padding: "11px 14px",
        borderRadius: 12, border: `1.5px solid #D9C4A0`,
        background: "#FFFFFF", fontSize: 14, fontWeight: 500,
        boxSizing: "border-box", transition: "all 0.2s ease",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    label: {
        fontSize: 11, fontWeight: 800, color: "#1A7A7A",
        textTransform: "uppercase", letterSpacing: "0.7px",
        display: "block", marginBottom: 6,
    },
    modalOverlay: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(11,20,30,0.65)", backdropFilter: "blur(4px)",
        zIndex: 1000, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20,
    },
    modalBox: {
        background: "#FFFFFF", borderRadius: 28, width: "100%",
        display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.28)",
        animation: "fadeInUp 0.3s ease",
    },
    modalHeader: {
        padding: "18px 22px",
        background: `linear-gradient(135deg, #0B5C5C 0%, #1A7A7A 100%)`,
        color: "white", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        flexShrink: 0,
    },
    modalTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "white" },
    closeBtn: {
        background: "rgba(255,255,255,0.2)", border: "none",
        fontSize: 22, cursor: "pointer", color: "white",
        width: 34, height: 34, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        lineHeight: 1, flexShrink: 0,
    },
    formContainer: {
        background: "#FFFFFF", borderRadius: 24, padding: 28,
        border: `1px solid #D9C4A0`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    },
    valorField: {
        fontSize: 15, fontWeight: 600, color: "#1a1a1a",
        padding: "10px 14px", background: "#FAFAF8",
        borderRadius: 12, border: `1px solid #D9C4A0`,
        minHeight: 42,
    },
}

// ── TARJETA DE REPORTE ─────────────────────────────────────────
// ── Componente: Panel de similitudes IA ─────────────────────────────────
function PanelSimilitudes({ items, modo, onVerDetalle }) {
    // modo: "avistamientos" | "perdidos"
    const [expandido, setExpandido] = useState(false)
    // Si no hay items aún, mostrar mensaje de búsqueda
    const sinResultados = !items || items.length === 0

    const colorSim = (pct) => pct >= 80 ? "#27ae60" : pct >= 60 ? "#E07B27" : "#1A7A7A"
    const bgSim    = (pct) => pct >= 80 ? "#e8f8ef" : pct >= 60 ? "#fff3e0" : "#E0F2F2"

    const titulo = sinResultados
        ? (modo === "avistamientos" ? "🔍 Sin avistamientos similares aún" : "🐾 Sin reportes perdidos similares aún")
        : modo === "avistamientos"
            ? `🔍 ${items.length} avistamiento${items.length > 1 ? "s" : ""} similar${items.length > 1 ? "es" : ""} encontrado${items.length > 1 ? "s" : ""}`
            : `🐾 ${items.length} coincidencia${items.length > 1 ? "s" : ""} con reportes perdidos`

    return (
        <div style={{ marginTop: 10, borderRadius: 12, border: "1.5px solid #1A7A7A", overflow: "hidden" }}>
            {/* Cabecera colapsable */}
            <button
                type="button"
                onClick={() => setExpandido(v => !v)}
                style={{
                    width: "100%", padding: "9px 14px",
                    background: "#E0F2F2", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", fontFamily: "inherit",
                }}>
                <span style={{ fontWeight: 800, fontSize: 12, color: "#0B5C5C", display: "flex", alignItems: "center", gap: 6 }}>
                    {titulo}
                </span>
                <span style={{ fontSize: 11, color: "#1A7A7A", fontWeight: 700 }}>
                    {expandido ? "▲ Ocultar" : "▼ Ver similitudes"}
                </span>
            </button>

            {expandido && (
                <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {sinResultados ? (
                        <div style={{ textAlign: "center", padding: "12px 0", color: "#6b6b6b", fontSize: 12 }}>
                            <div style={{ fontSize: 22, marginBottom: 6 }}>
                                {modo === "avistamientos" ? "📭" : "🔎"}
                            </div>
                            <div style={{ fontWeight: 700, marginBottom: 3 }}>
                                {modo === "avistamientos"
                                    ? "Aún no hay avistamientos similares"
                                    : "Aún no hay reportes perdidos similares"}
                            </div>
                            <div style={{ fontSize: 11, color: "#9e9e9e" }}>
                                {modo === "avistamientos"
                                    ? "Cuando alguien reporte un avistamiento de una mascota similar, aparecerá aquí automáticamente."
                                    : "Cuando coincida con algún perro perdido reportado, aparecerá aquí automáticamente."}
                            </div>
                        </div>
                    ) : items.map((item, i) => (
                        <div key={item.id || i} style={{
                            display: "flex", gap: 10, alignItems: "center",
                            padding: "8px 10px", borderRadius: 10,
                            background: bgSim(item.similitud),
                            border: `1px solid ${colorSim(item.similitud)}40`,
                        }}>
                            {/* Foto pequeña */}
                            <img
                                src={item.fotos?.[0] || item.foto}
                                alt=""
                                style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: `2px solid ${colorSim(item.similitud)}` }}
                            />
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: 13, color: "#0B5C5C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {modo === "avistamientos"
                                        ? `Avistado en ${item.lugar || "Puno"}`
                                        : item.nombre || "Mascota perdida"}
                                </div>
                                <div style={{ fontSize: 11, color: "#6b6b6b", marginTop: 1 }}>
                                    {item.raza} · {item.fecha}
                                    {modo === "perdidos" && item.lugar && <span> · {item.lugar}</span>}
                                </div>
                            </div>
                            {/* % similitud */}
                            <div style={{ textAlign: "center", flexShrink: 0 }}>
                                <div style={{
                                    fontSize: 15, fontWeight: 900, color: colorSim(item.similitud),
                                    background: "white", borderRadius: 10, padding: "4px 8px",
                                    border: `1.5px solid ${colorSim(item.similitud)}`,
                                }}>
                                    {item.similitud}%
                                </div>
                                <div style={{ fontSize: 9, color: "#6b6b6b", marginTop: 2, fontWeight: 700 }}>
                                    SIMILITUD
                                </div>
                            </div>
                            {/* Botón ver */}
                            {onVerDetalle && (
                                <button
                                    type="button"
                                    onClick={() => onVerDetalle(item)}
                                    style={{
                                        padding: "6px 10px", borderRadius: 8, border: "none",
                                        background: "#1A7A7A", color: "white",
                                        fontSize: 10, fontWeight: 800, cursor: "pointer", flexShrink: 0,
                                    }}>
                                    Ver
                                </button>
                            )}
                        </div>
                    ))}
                    {!sinResultados && modo === "perdidos" && (
                        <div style={{ fontSize: 11, color: "#6b6b6b", textAlign: "center", paddingTop: 4, borderTop: "1px solid #E0F2F2" }}>
                            📣 Los dueños de estos perros serán notificados de tu avistamiento
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function TarjetaReporte({ r, onVerDetalle, labelDetalle, onMarcarEncontrado, onCartel, onVerMapa, onReportarAvistamiento, onComentarios, onRestaurar, mostrarEncontrado, mostrarCartel, mostrarAvistamiento, mostrarComentarios, mostrarMapa, mostrarRestaurar, similitudes, modoSimilitud, onVerDetalleSimilitud }) {
    const estado = r.estado === "resuelto" ? "Encontrado" : (r.tipo === "posible_perdido" ? "Posiblemente Perdido" : "Perdido")
    const estadoColor = r.estado === "resuelto" ? C.success : (r.tipo === "posible_perdido" ? "#CC8800" : C.orange)
    const estadoBg = r.estado === "resuelto" ? C.successLight : (r.tipo === "posible_perdido" ? "#fffde0" : C.orangeLight)
    const borderColor = r.estado === "resuelto" ? "#b2dfdb" : (r.tipo === "posible_perdido" ? "#ffe082" : "#f5c6a0")
    const nombre = r.tipo === "posible_perdido" ? "Mascota en avistamiento" : r.nombre

    const calcularDias = () => {
        if (!r.fecha) return 0
        try {
            const parts = r.fecha.split('/')
            if (parts.length !== 3) return r.diasActivo || 0
            const fechaDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
            const diff = Math.floor((Date.now() - fechaDate.getTime()) / (1000 * 60 * 60 * 24))
            return Math.min(Math.max(diff, 0), 30)
        } catch { return r.diasActivo || 0 }
    }
    const dias = calcularDias()
    const mostrarBarras = r.estado !== "resuelto"

    return (
        <div className="pf-report-card" style={{ background: C.white, borderRadius: 20, padding: "16px 18px", marginBottom: 12, display: "flex", gap: 16, alignItems: "flex-start", border: `1px solid ${borderColor}`, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <img src={r.fotos?.[0] || r.foto} alt={nombre}
                style={{ width: 80, height: 80, borderRadius: 16, objectFit: "cover", border: `2.5px solid ${estadoColor}`, flexShrink: 0, marginTop: 2 }} />

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: C.tealDark }}>{nombre}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: estadoBg, color: estadoColor, whiteSpace: "nowrap" }}>
                        {estado}
                    </span>
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 2, fontWeight: 500 }}>
                    Visto en: <span style={{ color: C.text, fontWeight: 600 }}>{r.direccionCompleta || r.lugar}</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: mostrarBarras ? 6 : 0 }}>
                    Fecha de pérdida: <span style={{ color: C.text, fontWeight: 600 }}>{r.fecha}</span>
                </div>

                {mostrarBarras && (
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: dias >= 25 ? C.orange : C.muted, marginBottom: 3 }}>
                            Publicación activa: día {dias}/30
                            {dias >= 30 && " · ⚠️ Expirada — ve a Ver detalles para restaurar"}
                        </div>
                        <div className="pf-dias-bar">
                            {Array.from({ length: 30 }, (_, i) => (
                                <div key={i} className="pf-dia-barra" style={{ background: i < dias ? (dias >= 25 ? C.orange : C.teal) : C.beige }} />
                            ))}
                        </div>
                    </div>
                )}
                {similitudes !== undefined && (
                    <PanelSimilitudes
                        items={similitudes || []}
                        modo={modoSimilitud}
                        onVerDetalle={onVerDetalleSimilitud}
                    />
                )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
                {onVerDetalle && (
                    <button onClick={() => onVerDetalle(r)} className="pf-action-btn"
                        style={{ padding: "9px 14px", background: C.tealLight, color: C.teal, border: "none", borderRadius: 11, fontWeight: 700, fontSize: 13 }}>
                        {labelDetalle || "Ver detalles"}
                    </button>
                )}
                {mostrarEncontrado && (
                    <button onClick={() => onMarcarEncontrado(r.id)} className="pf-action-btn"
                        style={{ padding: "9px 14px", background: C.successLight, color: C.success, border: "none", borderRadius: 11, fontWeight: 700, fontSize: 13 }}>
                        La encontré
                    </button>
                )}
                {mostrarAvistamiento && (
                    <button onClick={() => onReportarAvistamiento(r.id)} className="pf-action-btn"
                        style={{ padding: "9px 14px", background: C.successLight, color: C.success, border: "none", borderRadius: 11, fontWeight: 700, fontSize: 13 }}>
                        Vi esta mascota
                    </button>
                )}
                {mostrarComentarios && (
                    <div className="pf-comment-wrap">
                        <button onClick={() => onComentarios(r)} className="pf-action-btn"
                            style={{ padding: "9px 14px", background: C.beigeLight, color: C.muted, border: "none", borderRadius: 11, fontWeight: 700, fontSize: 13, width: "100%" }}>
                            Comentarios{r.comentarios?.length > 0 ? ` (${r.comentarios.length})` : ""}
                        </button>
                        <div className="pf-comment-tooltip">
                            Comenta si viste esta mascota o tienes información que pueda ayudar 🐾
                        </div>
                    </div>
                )}
                {mostrarMapa && (
                    <button onClick={() => onVerMapa(r)} className="pf-action-btn"
                        style={{ padding: "9px 14px", background: C.tealLight, color: C.teal, border: "none", borderRadius: 11, fontWeight: 700, fontSize: 13 }}>
                        Ver mapa
                    </button>
                )}
                {mostrarCartel && (
                    <button onClick={() => onCartel(r)} className="pf-action-btn"
                        style={{ padding: "9px 14px", background: C.orangeLight, color: C.orange, border: "none", borderRadius: 11, fontWeight: 700, fontSize: 13 }}>
                        Cartel
                    </button>
                )}
                {mostrarRestaurar && (
                    <button onClick={() => onRestaurar(r.id)} className="pf-action-btn"
                        style={{ padding: "9px 14px", background: C.tealLight, color: C.tealDark, border: `1px solid ${C.teal}`, borderRadius: 11, fontWeight: 700, fontSize: 12 }}>
                        🔄 Restaurar publicación
                    </button>
                )}
            </div>
        </div>
    )
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────
export default function Reportes() {
    const navigate = useNavigate()
    const [tab, setTab] = useState("reportesGenerales")
    const [reportes, setReportes] = useState([])
    const [modalData, setModalData] = useState(null)
    const [detalleReporte, setDetalleReporte] = useState(null)
    const [comentariosReporte, setComentariosReporte] = useState(null)
    const [alerta, setAlerta] = useState(null)
    const [confirmarId, setConfirmarId] = useState(null)
    const [usuarioActual, setUsuarioActual] = useState(null)
    const [authCargando, setAuthCargando] = useState(true)
    const [modalAuth, setModalAuth] = useState(false)
    const [modalAuthMensaje, setModalAuthMensaje] = useState("reporte")

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(u => {
            setUsuarioActual(u)
            setAuthCargando(false)
        })
        return () => unsub()
    }, [])

// Carga scripts TensorFlow.js + Teachable Machine + MobileNet (lazy, una sola vez)
    useEffect(() => {
        const cargar = async () => {
            if (!window.tf) {
                const s1 = document.createElement("script")
                s1.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"
                document.head.appendChild(s1)
                await new Promise(res => { s1.onload = res; s1.onerror = res })
            }
            if (!window.tmImage) {
                const s2 = document.createElement("script")
                s2.src = "https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"
                document.head.appendChild(s2)
                await new Promise(res => { s2.onload = res; s2.onerror = res })
            }
            if (!window.mobilenet) {
                const s3 = document.createElement("script")
                s3.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@latest/dist/mobilenet.min.js"
                document.head.appendChild(s3)
            }
        }
        cargar().catch(() => {})
    }, [])

    // Carga reportes desde la BD al montar
    const cargarReportes = () => {
        fetch(`${API}/api/reportes`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (Array.isArray(data) && data.length > 0)
                    setReportes(data.map(dbToFrontend))
            })
            .catch(() => { /* sin conexión: lista vacía */ })
    }

    useEffect(() => {
        cargarReportes()
        // Auto-refresh cada 60 segundos
        const interval = setInterval(() => { cargarReportes() }, 60000)
        return () => clearInterval(interval)
    }, [])

    const mostrarAlerta = (mensaje, tipo) => setAlerta({ mensaje, tipo })

    const abrirModalAuth = (tipo = "reporte") => {
        setModalAuthMensaje(tipo)
        setModalAuth(true)
    }

    const actualizarDiasActivos = useCallback(() => {
        setReportes(prev => prev.map(r => {
            if (r.estado === "activo" && r.activoParaTodos) {
                const fechaReporte = r.fecha.split('/').reverse().join('-')
                const diffDays = Math.min(Math.ceil(Math.abs(new Date() - new Date(fechaReporte)) / (1000 * 60 * 60 * 24)), 30)
                if (diffDays >= 30) return { ...r, activoParaTodos: false, diasActivo: diffDays }
                return { ...r, diasActivo: diffDays }
            }
            return r
        }))
    }, [])

    useEffect(() => {
        actualizarDiasActivos()
        const interval = setInterval(actualizarDiasActivos, 86400000)
        return () => clearInterval(interval)
    }, [actualizarDiasActivos])

    useEffect(() => {
        setReportes(prev => prev.filter(r => {
            if (r.estado !== "resuelto") return true
            if (!r.fecha) return true
            const fechaResuelto = r.fecha.split('/').reverse().join('-')
            const diffDays = Math.ceil(Math.abs(new Date() - new Date(fechaResuelto)) / (1000 * 60 * 60 * 24))
            return diffDays < 30
        }))
    }, [])

    const publicar = async (reporte) => {
        const uid = usuarioActual?.uid || null
        const body = {
            firebase_uid:       uid,
            usuario_nombre:     usuarioActual?.displayName || usuarioActual?.email?.split("@")[0] || "Usuario",
            nombre:             reporte.nombre || "Sin nombre",
            raza:               reporte.raza || "",
            color:              reporte.color || "",
            sexo:               reporte.sexo || "",
            lugar:              reporte.lugar || "Puno",
            direccion_completa: reporte.direccionCompleta || reporte.lugar || "Puno",
            lat:                reporte.lat || -15.8402,
            lng:                reporte.lng || -70.0219,
            fecha:              reporte.fecha || new Date().toLocaleDateString("es-PE"),
            hora_aproximada:    reporte.horaAproximada || "",
            timestamp_registro: reporte.timestampRegistro || new Date().toISOString(),
            telefono:           reporte.telefono || "",
            descripcion:        reporte.descripcion || "",
            tipo:               reporte.tipo || "perdido",
            estado:             reporte.estado || "activo",
            fotos:              reporte.fotos || [],
        }
        const res = await fetch(`${API}/api/reportes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || `Error del servidor (${res.status})`)
        }
        const data = await res.json()
        const saved = data.reporte ?? data
        // Usar las fotos base64 del formulario (el backend las guarda en reporte_fotos)
        const nuevo = { ...dbToFrontend(saved), fotos: reporte.fotos?.length ? reporte.fotos : [] }
        setReportes(prev => [nuevo, ...prev])
        setTab("misReportes")
    }

    const reportarAvistamiento = (id) => mostrarAlerta("Gracias por reportar. Se notificará al dueño de esta mascota.", "info")

    const pedirConfirmacion = (id) => setConfirmarId(id)

    const marcarEncontrado = async (id) => {
        setConfirmarId(null)
        setReportes(prev => prev.map(r => r.id === id ? { ...r, estado: "resuelto", activoParaTodos: false } : r))
        try {
            await fetch(`${API}/api/reportes/${id}/estado`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: "resuelto", activo_para_todos: false }),
            })
        } catch { /* actualización optimista ya aplicada */ }
    }

    const restaurarPublicacion = async (id) => {
        const hoy = new Date()
        const dia = String(hoy.getDate()).padStart(2, "0")
        const mes = String(hoy.getMonth() + 1).padStart(2, "0")
        const anio = hoy.getFullYear()
        const fechaHoy = `${dia}/${mes}/${anio}`
        setReportes(prev => prev.map(r => r.id === id
            ? { ...r, activoParaTodos: true, diasActivo: 0, estado: "activo", fecha: fechaHoy, timestampRegistro: hoy.toISOString() }
            : r
        ))
        mostrarAlerta("✅ Publicación restaurada por 30 días más.", "success")
        try {
            await fetch(`${API}/api/reportes/${id}/estado`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: "activo", activo_para_todos: true, dias_activo: 0, fecha: fechaHoy }),
            })
        } catch { /* actualización optimista ya aplicada */ }
    }

    const editarReporte = async (reporteEditado) => {
        setReportes(prev => prev.map(r => r.id === reporteEditado.id ? reporteEditado : r))
        try {
            await fetch(`${API}/api/reportes/${reporteEditado.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre:             reporteEditado.nombre,
                    raza:               reporteEditado.raza,
                    color:              reporteEditado.color,
                    sexo:               reporteEditado.sexo,
                    lugar:              reporteEditado.lugar,
                    direccion_completa: reporteEditado.direccionCompleta,
                    lat:                reporteEditado.lat,
                    lng:                reporteEditado.lng,
                    telefono:           reporteEditado.telefono,
                    descripcion:        reporteEditado.descripcion,
                    hora_aproximada:    reporteEditado.horaAproximada,
                }),
            })
        } catch { /* actualización optimista ya aplicada */ }
    }



    const handleNuevoReportePerdida = () => {
        if (!usuarioActual) { abrirModalAuth("reporte"); return }
        setTab("perdida")
    }
    const handleNuevoReportePosible = () => {
        if (!usuarioActual) { abrirModalAuth("reporte"); return }
        setTab("posiblePerdida")
    }


    const abrirMapa = (r) => {
        navigate("/mapa", { state: { reporteInicial: r } })
    }

    const reportesPerdidasGenerales = [...reportes]
        .filter(r => r.tipo === "perdido" && r.activoParaTodos === true && r.estado !== "resuelto")
        .sort((a, b) => new Date(b.fecha.split('/').reverse().join('-')) - new Date(a.fecha.split('/').reverse().join('-')))

    const posiblesPerdidas = reportes.filter(r => r.estado === "posible_perdido" && r.tipo === "posible_perdido")
    const mascotasEncontradas = reportes.filter(r => r.estado === "resuelto")
// ── Función: calcula similitud entre avistamiento y reporte perdido ──
    // Compara razas detectadas por TM (si se guardaron) o razas declaradas
    const calcularSimilitud = (reportePerdido, avistamiento) => {
        if (!reportePerdido || !avistamiento) return 0
        let puntos = 0

        // ── Raza (peso 70%) ──────────────────────────────
        const razaP = (reportePerdido.raza || "").toLowerCase().trim()
        const razaA = (avistamiento.raza   || "").toLowerCase().trim()
        if (razaP && razaA) {
            if (razaP === razaA) {
                puntos += 70
            } else {
                // Coincidencia parcial: "Labrador Retriever" vs "Labrador"
                const wp = razaP.split(" ")
                const wa = razaA.split(" ")
                const comunes = wp.filter(p => wa.some(a => a.includes(p) || p.includes(a)))
                if (comunes.length > 0) {
                    puntos += Math.round(35 + (comunes.length / Math.max(wp.length, wa.length)) * 30)
                }
            }
        }

        // ── Color (peso 20%) ─────────────────────────────
        const colorP = (reportePerdido.color || "").toLowerCase().trim()
        const colorA = (avistamiento.color   || "").toLowerCase().trim()
        if (colorP && colorA) {
            if (colorP === colorA) puntos += 20
            else if (colorP.includes(colorA) || colorA.includes(colorP)) puntos += 10
        }

        // ── Zona (peso 10%) ──────────────────────────────
        const lugarP = (reportePerdido.lugar || "").toLowerCase()
        const lugarA = (avistamiento.lugar   || "").toLowerCase()
        if (lugarP && lugarA) {
            const palabrasP = lugarP.split(/[,\s]+/).filter(p => p.length > 3)
            const palabrasA = lugarA.split(/[,\s]+/).filter(p => p.length > 3)
            const match = palabrasP.some(p => palabrasA.some(a => a.includes(p) || p.includes(a)))
            if (match) puntos += 10
        }

        return Math.min(puntos, 99)
    }

    // Avistamientos similares a un reporte perdido (umbral: 20%)
    const obtenerAvistamientosSimilares = (reportePerdido) => {
        return posiblesPerdidas
            .map(av => ({ ...av, similitud: calcularSimilitud(reportePerdido, av) }))
            .filter(av => av.similitud >= 20)
            .sort((a, b) => b.similitud - a.similitud)
            .slice(0, 5)
    }

    // Reportes perdidos similares a un avistamiento (umbral: 20%)
    const obtenerReportesSimilares = (avistamiento) => {
        return reportesPerdidasGenerales
            .map(rp => ({ ...rp, similitud: calcularSimilitud(rp, avistamiento) }))
            .filter(rp => rp.similitud >= 20)
            .sort((a, b) => b.similitud - a.similitud)
            .slice(0, 5)
    }

    const misReportes = usuarioActual
        ? [...reportes].filter(r => r.usuarioId === usuarioActual.uid)
        : []
        .sort((a, b) => new Date(b.fecha.split('/').reverse().join('-')) - new Date(a.fecha.split('/').reverse().join('-')))

    const stats = [
        { num: reportes.filter(r => r.estado === "activo").length, label: "Mascotas Perdidas", color: C.orange, bg: `linear-gradient(135deg, #fff8f2 0%, #fde8d0 100%)`, border: "#f5c6a0" },
        { num: posiblesPerdidas.length, label: "Posiblemente Perdidas", color: "#CC8800", bg: `linear-gradient(135deg, #fffef5 0%, #fff3cc 100%)`, border: "#ffe082" },
        { num: mascotasEncontradas.length, label: "Encontradas", color: C.success, bg: `linear-gradient(135deg, #f0fdf5 0%, #d5f5e3 100%)`, border: "#b2dfdb" },
    ]

    const TABS = [
        { id: "reportesGenerales", label: "Mascotas Perdidas", count: reportesPerdidasGenerales.length },
        { id: "posiblesPerdidas", label: "Vi un perro perdido", count: posiblesPerdidas.length },
        { id: "misReportes", label: "Mis Reportes", count: misReportes.length },
        { id: "mascotasEncontradas", label: "Encontradas", count: mascotasEncontradas.length },
    ]

    return (
            <div className="pf-container" style={{ minHeight: "100vh", background: C.beigeLight, padding: "20px 16px", position: "relative" }}>
                <style>{GLOBAL_CSS}</style>

                {/* ── FONDO DECORATIVO ── */}
                <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                    {[
                        { src: huellaImg, t:"3%",  l:"0%",   s:62, r:-20, o:true,  op:0.12, anim:"ud",   dur:"7s",   del:"0s"   },
                        { src: huellaImg, t:"19%", l:"94%",  s:46, r: 28, o:false, op:0.11, anim:"lr",   dur:"8s",   del:"1.2s" },
                        { src: huellaImg, t:"38%", l:"0%",   s:54, r: 12, o:false, op:0.11, anim:"ud",   dur:"6s",   del:"0.8s" },
                        { src: huellaImg, t:"55%", l:"91%",  s:48, r:-33, o:true,  op:0.12, anim:"diag", dur:"9s",   del:"2s"   },
                        { src: huellaImg, t:"72%", l:"1%",   s:42, r: 18, o:true,  op:0.10, anim:"lr",   dur:"7s",   del:"0.5s" },
                        { src: huellaImg, t:"87%", l:"90%",  s:58, r:-10, o:false, op:0.11, anim:"ud",   dur:"8s",   del:"1.8s" },
                        { src: lupaImg,  t:"29%", l:"95%",  s:52, r: 22, o:true,  op:0.11, anim:"lr",   dur:"8s",   del:"0.4s" },
                        { src: lupaImg,  t:"67%", l:"0%",   s:46, r:-13, o:false, op:0.10, anim:"ud",   dur:"7s",   del:"1.6s" },
                        { src: lupaImg,  t:"6%",  l:"74%",  s:40, r: 35, o:false, op:0.09, anim:"diag", dur:"9s",   del:"0.9s" },
                        { src: lupaImg,  t:"81%", l:"55%",  s:48, r:-28, o:true,  op:0.10, anim:"lr",   dur:"8.5s", del:"2.8s" },
                    ].map((d, i) => (
                        <img key={i} src={d.src} alt=""
                            className={`pf-deco-float-${d.anim}`}
                            style={{
                                position: "absolute", top: d.t, left: d.l,
                                width: d.s, height: d.s,
                                "--r": `${d.r}deg`, "--dur": d.dur, "--del": d.del,
                                opacity: d.op,
                                filter: d.o
                                    ? "sepia(1) saturate(5) hue-rotate(-10deg) brightness(0.9)"
                                    : "sepia(1) saturate(4) hue-rotate(140deg) brightness(0.65)",
                            }}
                        />
                    ))}
                </div>

                <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

                    {/* ESTADÍSTICAS */}

                <div style={{ backgroundColor: "white", borderRadius: 16, padding: "12px 20px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${C.beige}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, textAlign: "center" }}>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: C.orange }}>{reportes.filter(r => r.tipo === "perdido" && r.estado !== "resuelto").length}</div>
                            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Reportes perros perdidos</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: C.teal }}>{posiblesPerdidas.length}</div>
                            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Reportes de Perros Encontrados</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#FEA02F" }}>{mascotasEncontradas.length}</div>
                            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Reunidos con su dueño</div>
                        </div>
                    </div>
                </div>




                {/* TABS — 2 filas en móvil */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                    {/* Fila 1: botones de filtro */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {TABS.filter(t => t.id !== "mascotasEncontradas").map(({ id, label, count }) => {
                            const isActive = tab === id
                            return (
                                <button key={id} onClick={() => setTab(id)}
                                    style={{
                                        padding: "9px 16px", borderRadius: 40,
                                        border: isActive ? "none" : `1.5px solid ${C.beige}`,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13,
                                        cursor: "pointer",
                                        background: isActive ? `linear-gradient(135deg, ${C.orange}, #c96a1a)` : C.white,
                                        color: isActive ? "white" : C.teal,
                                        boxShadow: isActive ? "0 5px 18px rgba(224,123,39,0.35)" : "0 2px 8px rgba(0,0,0,0.06)",
                                        display: "flex", alignItems: "center", gap: 6,
                                        transition: "all 0.2s ease", whiteSpace: "nowrap"
                                    }}>
                                    {id === "reportesGenerales" && "🐾"}
                                    {id === "posiblesPerdidas" && "🔍"}
                                    {id === "misReportes" && "📋"}
                                    {label}
                                    {count > 0 && (
                                        <span style={{
                                            background: isActive ? "rgba(255,255,255,0.25)" : C.orangeLight,
                                            color: isActive ? "white" : C.orange,
                                            padding: "2px 7px", borderRadius: 20, fontSize: 11, fontWeight: 800
                                        }}>{count}</span>
                                    )}
                                </button>
                            )
                        })}
                        {/* Encontradas */}
                        <button onClick={() => setTab("mascotasEncontradas")}
                            style={{
                                padding: "9px 16px", borderRadius: 40,
                                border: tab === "mascotasEncontradas" ? "none" : `1.5px solid ${C.beige}`,
                                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13,
                                cursor: "pointer",
                                background: tab === "mascotasEncontradas" ? `linear-gradient(135deg, ${C.orange}, #c96a1a)` : C.white,
                                color: tab === "mascotasEncontradas" ? "white" : C.teal,
                                boxShadow: tab === "mascotasEncontradas" ? "0 5px 18px rgba(224,123,39,0.35)" : "0 2px 8px rgba(0,0,0,0.06)",
                                display: "flex", alignItems: "center", gap: 6,
                                transition: "all 0.2s ease", whiteSpace: "nowrap"
                            }}>
                            🏠 Encontradas
                            {mascotasEncontradas.length > 0 && (
                                <span style={{ background: "rgba(255,255,255,0.25)", color: "white", padding: "2px 7px", borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                                    {mascotasEncontradas.length}
                                </span>
                            )}
                        </button>
                    </div>
                    {/* Fila 2: buscador ancho completo */}
                    <input type="text" placeholder="🔍 Buscar mascota, raza, lugar..."
                        style={{
                            width: "100%", padding: "11px 18px", borderRadius: 40,
                            border: `1.5px solid ${C.beige}`, fontSize: 14, outline: "none",
                            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500,
                            background: C.white, color: C.text, boxSizing: "border-box"
                        }} />
                </div>




                {/* MIS REPORTES */}
                {tab === "misReportes" && (
                    <div style={{ animation: "fadeInUp 0.3s ease" }}>
                        {misReportes.length === 0 && (
                            <div style={{ textAlign: "center", color: C.muted, padding: "48px 0", background: C.white, borderRadius: 20, border: `1px solid ${C.beige}` }}>
                                <div style={{ fontWeight: 700, fontSize: 17 }}>No tienes reportes aún</div>
                                <div style={{ fontSize: 14, marginTop: 4 }}>Crea tu primer reporte desde "Pérdidas Generales" o "Posiblemente Perdidas"</div>
                            </div>
                        )}
                        {misReportes.map(r => {
                            const esMiReporte = r.usuarioId === usuarioActual?.uid
                            const esPerdido = r.tipo === "perdido"
                            const esAvistamiento = r.tipo === "posible_perdido"
                            const esActivo = r.estado !== "resuelto"
                            // Si es reporte perdido → mostrar avistamientos similares
                            // Si es avistamiento → mostrar reportes perdidos similares
                            const similitudes = esPerdido && esActivo
                                ? obtenerAvistamientosSimilares(r)
                                : esAvistamiento && esActivo
                                    ? obtenerReportesSimilares(r)
                                    : []
                            const modoSim = esPerdido ? "avistamientos" : "perdidos"
                            return (
                                <TarjetaReporte key={r.id} r={r}
                                    onVerDetalle={(rep) => setDetalleReporte(rep)}
                                    labelDetalle="✏️ Editar"
                                    onMarcarEncontrado={pedirConfirmacion}
                                    onCartel={(rep) => setModalData(rep)}
                                    onVerMapa={abrirMapa}
                                    mostrarEncontrado={esActivo && esPerdido && esMiReporte}
                                    mostrarCartel={esPerdido}
                                    mostrarAvistamiento={false}
                                    mostrarComentarios={false}
                                    mostrarMapa={false}
                                    similitudes={similitudes}
                                    modoSimilitud={modoSim}
                                    onVerDetalleSimilitud={(av) => setDetalleReporte({ ...av, _soloLectura: true })}
                                />
                            )
                        })}
                    </div>
                )}

                {/* REPORTES GENERALES */}
                {tab === "reportesGenerales" && (
                    <div style={{ animation: "fadeInUp 0.3s ease" }}>
                        {reportesPerdidasGenerales.length === 0 && (
                            <div style={{ textAlign: "center", color: C.muted, padding: "48px 0", background: C.white, borderRadius: 20, border: `1px solid ${C.beige}` }}>
                                <div style={{ fontWeight: 700, fontSize: 17 }}>No hay mascotas perdidas activas</div>
                            </div>
                        )}
                        {reportesPerdidasGenerales.map(r => {
                            const esMio = r.usuarioId === usuarioActual?.uid
                            // Similitudes SOLO para el dueño del reporte
                            const avSimilares = esMio ? obtenerAvistamientosSimilares(r) : undefined
                            return (
                                <TarjetaReporte key={r.id} r={r}
                                    onVerDetalle={(rep) => esMio ? setDetalleReporte(rep) : setDetalleReporte({ ...rep, _soloLectura: true })}
                                    labelDetalle={esMio ? "✏️ Editar" : "Ver detalles"}
                                    onMarcarEncontrado={esMio ? pedirConfirmacion : undefined}
                                    onCartel={(rep) => setModalData(esMio ? rep : { ...rep, _soloLectura: true })}
                                    onVerMapa={abrirMapa}
                                    mostrarEncontrado={esMio && r.estado !== "resuelto"}
                                    mostrarCartel={true}
                                    mostrarAvistamiento={false}
                                    mostrarComentarios={false}
                                    mostrarMapa={true}
                                    mostrarRestaurar={false}
                                    similitudes={avSimilares}
                                    modoSimilitud="avistamientos"
                                    onVerDetalleSimilitud={(av) => setDetalleReporte({ ...av, _soloLectura: true })}
                                />
                            )
                        })}
                    </div>
                )}

                {/* POSIBLES PERDIDAS */}
                {tab === "posiblesPerdidas" && (
                    <div style={{ animation: "fadeInUp 0.3s ease" }}>
                        {posiblesPerdidas.length === 0 && (
                            <div style={{ textAlign: "center", color: C.muted, padding: "48px 0", background: C.white, borderRadius: 20, border: `1px solid ${C.beige}` }}>
                                <div style={{ fontWeight: 700, fontSize: 17 }}>No hay reportes de avistamientos</div>
                            </div>
                        )}
                        {posiblesPerdidas.map(r => {
                            const esMio = r.usuarioId === usuarioActual?.uid
                            // Similitudes SOLO para quien publicó el avistamiento
                            const perdSimilares = esMio ? obtenerReportesSimilares(r) : undefined
                            return (
                                <TarjetaReporte key={r.id} r={r}
                                    onVerDetalle={esMio ? (rep) => setDetalleReporte(rep) : null}
                                    labelDetalle="✏️ Editar"
                                    onVerMapa={abrirMapa}
                                    onComentarios={(rep) => {
                                        if (!usuarioActual) { abrirModalAuth("comentario"); return }
                                        setComentariosReporte(rep)
                                    }}
                                    mostrarEncontrado={false}
                                    mostrarCartel={false}
                                    mostrarAvistamiento={false}
                                    mostrarComentarios={true}
                                    mostrarMapa={true}
                                    similitudes={perdSimilares}
                                    modoSimilitud="perdidos"
                                    onVerDetalleSimilitud={(rp) => setDetalleReporte({ ...rp, _soloLectura: true })}
                                />
                            )
                        })}
                    </div>
                )}

                {/* MASCOTAS ENCONTRADAS */}
                {tab === "mascotasEncontradas" && (
                    <div style={{ animation: "fadeInUp 0.3s ease" }}>
                        {mascotasEncontradas.length === 0 && (
                            <div style={{ textAlign: "center", color: C.muted, padding: "48px 0", background: C.white, borderRadius: 20, border: `1px solid ${C.beige}` }}>
                                <div style={{ fontWeight: 700, fontSize: 17 }}>Aún no hay mascotas encontradas</div>
                                <div style={{ fontSize: 14, marginTop: 4 }}>¡Pronto habrá historias de éxito!</div>
                            </div>
                        )}
                        {mascotasEncontradas.map(r => (
                            <TarjetaReporte key={r.id} r={r}
                                onCartel={(rep) => setModalData(rep)}
                                mostrarEncontrado={false}
                                mostrarCartel={true}
                                mostrarAvistamiento={false}
                                mostrarComentarios={false}
                                mostrarMapa={false}
                            />
                        ))}
                    </div>
                )}

                {/* FORMULARIOS */}
                {tab === "perdida" && (
                    <div style={{ animation: "fadeInUp 0.3s ease" }}>
                        <button onClick={() => setTab("reportesGenerales")}
                            style={{ padding: "8px 16px", background: C.beigeLight, color: C.muted, border: "none", borderRadius: 20, fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 16 }}>
                            ← Volver
                        </button>
                        <FormPerdida onPublicar={publicar} onMostrarAlerta={mostrarAlerta} />
                    </div>
                )}
                {tab === "posiblePerdida" && (
                    <div style={{ animation: "fadeInUp 0.3s ease" }}>
                        <button onClick={() => setTab("posiblesPerdidas")}
                            style={{ padding: "8px 16px", background: C.beigeLight, color: C.muted, border: "none", borderRadius: 20, fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 16 }}>
                            ← Volver
                        </button>
                        <FormPosiblePerdida onPublicar={publicar} onMostrarAlerta={mostrarAlerta} />
                    </div>
                )}
            </div>

            {/* MODALES */}
{/* Modal: confirmar que ya encontró a su mascota */}
            {confirmarId && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                    onClick={() => setConfirmarId(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "#fff", borderRadius: 22, padding: 28, maxWidth: 360, width: "100%",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.22)", textAlign: "center",
                    }}>
                        <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                        <div style={{ fontWeight: 900, fontSize: 20, color: "#0B5C5C", marginBottom: 8 }}>
                            ¡Qué alegría!
                        </div>
                        <div style={{ fontSize: 14, color: "#6b6b6b", marginBottom: 24, lineHeight: 1.6 }}>
                            ¿Confirmas que ya encontraste a tu mascota?
                            El reporte pasará a <strong>"Encontrado"</strong> y
                            aparecerá en las historias de éxito.
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setConfirmarId(null)}
                                style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "1.5px solid #D9C4A0", background: "#F2EDE3", color: "#6b6b6b", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                                Cancelar
                            </button>
                            <button onClick={() => marcarEncontrado(confirmarId)}
                                style={{ flex: 1, padding: "12px 0", borderRadius: 14, border: "none", background: "#27ae60", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                                ✓ Sí, la encontré
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalData && modalData.tipo === "perdido" && <ModalCartel datos={modalData} soloLectura={!!modalData._soloLectura} onCerrar={() => setModalData(null)} />}
            {detalleReporte && (
                <ModalDetalle
                    reporte={detalleReporte}
                    soloLectura={!!detalleReporte?._soloLectura}
                    onCerrar={() => setDetalleReporte(null)}
                    onEditar={(r) => { editarReporte(r); setDetalleReporte(r) }}
                    onRestaurar={restaurarPublicacion}
                    onVerMapa={abrirMapa}
                />
            )}
            {comentariosReporte && (
                <ComentariosModal
                    reporte={comentariosReporte}
                    onCerrar={() => setComentariosReporte(null)}
                    usuarioActual={usuarioActual}
                    onNecesitaAuth={() => abrirModalAuth("comentario")}
                />
            )}
            {alerta && <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} onCerrar={() => setAlerta(null)} />}

            {/* BOTONES FLOTANTES */}

            {(tab === "reportesGenerales" || tab === "posiblesPerdidas") && (
                <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px", background: "rgba(242,237,227,0.95)", backdropFilter: "blur(8px)", zIndex: 500, borderTop: `1px solid ${C.beige}` }}>
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        {tab === "reportesGenerales" && (
                            <button onClick={handleNuevoReportePerdida} className="pf-add-btn"
                                style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: `linear-gradient(135deg, ${C.orange}, #c96a1a)`, color: "white", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15, fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: "0 8px 28px rgba(224,123,39,0.45)" }}>
                                + Reportar perdida de mi perro
                            </button>
                        )}
                        {tab === "posiblesPerdidas" && (
                            <button onClick={handleNuevoReportePosible} className="pf-add-btn"
                                style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: `linear-gradient(135deg, ${C.orange}, #c96a1a)`, color: "white", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15, fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: "0 8px 28px rgba(224,123,39,0.45)" }}>
                                + Reportar un perro perdido
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Auth */}
            {modalAuth && (
                <ModalAuth
                    mensaje={modalAuthMensaje}
                    onCerrar={() => setModalAuth(false)}
                    onLogin={() => { setModalAuth(false); navigate("/login") }}
                    onRegistro={() => { setModalAuth(false); navigate("/login") }}
                />
            )}
        </div>
    )

 
}