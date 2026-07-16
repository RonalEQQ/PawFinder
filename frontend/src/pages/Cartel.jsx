import { useState } from "react"
import logoImg from "../assets/logo.jpg"

const C = {
    cream: "#F0E8CE",
    tealDark: "#0B5C5C",
    teal: "#1A7A7A",
    tealLight: "#C8E8E0",
    orange: "#D4820A",
    orangeBtn: "#E07B27",
    red: "#8B1A1A",
    pink: "#D4547A",
    white: "#FFFFFF",
    beige: "#D9C4A0",
    muted: "#6b6b6b",
    beigeLight: "#F2EDE3",
}

// Patitas SVG dispersas en posiciones fijas (igual que la imagen)
const PATITAS = [
    { x: 18, y: 12, s: 22, r: -15, c: C.teal },
    { x: 160, y: 8, s: 18, r: 10, c: C.orange },
    { x: 310, y: 5, s: 20, r: -5, c: C.teal },
    { x: 430, y: 18, s: 16, r: 20, c: C.orange },
    { x: 8, y: 80, s: 14, r: 5, c: C.orange },
    { x: 490, y: 70, s: 18, r: -10, c: C.teal },
    { x: 30, y: 160, s: 16, r: 15, c: C.teal },
    { x: 480, y: 155, s: 14, r: -20, c: C.orange },
    { x: 15, y: 240, s: 18, r: -8, c: C.orange },
    { x: 488, y: 235, s: 16, r: 12, c: C.teal },
    { x: 25, y: 320, s: 14, r: 18, c: C.teal },
    { x: 475, y: 315, s: 18, r: -15, c: C.orange },
    { x: 200, y: 328, s: 14, r: 8, c: C.teal },
    { x: 340, y: 322, s: 16, r: -8, c: C.orange },
]

function Patita({ x, y, s, r, c }) {
    return (
        <g transform={`translate(${x},${y}) rotate(${r})`} opacity="0.7">
            <ellipse cx={s * 0.5} cy={s * 0.62} rx={s * 0.32} ry={s * 0.28} fill={c} />
            <ellipse cx={s * 0.18} cy={s * 0.3} rx={s * 0.13} ry={s * 0.16} fill={c} />
            <ellipse cx={s * 0.42} cy={s * 0.2} rx={s * 0.13} ry={s * 0.16} fill={c} />
            <ellipse cx={s * 0.67} cy={s * 0.22} rx={s * 0.13} ry={s * 0.16} fill={c} />
            <ellipse cx={s * 0.86} cy={s * 0.35} rx={s * 0.13} ry={s * 0.16} fill={c} />
        </g>
    )
}

