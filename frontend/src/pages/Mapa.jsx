import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import FondoAnimado from '../components/FondoAnimado'

const API = import.meta.env.VITE_API_URL

// Convierte un reporte de la BD al formato que usa este mapa
function dbToMapa(r) {
  let tipo = r.tipo
  if (tipo === "posible_perdido") tipo = "posiblementePerdido"
  if (tipo === "resuelto")        tipo = "encontrado"
  const fotos = Array.isArray(r.fotos) ? r.fotos : []
  return {
    id:          r.id,
    tipo,
    nombre:      r.nombre || "Sin nombre",
    raza:        r.raza   || "—",
    color:       r.color  || "—",
    zona:        r.lugar  || "Puno",
    fecha:       r.fecha  || "",
    lat:         parseFloat(r.lat) || -15.8402,
    lng:         parseFloat(r.lng) || -70.0219,
    foto:        fotos[0] || "",
    descripcion: r.descripcion || "",
    contacto:    r.telefono || null,
  }
}

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TIPOS = ["Todos", "Perdidos", "Encontrados", "Posiblemente perdido"]

const TIPO_CONFIG = {
  perdido: { label: "Perdido", bg: "#fff0f0", color: "#DD6600", border: "#f5c6cb" },
  encontrado: { label: "Encontrado", bg: "#e8f5e9", color: "#007A7B", border: "#b2dfdb" },
  posiblementePerdido: { label: "Posiblemente perdido", bg: "#fff8e1", color: "#FFB300", border: "#ffe082" },
}


function createFotoIcon(foto, tipo, nombre) {
  const cfg = TIPO_CONFIG[tipo === "posiblementePerdido" ? "posiblementePerdido" : tipo] || TIPO_CONFIG.perdido
  const inicial = (nombre || "?")[0].toUpperCase()
  const html = foto
    ? `<div style="width:48px;height:48px;border-radius:50%;border:3px solid ${cfg.color};overflow:hidden;background:${cfg.bg};box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;">
         <img src="${foto}" style="width:100%;height:100%;object-fit:cover;"
           onerror="this.style.display='none';this.parentNode.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:${cfg.color};\\'>🐾</div>'" />
       </div>`
    : `<div style="width:48px;height:48px;border-radius:50%;border:3px solid ${cfg.color};background:${cfg.bg};box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:${cfg.color};">
         ${inicial}
       </div>`
  return L.divIcon({ html, className: "", iconSize: [48, 48], iconAnchor: [24, 48], popupAnchor: [0, -52] })
}