function LogoPawFinder({ size = 90 }) {
    const r = size / 2
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={r} cy={r} r={r - 1} fill="none" stroke={C.orange} strokeWidth="3" />
            <circle cx={r} cy={r} r={r - 5} fill={C.tealDark} />
            <defs>
                <path id="arcTop" d={`M ${r - 32},${r} A 32,32 0 0,1 ${r + 32},${r}`} />
                <path id="arcBot" d={`M ${r - 28},${r + 2} A 28,28 0 0,0 ${r + 28},${r + 2}`} />
            </defs>
            <text fontSize="8.5" fontWeight="bold" fontFamily="Arial Black,sans-serif" fill={C.orange} letterSpacing="2">
                <textPath href="#arcTop" startOffset="10%">PAW FINDER</textPath>
            </text>
            <text fontSize="7" fontWeight="bold" fontFamily="Arial Black,sans-serif" fill={C.beige} letterSpacing="1.5">
                <textPath href="#arcBot" startOffset="12%">PET  LOVER</textPath>
            </text>
            {/* Corgi caricatura */}
            <g transform={`translate(${r - 16},${r - 14})`}>
                <ellipse cx="16" cy="24" rx="12" ry="9" fill="#D4820A" />
                <ellipse cx="16" cy="14" rx="11" ry="10" fill="#D4820A" />
                <polygon points="6,8 2,0 10,6" fill="#D4820A" />
                <polygon points="26,8 30,0 22,6" fill="#D4820A" />
                <ellipse cx="16" cy="15" rx="7" ry="7" fill="#F5E8D0" />
                <circle cx="13" cy="13" r="2" fill="#1a1a1a" />
                <circle cx="19" cy="13" r="2" fill="#1a1a1a" />
                <circle cx="13.7" cy="12.3" r="0.7" fill="white" />
                <circle cx="19.7" cy="12.3" r="0.7" fill="white" />
                <ellipse cx="16" cy="16.5" rx="2" ry="1.3" fill="#1a1a1a" />
                <path d="M13.5,18 Q16,20 18.5,18" fill="none" stroke="#1a1a1a" strokeWidth="0.8" />
                <circle cx="10.5" cy="16" r="2.5" fill="#E07B27" opacity="0.5" />
                <circle cx="21.5" cy="16" r="2.5" fill="#E07B27" opacity="0.5" />
                <rect x="8" y="21" width="16" height="4" rx="2" fill={C.teal} />
                <circle cx="16" cy="23" r="1.5" fill={C.orange} />
            </g>
            <text x={r} y={r + 38} textAnchor="middle" fontSize="11" fill={C.orange}>&#x1F43E;</text>
        </svg>
    )
}