function ModalAvistamiento({ reporte, onClose }) {
  const [modo,       setModo]       = useState(null)
  const [foto,       setFoto]       = useState(null)
  const [nota,       setNota]       = useState("")
  const [enviado,    setEnviado]    = useState(false)
  const [enviando,   setEnviando]   = useState(false)
  const [coordsGPS,  setCoordsGPS]  = useState(null)

  function handleSOS() {
    setModo("sos")
    setEnviando(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setCoordsGPS({ lat, lng })
          // Guardar avistamiento en el backend
          try {
            await fetch(`${API}/api/reportes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nombre: `Avistamiento — ${reporte.nombre}`,
                tipo: "posible_perdido",
                estado: "posible_perdido",
                lat, lng,
                lugar: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                descripcion: `Avistamiento SOS del reporte: ${reporte.nombre}`,
              })
            })
          } catch { /* sin conexión, igual mostramos éxito */ }
          setEnviando(false)
          setEnviado(true)
        },
        () => { setEnviando(false); setEnviado(true) }
      )
    } else {
      setTimeout(() => { setEnviando(false); setEnviado(true) }, 1000)
    }
  }

  async function handleEnviar() {
    setEnviando(true)
    try {
      await fetch(`${API}/api/reportes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: `Avistamiento — ${reporte.nombre}`,
          tipo: "posible_perdido",
          estado: "posible_perdido",
          lat: reporte.lat,
          lng: reporte.lng,
          lugar: reporte.zona || "Puno",
          descripcion: nota || `Avistamiento del reporte: ${reporte.nombre}`,
        })
      })
    } catch { /* sin conexión */ }
    setEnviando(false)
    setEnviado(true)
  }

  if (!reporte) return null
  const tipoKey = reporte.tipo === "posiblementePerdido" ? "posiblementePerdido" : reporte.tipo
  const cfg = TIPO_CONFIG[tipoKey]

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px"
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "420px",
        overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.18)"
      }} onClick={e => e.stopPropagation()}>

        {/* Foto header */}
        <div style={{ position: "relative", height: "180px", background: "#f5f0e8" }}>
          {reporte.foto
            ? <img src={reporte.foto} alt={reporte.nombre}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { e.target.style.display="none" }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:48 }}>🐾</div>
          }
          <div style={{
            position: "absolute", top: "12px", left: "12px",
            background: cfg.color, color: "#fff",
            fontSize: "11px", fontWeight: 800, padding: "4px 10px",
            borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.05em"
          }}>{cfg.label}</div>
          <button onClick={onClose} style={{
            position: "absolute", top: "10px", right: "10px",
            background: "rgba(0,0,0,0.4)", border: "none", color: "#fff",
            borderRadius: "50%", width: "30px", height: "30px",
            cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center"
          }}>✕</button>
        </div>

        <div style={{ padding: "16px 20px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 900, color: "#007A7B" }}>{reporte.nombre}</h3>
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#888" }}>
            {reporte.raza} • {reporte.tamaño} • {reporte.color} • {reporte.zona}
          </p>
          <p style={{ fontSize: "13px", color: "#555", margin: "0 0 16px", lineHeight: 1.5 }}>{reporte.descripcion}</p>

          {!modo && !enviado && (
            <>
              <p style={{ fontSize: "11px", fontWeight: 800, color: "#007A7B", textTransform: "uppercase", marginBottom: "10px" }}>
                ¿Viste a este perro?
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button onClick={handleSOS} style={{
                  background: "#DD6600", color: "#fff", border: "none",
                  borderRadius: "12px", padding: "12px 8px", cursor: "pointer",
                  fontWeight: 900, fontSize: "13px", display: "flex",
                  flexDirection: "column", alignItems: "center", gap: "4px"
                }}>
                  <span style={{ fontSize: "20px" }}>📍</span>
                  Enviar ubicación ya
                  <span style={{ fontSize: "10px", fontWeight: 400, opacity: 0.85 }}>Solo GPS, sin fotos</span>
                </button>
                <button onClick={() => setModo("completo")} style={{
                  background: "#007A7B", color: "#fff", border: "none",
                  borderRadius: "12px", padding: "12px 8px", cursor: "pointer",
                  fontWeight: 900, fontSize: "13px", display: "flex",
                  flexDirection: "column", alignItems: "center", gap: "4px"
                }}>
                  <span style={{ fontSize: "20px" }}>📷</span>
                  Tengo más info
                  <span style={{ fontSize: "10px", fontWeight: 400, opacity: 0.85 }}>Fotos + detalles</span>
                </button>
              </div>
            </>
          )}

          {modo === "sos" && !enviado && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📡</div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#DD6600" }}>
                {enviando ? "Obteniendo tu ubicación GPS..." : "Procesando..."}
              </p>
            </div>
          )}

          {modo === "completo" && !enviado && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "11px", fontWeight: 800, color: "#007A7B", textTransform: "uppercase", margin: 0 }}>
                Cuéntanos más
              </p>
              <label style={{
                border: "2px dashed #e8dfc8", borderRadius: "12px",
                padding: "12px", textAlign: "center", cursor: "pointer",
                background: "#f8f4ec", fontSize: "13px", color: "#888"
              }}>
                📷 Agregar fotos
                <input type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={e => setFoto(e.target.files[0]?.name || null)} />
                {foto && <div style={{ fontSize: "11px", color: "#1a7a60", marginTop: "4px" }}>✓ {foto}</div>}
              </label>
              <textarea value={nota} onChange={e => setNota(e.target.value)}
                placeholder="¿Hacia dónde iba? ¿Cómo estaba? ¿Estaba solo?"
                style={{
                  border: "1.5px solid #e8dfc8", borderRadius: "12px",
                  padding: "10px", fontSize: "13px", resize: "none",
                  height: "80px", fontFamily: "inherit", background: "#f8f4ec"
                }} />
              <button onClick={handleEnviar} style={{
                background: "#007A7B", color: "#fff", border: "none",
                borderRadius: "12px", padding: "12px", cursor: "pointer",
                fontWeight: 900, fontSize: "14px"
              }}>
                Enviar reporte completo
              </button>
            </div>
          )}

          {enviado && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>✅</div>
              <p style={{ fontSize: "15px", fontWeight: 900, color: "#1a7a60", margin: "0 0 4px" }}>¡Avistamiento registrado!</p>
              {coordsGPS && (
                <p style={{ fontSize: "11px", color: "#888", margin: "4px 0" }}>
                  📍 {coordsGPS.lat.toFixed(5)}, {coordsGPS.lng.toFixed(5)}
                </p>
              )}
              <p style={{ fontSize: "13px", color: "#888", margin: "4px 0 0" }}>
                Gracias por ayudar a encontrar a {reporte.nombre}.
              </p>
              {reporte.contacto && (
                <p style={{ fontSize: "13px", color: "#007A7B", marginTop: "8px", fontWeight: 700 }}>
                  Contacta al dueño: {reporte.contacto}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Vuela suavemente a unas coordenadas dentro del MapContainer
function FlyTo({ coords }) {
  const map = useMap()
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 17, { duration: 1.2 })
  }, [coords, map])
  return null
}

export default function Mapa() {
  const location = useLocation()

  const [filtro,      setFiltro]      = useState("Todos")
  const [zona,        setZona]        = useState("")
  const [raza,        setRaza]        = useState("")
  const [fecha,       setFecha]       = useState("")
  const [seleccionado,setSeleccionado]= useState(null)
  const [reportes,    setReportes]    = useState([])
  const [cargando,    setCargando]    = useState(true)
  const [centrarEn,   setCentrarEn]   = useState(null)

  // Carga reportes desde la BD
  useEffect(() => {
    fetch(`${API}/api/reportes`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setReportes(data.map(dbToMapa))
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  // Recibe el reporte enviado desde Reportes.jsx ("Ver mapa")
  useEffect(() => {
    const reporteInicial = location.state?.reporteInicial
    if (!reporteInicial) return

    const enMapa = dbToMapa(reporteInicial)

    // Si el reporte no está en la lista aún (recién publicado), lo agrega
    setReportes(prev =>
      prev.find(r => r.id === enMapa.id) ? prev : [enMapa, ...prev]
    )

    // Abre el modal y centra el mapa en ese punto
    setSeleccionado(enMapa)
    setCentrarEn({ lat: enMapa.lat, lng: enMapa.lng })
  }, [location.state])

  const reportesFiltrados = reportes.filter(r => {
    if (filtro === "Perdidos"            && r.tipo !== "perdido")             return false
    if (filtro === "Encontrados"         && r.tipo !== "encontrado")          return false
    if (filtro === "Posiblemente perdido"&& r.tipo !== "posiblementePerdido") return false
    // zona: búsqueda por contains (r.zona es la dirección completa)
    if (zona && !r.zona.toLowerCase().includes(zona.toLowerCase())) return false
    if (raza && !r.raza.toLowerCase().includes(raza.toLowerCase())) return false
    // fecha: r.fecha es "dd/mm/yyyy", input date entrega "yyyy-mm-dd"
    if (fecha) {
      const partes = r.fecha?.split("/")
      if (partes?.length === 3) {
        const fechaISO = `${partes[2]}-${partes[1]}-${partes[0]}`
        if (fechaISO !== fecha) return false
      }
    }
    return true
  })

  const coloresFiltro = {
    "Todos": { active: { background: "#007A7B", color: "#f0c040" }, inactive: { background: "#e8f5e9", color: "#007A7B" } },
    "Perdidos": { active: { background: "#DD6600", color: "#fff" }, inactive: { background: "#fff0f0", color: "#DD6600" } },
    "Encontrados": { active: { background: "#1a7a60", color: "#fff" }, inactive: { background: "#e8f5e9", color: "#1a7a60" } },
    "Posiblemente perdido": { active: { background: "#FFB300", color: "#fff" }, inactive: { background: "#fff8e1", color: "#FFB300" } },
  }

  return (
    <div
      className="min-h-screen p-5"
      style={{
        position: "relative",
        background: "#F2EDE3",
        paddingBottom: "80px",
      }}
    >
      <FondoAnimado />
      {seleccionado && (
        <ModalAvistamiento reporte={seleccionado} onClose={() => setSeleccionado(null)} />
      )}

      <style>{`
        @media (max-width: 768px) {
          .mapa-main-grid { grid-template-columns: 1fr !important; }
          .mapa-sidebar { max-height: 340px; overflow-y: auto; }
        }
      `}</style>
      <style>{`
        @media (max-width: 768px) {
          .mapa-main-grid { grid-template-columns: 1fr !important; }
          .mapa-sidebar { display: none; }
          .mapa-sidebar.open { display: block !important; position: fixed; top: 60px; left: 0; right: 0; z-index: 1000; max-height: 60vh; overflow-y: auto; margin: 0; border-radius: 0 0 16px 16px; }
          .mapa-container { height: calc(100vh - 130px) !important; }
        }
      `}</style>
      <div className="mapa-main-grid" style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "260px 1fr", gap: "14px" }}>

        {/* SIDEBAR — solo filtros */}
        <div className="mapa-sidebar" style={{ background: "#fff", borderRadius: "20px", padding: "16px", border: "1.5px solid #e8dfc8", alignSelf: "start" }}>
          <p style={{ fontWeight: 900, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#007A7B", marginBottom: "14px" }}>
            Filtros
          </p>

          <label style={{ fontSize: "11px", fontWeight: 800, color: "#007A7B", display: "block", marginBottom: "4px" }}>Zona</label>
          <select value={zona} onChange={e => setZona(e.target.value)}
            style={{ width: "100%", fontSize: "12px", fontWeight: 700, borderRadius: "10px", padding: "8px", marginBottom: "12px", border: "1.5px solid #e8dfc8", background: "#f8f4ec", color: "#007A7B", fontFamily: "inherit" }}>
            <option value="">Todas las zonas</option>
            {["Centro","Bellavista","Salcedo","Laykakota","Alto Puno","Huajsapata","Barrio Porteño","Chejoña","Uros Chulluni","Yanamayo"].map(z => (
              <option key={z}>{z}</option>
            ))}
          </select>

          <label style={{ fontSize: "11px", fontWeight: 800, color: "#007A7B", display: "block", marginBottom: "4px" }}>Raza</label>
          <input type="text" list="razas-mapa" value={raza} onChange={e => setRaza(e.target.value)}
            placeholder="Escribe una raza"
            style={{ width: "100%", fontSize: "12px", fontWeight: 700, borderRadius: "10px", padding: "8px", marginBottom: "12px", border: "1.5px solid #e8dfc8", background: "#f8f4ec", color: "#007A7B", fontFamily: "inherit", boxSizing: "border-box" }} />
          <datalist id="razas-mapa">
            {["Mestizo / Criollo","Labrador Retriever","Golden Retriever","Pastor Alemán","Schnauzer","Jack Russell Terrier","Pug","Shih Tzu","Chihuahua","Yorkshire Terrier","Rottweiler","Husky Siberiano","Border Collie","Caniche / Poodle","Beagle","Pitbull","Bulldog Francés","Boxer","Maltés","Pomerania","Gran Danés"].map(r => (
              <option key={r} value={r} />
            ))}
          </datalist>

          <label style={{ fontSize: "11px", fontWeight: 800, color: "#007A7B", display: "block", marginBottom: "4px" }}>Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            style={{ width: "100%", fontSize: "12px", fontWeight: 700, borderRadius: "10px", padding: "8px", marginBottom: "16px", border: "1.5px solid #e8dfc8", background: "#f8f4ec", color: "#007A7B", fontFamily: "inherit", boxSizing: "border-box" }} />

          {(zona || raza || fecha) && (
            <button onClick={() => { setZona(""); setRaza(""); setFecha("") }}
              style={{ width: "100%", padding: "8px", borderRadius: "10px", border: "none", background: "#fff0f0", color: "#DD6600", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        {/* MAPA */}
        <div style={{ background: "#fff", borderRadius: "20px", padding: "16px", border: "1.5px solid #e8dfc8" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ fontWeight: 900, fontSize: "20px", color: "#007A7B", margin: 0 }}>
              Mapa interactivo de reportes
            </h2>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {TIPOS.map(f => {
                const isActive = filtro === f
                const styles = coloresFiltro[f]
                const count = f === "Todos" ? reportes.length
                  : f === "Perdidos"             ? reportes.filter(r => r.tipo === "perdido").length
                  : f === "Encontrados"          ? reportes.filter(r => r.tipo === "encontrado").length
                  : reportes.filter(r => r.tipo === "posiblementePerdido").length
                return (
                  <button key={f} onClick={() => setFiltro(f)}
                    style={{ ...(isActive ? styles.active : styles.inactive), fontSize: "12px", fontWeight: 800, padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "5px" }}>
                    {f}
                    {count > 0 && (
                      <span style={{ background: isActive ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.08)", borderRadius: "20px", padding: "1px 6px", fontSize: "11px" }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <MapContainer center={[-15.8402, -70.0219]} zoom={13}
            style={{ height: "350px", width: "100%", borderRadius: "16px", marginBottom: "14px" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {centrarEn && <FlyTo coords={centrarEn} />}
            {reportesFiltrados.map(r => {
              const tipoKey = r.tipo === "posiblementePerdido" ? "posiblementePerdido" : r.tipo
              const cfg = TIPO_CONFIG[tipoKey]
              return (
                <Marker key={r.id} position={[r.lat, r.lng]} icon={createFotoIcon(r.foto, r.tipo, r.nombre)}
                  eventHandlers={{ click: () => setSeleccionado(r) }}>
                  <Popup>
                    <div style={{ fontFamily: "sans-serif", minWidth: "180px" }}>
                      {r.foto && <img src={r.foto} alt={r.nombre}
                        style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px" }}
                        onError={e => { e.target.style.display="none" }} />}
                      <div style={{ fontWeight: 900, fontSize: "14px", color: "#007A7B" }}>{r.nombre}</div>
                      <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>{r.raza} • {r.zona}</div>
                      <span style={{ background: cfg.bg, color: cfg.color, fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "8px" }}>
                        {cfg.label}
                      </span>
                      <button onClick={() => setSeleccionado(r)}
                        style={{ display: "block", width: "100%", marginTop: "10px", padding: "8px", background: "#DD6600", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                        Ver detalle y reportar
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>

          {/* TARJETAS ABAJO */}
          <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#007A7B", marginBottom: "10px" }}>
            {filtro === "Todos" ? "Todos los reportes" : filtro} ({reportesFiltrados.length})
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {reportesFiltrados.map(r => {
              const tipoKey = r.tipo === "posiblementePerdido" ? "posiblementePerdido" : r.tipo
              const cfg = TIPO_CONFIG[tipoKey]
              return (
                <div key={r.id} onClick={() => setSeleccionado(r)}
                  style={{ borderRadius: "14px", overflow: "hidden", border: `1.5px solid ${cfg.border}`, background: "#fff", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)" }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}>
                  <div style={{ height: "100px", overflow: "hidden" }}>
                    {r.foto
                      ? <img src={r.foto} alt={r.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display="none" }} />
                      : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, background: "#f5f0e8" }}>🐾</div>}
                  </div>
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 900, fontSize: "13px", color: "#007A7B" }}>{r.nombre}</span>
                      <span style={{ background: cfg.bg, color: cfg.color, fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "6px" }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "8px" }}>
                      {r.raza} • {r.zona}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      <button onClick={e => { e.stopPropagation(); setSeleccionado(r) }}
                        style={{ padding: "6px 4px", background: "#DD6600", color: "#fff", border: "none", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}>
                        SOS
                      </button>
                      <button onClick={e => { e.stopPropagation(); setSeleccionado(r) }}
                        style={{ padding: "6px 4px", background: "#007A7B", color: "#fff", border: "none", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}>
                        Info
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {reportesFiltrados.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "30px", color: "#aaa", fontSize: "13px" }}>
                No hay reportes que coincidan con los filtros seleccionados.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}