// ── CARTEL PREVIEW ───────────────────────────────────────────
function CartelPreview({ datos, telefono }) {
    const d = datos || {}
    const nombre = (d.nombre || "SIN NOMBRE").toUpperCase()
    const raza = d.raza || ""
    const color = d.color || ""
    const lugar = (d.lugar || "Puno").toUpperCase()
    const fecha = (d.fecha || "—").toUpperCase()
    const desc = d.descripcion || ""
    const foto = d.fotos?.[0] || d.foto || ""

    const lineas = []
    if (raza && raza !== "—") lineas.push(raza)
    if (color && color !== "—") lineas.push(color)
    if (desc) desc.split(",").forEach(l => { if (l.trim()) lineas.push(l.trim()) })
    if (lineas.length === 0) lineas.push("Por favor contactar si lo encuentra")

    const W = 540, H = 360

    return (
        <div id="cartel-preview" style={{ width: W, height: H, position: "relative", fontFamily: "'Fredoka One', cursive", overflow: "hidden", borderRadius: 14, border: `3px solid ${C.beige}`, background: C.cream }}>

            {/* Fondo patitas */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox={`0 0 ${W} ${H}`}>
                {PATITAS.map((p, i) => <Patita key={i} {...p} />)}
            </svg>

            {/* TITULO ¡SE BUSCA! centrado arriba */}
            <div style={{ position: "absolute", top: 6, left: 0, right: 100, display: "flex", flexDirection: "column", alignItems: "center", paddingLeft: 60 }}>
                <div style={{ fontSize: 44, color: C.tealDark, fontFamily: "'Fredoka One',cursive", lineHeight: 1 }}>¡SE BUSCA!</div>
                <div style={{ background: C.pink, borderRadius: 20, padding: "2px 20px", marginTop: 2 }}>
                    <span style={{ fontSize: 15, color: C.white, fontFamily: "'Fredoka One',cursive", letterSpacing: 1 }}>PERRITO</span>
                </div>
            </div>

            {/* Logo PAW FINDER arriba derecha */}
            <div style={{ position: "absolute", top: 6, right: 10 }}>
                <img src={logoImg} alt="PAW FINDER" crossOrigin="anonymous"
                    style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.orange}`, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }} />
            </div>

            {/* CUERPO */}
            <div style={{ position: "absolute", top: 96, left: 0, right: 0, bottom: 44, display: "flex" }}>

                {/* COLUMNA IZQUIERDA */}
                <div style={{ width: 188, padding: "0 6px 0 12px", display: "flex", flexDirection: "column", gap: 6 }}>

                    {/* Patita + NOMBRE: label */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <svg width="13" height="13" viewBox="0 0 20 20">
                            <ellipse cx="10" cy="13" rx="6" ry="5" fill={C.teal} />
                            <ellipse cx="4" cy="7" rx="2.5" ry="3" fill={C.teal} />
                            <ellipse cx="10" cy="4" rx="2.5" ry="3" fill={C.teal} />
                            <ellipse cx="16" cy="7" rx="2.5" ry="3" fill={C.teal} />
                        </svg>
                        <span style={{ fontSize: 10, color: C.teal, fontFamily: "'Fredoka One',cursive", letterSpacing: 1 }}>NOMBRE:</span>
                    </div>

                    {/* Nombre en rojo grande */}
                    <div style={{ fontSize: 26, color: C.red, fontFamily: "'Fredoka One',cursive", lineHeight: 1, marginTop: -2 }}>{nombre}</div>

                    {/* Corazon decorativo */}
                    <svg width="22" height="18" viewBox="0 0 22 18" style={{ marginTop: -2 }}>
                        <path d="M11,16 C11,16 2,9 2,4.5 A4.5,4.5 0 0,1 11,3.5 A4.5,4.5 0 0,1 20,4.5 C20,9 11,16 11,16Z" fill={C.tealDark} opacity="0.75" />
                    </svg>

                    {/* Caja blanca fecha/lugar */}
                    <div style={{ background: C.white, borderRadius: 8, padding: "6px 8px", border: `1.5px solid ${C.beige}` }}>
                        <div style={{ fontSize: 8, fontFamily: "Arial Black, sans-serif", color: C.tealDark, lineHeight: 1.8 }}>
                            <div><b>• FECHA DE PERDIDA:</b></div>
                            <div style={{ fontWeight: 400, color: "#333", fontSize: 7.5 }}>{fecha}</div>
                            <div style={{ marginTop: 2 }}><b>• ULTIMA VEZ VISTA EN:</b></div>
                            <div style={{ fontWeight: 400, color: "#333", fontSize: 7.5 }}>{lugar}</div>
                        </div>
                    </div>

                    {/* Caja verde descripcion */}
                    <div style={{ background: C.tealLight, borderRadius: 8, padding: "6px 8px", border: `1.5px solid ${C.teal}`, flex: 1 }}>
                        <div style={{ fontSize: 9.5, fontFamily: "'Fredoka One',cursive", color: C.tealDark, marginBottom: 3 }}>DESCRIPCION:</div>
                        <div style={{ fontSize: 8, fontFamily: "Arial, sans-serif", color: "#1a1a1a", lineHeight: 1.75 }}>
                            {lineas.map((l, i) => (
                                <div key={i} style={{ display: "flex", gap: 3 }}>
                                    <span style={{ color: C.teal, fontWeight: 900 }}>&#10003;</span>
                                    <span>{l}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMNA CENTRO - Foto */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 150, height: 162, borderRadius: 10, border: `3px solid ${C.red}`, overflow: "hidden", background: C.beige, boxShadow: "3px 4px 12px rgba(0,0,0,0.2)" }}>
                        {foto
                            ? <img src={foto} alt={nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>🐕</div>
                        }
                    </div>
                </div>

                {/* COLUMNA DERECHA - Contacto */}
                <div style={{ width: 165, padding: "0 12px 0 4px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>

                    {/* Texto familia */}
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, fontFamily: "Arial Black, sans-serif", color: C.tealDark, lineHeight: 1.5, textTransform: "uppercase" }}>
                            Es parte de nuestra familia,
                        </div>
                        <div style={{ fontSize: 10, fontFamily: "Arial Black, sans-serif", color: C.tealDark, lineHeight: 1.3, textTransform: "uppercase", fontWeight: 900 }}>
                            la extrañamos mucho
                        </div>
                    </div>

                    {/* Caja contacto */}
                    <div style={{ background: C.white, borderRadius: 8, padding: "8px 10px", border: `1.5px solid ${C.beige}` }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                            {/* Icono tel naranja */}
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.orangeBtn, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                                    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                                </svg>
                            </div>
                            <div style={{ fontSize: 7, fontFamily: "Arial Black, sans-serif", color: C.tealDark, lineHeight: 1.6, textTransform: "uppercase" }}>
                                Si la has visto o tienes informacion, por favor comunicate de inmediato:
                            </div>
                        </div>
                        <div style={{ textAlign: "center", fontSize: 17, fontFamily: "'Fredoka One',cursive", color: C.tealDark, letterSpacing: 0.5 }}>
                            {telefono}
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 42, background: C.tealDark, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {[0.4, 0.65].map((op, i) => (
                    <svg key={i} width={i === 1 ? 16 : 13} height={i === 1 ? 14 : 11} viewBox="0 0 20 16">
                        <path d="M10,14 C10,14 2,8 2,4 A4,4 0 0,1 10,3 A4,4 0 0,1 18,4 C18,8 10,14 10,14Z" fill="white" opacity={op} />
                    </svg>
                ))}
                <span style={{ fontSize: 13, color: C.white, fontFamily: "'Fredoka One',cursive", letterSpacing: 0.3 }}>
                    ¡COMPARTE PARA AYUDARLO A VOLVER A CASA!
                </span>
                {[0.65, 0.4].map((op, i) => (
                    <svg key={i} width={i === 0 ? 16 : 13} height={i === 0 ? 14 : 11} viewBox="0 0 20 16">
                        <path d="M10,14 C10,14 2,8 2,4 A4,4 0 0,1 10,3 A4,4 0 0,1 18,4 C18,8 10,14 10,14Z" fill="white" opacity={op} />
                    </svg>
                ))}
            </div>
        </div>
    )
}

// ── MODAL ────────────────────────────────────────────────────
export default function ModalCartel({ datos, soloLectura = false, onCerrar }) {
    const [telefono, setTelefono] = useState(datos?.telefono || "+51 999 000 111")
    const [copiado, setCopiado] = useState(false)
    const [generandoPdf, setGenerandoPdf] = useState(false)

    if (!datos) {
        return (
            <div style={{ minHeight: "100vh", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: C.tealDark, fontFamily: "'Fredoka One',cursive", fontSize: 20 }}>
                    Ve a Reportes y pulsa "Generar cartel"
                </div>
            </div>
        )
    }

    const clickFuera = (e) => { if (e.target === e.currentTarget) onCerrar() }

    const copiarEnlace = () => {
        navigator.clipboard.writeText(`https://pawfinder.app/reporte/${datos.nombre?.toLowerCase()}-${datos.id}`)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
    }

    const generarPDF = async () => {
        setGenerandoPdf(true)
        try {
            await Promise.all([
                new Promise((res, rej) => {
                    if (window.html2canvas) return res()
                    const s = document.createElement("script")
                    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
                    s.onload = res; s.onerror = rej
                    document.head.appendChild(s)
                }),
                new Promise((res, rej) => {
                    if (window.jspdf) return res()
                    const s = document.createElement("script")
                    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
                    s.onload = res; s.onerror = rej
                    document.head.appendChild(s)
                }),
            ])
            const el = document.getElementById("cartel-preview")
            if (!el) throw new Error("Elemento no encontrado")
            const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#F0E8CE" })
            const imgData = canvas.toDataURL("image/png")
            const { jsPDF } = window.jspdf
            const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] })
            pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2)
            pdf.save(`cartel-${datos.nombre || "mascota"}.pdf`)
        } catch (err) {
            console.error("Error generando PDF:", err)
            alert("Error al generar el PDF. Intenta de nuevo.")
        }
        setGenerandoPdf(false)
    }

    const compartirWhatsApp = () => {
        const texto = encodeURIComponent(`SE BUSCA: ${datos.nombre} (${datos.raza}) — Visto en ${datos.lugar}. Contactar: ${telefono} — pawfinder.app`)
        window.open(`https://wa.me/?text=${texto}`, "_blank")
    }

    const compartirTelegram = () => {
        const texto = encodeURIComponent(`SE BUSCA: ${datos.nombre} — ${datos.lugar} — Tel: ${telefono}`)
        window.open(`https://t.me/share/url?url=https://pawfinder.app&text=${texto}`, "_blank")
    }

    return (
        <div onClick={clickFuera} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#fff", borderRadius: 20, maxHeight: "96vh", overflowY: "auto", boxShadow: "0 24px 70px rgba(0,0,0,.45)", display: "flex" }}>

                {/* Vista previa */}
                <div style={{ padding: 20, background: "#ece8de", borderRadius: "20px 0 0 20px", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                    <div style={{ fontFamily: "'Fredoka One',cursive", color: C.tealDark, fontSize: 13, alignSelf: "flex-start" }}>Vista previa del cartel</div>
                    <CartelPreview datos={datos} telefono={telefono} />
                </div>

                {/* Panel lateral */}
                <div style={{ width: 230, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'Fredoka One',cursive", color: C.tealDark, fontSize: 15 }}>Opciones</span>
                        <button onClick={onCerrar} style={{ background: C.beigeLight, border: "none", color: C.tealDark, fontWeight: 900, width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>x</button>
                    </div>

                    {!soloLectura && (
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 800, color: C.tealDark, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Telefono en el cartel</label>
                            <input
                                value={telefono}
                                onChange={e => setTelefono(e.target.value)}
                                style={{ width: "100%", padding: "7px 10px", borderRadius: 9, border: `1.5px solid ${C.beige}`, background: "#f8f4ec", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "#1a1a1a", boxSizing: "border-box" }}
                            />
                        </div>
                    )}

                    <div>
                        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 13, color: C.tealDark, marginBottom: 8 }}>Difusion</div>
                        <button onClick={compartirWhatsApp} style={{ width: "100%", padding: "8px", borderRadius: 10, border: "none", background: "#25d366", color: "#fff", fontFamily: "inherit", fontWeight: 800, fontSize: 11, cursor: "pointer", marginBottom: 6, display: "block" }}>
                            Compartir en WhatsApp
                        </button>
                        <button onClick={compartirTelegram} style={{ width: "100%", padding: "8px", borderRadius: 10, border: "none", background: "#0088cc", color: "#fff", fontFamily: "inherit", fontWeight: 800, fontSize: 11, cursor: "pointer", marginBottom: 6, display: "block" }}>
                            Compartir en Telegram
                        </button>
                        <button onClick={generarPDF} disabled={generandoPdf} style={{ width: "100%", padding: "8px", borderRadius: 10, border: "none", background: generandoPdf ? C.beigeLight : C.orangeBtn, color: generandoPdf ? C.muted : "#fff", fontFamily: "inherit", fontWeight: 800, fontSize: 11, cursor: generandoPdf ? "wait" : "pointer", marginBottom: 6, display: "block" }}>
                            {generandoPdf ? "Generando PDF..." : "Descargar PDF"}
                        </button>
                        <button onClick={copiarEnlace} style={{ width: "100%", padding: "8px", borderRadius: 10, border: "none", background: copiado ? C.tealLight : "#e8e0d0", color: copiado ? C.tealDark : "#333", fontFamily: "inherit", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>
                            {copiado ? "Enlace copiado" : "Copiar enlace"}
                        </button>
                    </div>

                    <div style={{ background: C.tealLight, borderRadius: 10, padding: 10, border: `1px solid ${C.beige}`, fontSize: 9, color: C.tealDark, fontFamily: "Arial,sans-serif", lineHeight: 1.7 }}>
                        El PDF se descargara con el diseño del cartel listo para imprimir en A4 horizontal.
                    </div>
                </div>
            </div>
        </div>
    )
}