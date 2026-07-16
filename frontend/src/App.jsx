import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { auth } from "./firebase/firebaseConfig"
import { signOut } from "firebase/auth"
import Home from "./pages/Home"
import Mapa from "./pages/Mapa"
import Campanas from "./pages/Campanas"
import Login from "./pages/Login"
import Veterinarias from "./pages/Veterinarias"
import Adopciones from "./pages/Adopciones"
import Reportes from "./pages/Reportes"
import logo from "./assets/logo.jpg"
import FondoAnimado from "./components/FondoAnimado"

const API = import.meta.env.VITE_API_URL

// ── ESTILOS GLOBALES DEL NAVBAR ─────────────────────────────────
const NAV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  body, button, input, select, textarea { font-family: 'Plus Jakarta Sans', sans-serif; }

  /* ── Keyframes ── */
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-10px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)     scale(1);    }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  /* ─────────────────────────────────────
     HUESO — forma del botón de navegación
  ───────────────────────────────────── */
  .bone-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    text-decoration: none;
    padding: 0;
    background: none;
    border: none;
    /* elástico y suave */
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1),
                filter  0.22s ease;
    -webkit-tap-highlight-color: transparent;
    outline: none;
  }

  /* hover: sube ligeramente + sombra cálida */
  .bone-btn:hover {
    transform: translateY(-4px) scale(1.045);
    filter: drop-shadow(0 8px 16px rgba(0,0,0,0.22));
  }

  /* activo: elevado + glow dorado */
  .bone-btn.active {
    transform: translateY(-3px) scale(1.04);
    filter: drop-shadow(0 6px 18px rgba(229,185,91,0.55));
  }

  /* SVG del hueso — ancho suficiente para "Campañas de vacunación" */
  .bone-svg { width: 210px; height: 68px; display: block; }

  /* cuerpo del hueso en reposo: beige cálido con borde tenue */
  .bone-body {
    fill: #ddd1b3;
    transition: fill 0.22s ease;
  }

  /* hover → amarillo dorado suave */
  .bone-btn:hover .bone-body { fill: #e5b95b; }

  /* activo → dorado más rico */
  .bone-btn.active .bone-body { fill: #e8b84b; }

  /* texto centrado sobre el hueso */
  .bone-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 12.5px;
    letter-spacing: -0.2px;
    color: #0e3e46;
    pointer-events: none;
    white-space: nowrap;
    transition: color 0.22s ease;
  }

  /* en hover y activo el texto se vuelve blanco */
  .bone-btn:hover  .bone-text { color: #fff; }
  .bone-btn.active .bone-text { color: #fff; }

  /* ─────────────────────────────────────
     DROPDOWN DE PERFIL
  ───────────────────────────────────── */
  .perfil-menu {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.06);
    min-width: 230px;
    z-index: 999;
    overflow: hidden;
    animation: fadeSlideDown 0.2s ease;
  }

  .perfil-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 20px;
    font-size: 14px;
    font-weight: 600;
    color: #0e3e46;
    cursor: pointer;
    transition: background 0.15s;
    text-decoration: none;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .perfil-item:hover       { background: #f5f0e8; }
  .perfil-item.danger      { color: #c62828; }
  .perfil-item.danger:hover{ background: #fff0f0; }

  /* ─────────────────────────────────────
     MODAL OVERLAY + BOX
  ───────────────────────────────────── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.52);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  }
  .modal-box {
    background: #fff;
    border-radius: 22px;
    padding: 28px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.22);
    animation: fadeSlideUp 0.22s ease;
  }

  /* ─────────────────────────────────────
     BOTÓN PERFIL (trigger)
  ───────────────────────────────────── */
  .perfil-trigger {
    display: flex;
    align-items: center;
    gap: 9px;
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.2);
    border-radius: 40px;
    padding: 5px 14px 5px 5px;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 14px;
    transition: background 0.2s ease, transform 0.2s ease;
    backdrop-filter: blur(6px);
  }
  .perfil-trigger:hover {
    background: rgba(255,255,255,0.22);
    transform: translateY(-1px);
  }

  /* ─────────────────────────────────────
     CAMPANITA DE NOTIFICACIONES
  ───────────────────────────────────── */
  .bell-btn {
    position: relative;
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.2);
    border-radius: 50%;
    width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s cubic-bezier(.34,1.56,.64,1);
    backdrop-filter: blur(6px);
    flex-shrink: 0;
  }
  .bell-btn:hover {
    background: rgba(255,255,255,0.22);
    transform: translateY(-2px);
  }
  .bell-badge {
    position: absolute;
    top: -3px; right: -3px;
    background: #e8b84b;
    color: #0a3d2d;
    border-radius: 99px;
    font-size: 10px; font-weight: 900;
    min-width: 17px; height: 17px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px;
    border: 2px solid #036668;
    animation: bellPulse 2s ease-in-out infinite;
  }
  @keyframes bellPulse {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.15); }
  }
  .bell-panel {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.07);
    border: 1px solid rgba(0,0,0,0.06);
    width: 310px;
    z-index: 999;
    overflow: hidden;
    animation: fadeSlideDown 0.2s ease;
  }
  .bell-notif {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid #f5f0e8;
    cursor: pointer;
    transition: background 0.15s;
  }
  .bell-notif:last-child { border-bottom: none; }
  .bell-notif:hover { background: #faf6ef; }
  .bell-notif.unread { background: #fffbf0; }
  .bell-notif.unread:hover { background: #faf0d4; }

  /* ─────────────────────────────────────
     BOTÓN LOGIN
  ───────────────────────────────────── */
  .nav-login-btn {
    background: #e8b84b;
    color: #0a3d2d;
    border: none;
    border-radius: 40px;
    padding: 11px 24px;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 4px 16px rgba(232,184,75,0.4);
    transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease;
  }
  .nav-login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(232,184,75,0.55);
  }

  /* ─────────────────────────────────────
     LOGO HOVER
  ───────────────────────────────────── */
  .nav-logo {
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1),
                box-shadow 0.22s ease;
  }
  .nav-logo:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(0,0,0,0.28) !important;
  }

  /* ─────────────────────────────────────
     RESPONSIVE TABLET ≤1100px
  ───────────────────────────────────── */
  @media (max-width: 1100px) {
    .bone-svg  { width: 175px; height: 56px; }
    .bone-text { font-size: 11.5px; }
  }
  @media (max-width: 960px) {
    .bone-svg  { width: 155px; height: 50px; }
    .bone-text { font-size: 11px; }
  }

  /* ─────────────────────────────────────
     MÓVIL ≤768px — ocultar huesos, mostrar hamburger
  ───────────────────────────────────── */
  @media (max-width: 768px) {
    .nav-bones-wrap  { display: none !important; }
    .nav-hamburger   { display: flex !important; }
    .nav-nombre-text { display: none !important; }
    .bell-panel      { width: min(300px, 88vw) !important; right: -10px !important; }
  }

  /* ─────────────────────────────────────
     HAMBURGER BUTTON
  ───────────────────────────────────── */
  .nav-hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
    width: 42px; height: 42px;
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.2s ease;
    backdrop-filter: blur(6px);
    -webkit-tap-highlight-color: transparent;
  }
  .nav-hamburger:hover { background: rgba(255,255,255,0.22); }
  .nav-hamburger span {
    display: block;
    width: 20px; height: 2px;
    background: white;
    border-radius: 2px;
    transition: all 0.28s cubic-bezier(.4,0,.2,1);
    transform-origin: center;
  }
  .nav-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .nav-hamburger.open span:nth-child(2) { opacity:0; transform: scaleX(0); }
  .nav-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* ─────────────────────────────────────
     DRAWER LATERAL
  ───────────────────────────────────── */
  .pf-drawer-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.52);
    backdrop-filter: blur(3px);
    z-index: 9990;
    animation: fadeIn .2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  .pf-drawer-panel {
    position: fixed;
    top: 0; left: 0;
    width: min(290px, 84vw);
    height: 100%;
    background: linear-gradient(180deg, #033f3f 0%, #036668 60%, #077878 100%);
    z-index: 9991;
    display: flex;
    flex-direction: column;
    box-shadow: 6px 0 32px rgba(0,0,0,0.35);
    animation: slideDrawer .26s cubic-bezier(.4,0,.2,1);
    overflow-y: auto;
  }
  @keyframes slideDrawer {
    from { transform: translateX(-100%); opacity:.6; }
    to   { transform: translateX(0);     opacity:1;  }
  }
  .pf-drawer-link {
    display: flex; align-items: center;
    gap: 14px; padding: 14px 22px;
    text-decoration: none;
    color: rgba(255,255,255,0.82);
    font-size: 14px; font-weight: 700;
    border-left: 3px solid transparent;
    transition: all .18s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .pf-drawer-link:hover { background: rgba(255,255,255,0.1); color: white; }
  .pf-drawer-link.active {
    color: #e8b84b;
    border-left-color: #e8b84b;
    background: rgba(232,184,75,0.1);
  }
  .pf-drawer-icon {
    width: 34px; height: 34px; border-radius: 10px;
    background: rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .pf-drawer-link.active .pf-drawer-icon { background: rgba(232,184,75,0.2); }

  /* ─────────────────────────────────────
     BOTTOM NAV BAR
  ───────────────────────────────────── */
  .pf-bottom-nav {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(180deg, #036668, #033f3f);
    border-top: 1px solid rgba(255,255,255,0.1);
    z-index: 880;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    transition: transform 0.3s cubic-bezier(.4,0,.2,1);
  }
  .pf-bottom-nav.hidden { transform: translateY(100%); }
  .pf-bottom-nav-inner {
    display: flex; justify-content: space-around;
    align-items: center; height: 58px;
    max-width: 480px; margin: 0 auto;
  }
  .pf-bnav-item {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 2px; flex: 1;
    text-decoration: none;
    color: rgba(255,255,255,0.5);
    font-size: 9px; font-weight: 700;
    border: none; background: none;
    cursor: pointer; padding: 6px 0;
    transition: color .15s;
    font-family: 'Plus Jakarta Sans', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  .pf-bnav-item.active,
  .pf-bnav-item:hover { color: #e8b84b; }
  .pf-bnav-item .pf-bnav-icon { font-size: 20px; line-height: 1; }

  @media (max-width: 768px) {
    .pf-bottom-nav { display: block; }
  }
`

// ── SVG ICONS para huesitos ──────────────────────────────────────
const BONE_ICONS = {
  home: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  report: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="20" r="2"/>
      <path d="M11 6v5l-3 2M11 11l3 2M4 18l4-4M20 18l-4-4"/>
    </svg>
  ),
  map: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  shield: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  heart: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
}

// ── COMPONENTE BONE LINK ─────────────────────────────────────────
function BoneLink({ name, path: linkPath, iconKey }) {
  const loc  = useLocation()
  const active = loc.pathname === linkPath

  return (
    <Link to={linkPath} className={`bone-btn${active ? " active" : ""}`} title={name}>
      <svg className="bone-svg" viewBox="0 0 100 34" xmlns="http://www.w3.org/2000/svg">
        <rect  className="bone-body" x="12"  y="7"  width="76" height="20" rx="10" />
        <ellipse className="bone-body" cx="12"  cy="9"  rx="9.5" ry="8" />
        <ellipse className="bone-body" cx="12"  cy="25" rx="9.5" ry="8" />
        <ellipse className="bone-body" cx="88"  cy="9"  rx="9.5" ry="8" />
        <ellipse className="bone-body" cx="88"  cy="25" rx="9.5" ry="8" />
      </svg>
      <span className="bone-text" style={{ display:"flex", alignItems:"center", gap:5 }}>
        {iconKey && <span style={{ display:"flex", alignItems:"center", lineHeight:1 }}>{BONE_ICONS[iconKey]}</span>}
        {name}
      </span>
    </Link>
  )
}

// ── NAVBAR ────────────────────────────────────────────────────────
function Navbar() {
  const [usuario,    setUsuario]    = useState(null)
  const [usuarioDb,  setUsuarioDb]  = useState(null)
  const [menuAbierto,setMenuAbierto]= useState(false)
  const [bellAbierto,setBellAbierto]= useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [navHidden,  setNavHidden]  = useState(false)
  const menuRef     = useRef(null)
  const bellRef     = useRef(null)
  const lastScrollY = useRef(0)
  const navigate    = useNavigate()
  const loc         = useLocation()

  // Cierra drawer al cambiar de ruta
  useEffect(() => { setDrawerOpen(false) }, [loc.pathname])

  // Auto-hide bottom nav al scrollear
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const diff = y - lastScrollY.current
      if (diff > 8 && y > 60) setNavHidden(true)
      else if (diff < -8) setNavHidden(false)
      lastScrollY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const [notificaciones, setNotificaciones] = useState([])
  const noLeidas = notificaciones.filter(n => !n.leida).length

  // Carga notificaciones reales desde la BD
  const cargarNotificaciones = async (uid) => {
    if (!uid) return
    try {
      const res = await fetch(`${API}/api/notificaciones?firebase_uid=${uid}`)
      if (res.ok) {
        const data = await res.json()
        // Formatear tiempo relativo
        const formateadas = data.map(n => ({
          ...n,
          texto:  n.mensaje,
          tiempo: tiempoRelativo(n.created_at),
          leida:  n.leida,
        }))
        setNotificaciones(formateadas)
      }
    } catch (e) { console.error('Error cargando notificaciones:', e) }
  }

  // Tiempo relativo (ej: "Hace 5 min")
  const tiempoRelativo = (fecha) => {
    const diff = Date.now() - new Date(fecha).getTime()
    const mins  = Math.floor(diff / 60000)
    const horas = Math.floor(diff / 3600000)
    const dias  = Math.floor(diff / 86400000)
    if (mins  < 1)  return 'Ahora'
    if (mins  < 60) return `Hace ${mins} min`
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`
  }

  // Marcar como leída
  const marcarLeida = async (id) => {
    try {
      await fetch(`${API}/api/notificaciones/leida/${id}`, { method: 'PUT' })
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    } catch (e) { console.error(e) }
  }

  // Marcar todas leídas
  const marcarTodasLeidas = async () => {
    if (!usuario) return
    try {
      await fetch(`${API}/api/notificaciones/leer-todas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: usuario.uid }),
      })
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    } catch (e) { console.error(e) }
  }

  const NOTIF_ICONS = {
    similitud: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E07B27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="5" cy="11" r="2"/><circle cx="19" cy="11" r="2"/><path d="M12 22c-3 0-7-2-7-6 0-2 2-3 4-4 1-.5 2-1 3-1s2 .5 3 1c2 1 4 2 4 4 0 4-4 6-7 6z"/></svg>,
    paw:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#036668" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="5" cy="11" r="2"/><circle cx="19" cy="11" r="2"/><path d="M12 22c-3 0-7-2-7-6 0-2 2-3 4-4 1-.5 2-1 3-1s2 .5 3 1c2 1 4 2 4 4 0 4-4 6-7 6z"/></svg>,
    comment:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#036668" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    check:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#036668" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    eye:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#036668" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    bell:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#036668" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  }

  // "Panel de resumen" eliminado según requisitos
  const links = [
    { name:"Inicio",                 path:"/",            iconKey:"home"     },
    { name:"Reportar mascota",       path:"/Reportes",    iconKey:"report"   },
    { name:"Mapa de reportes",       path:"/mapa",        iconKey:"map"      },
    { name:"Campañas de vacunación", path:"/campanas",    iconKey:"shield"   },
    { name:"Adopciones",             path:"/adopciones",  iconKey:"heart"    },
  ]

  // ── Auth: carga usuario y datos DB
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setUsuario(user)
      if (user) {
        try {
          const res = await fetch(`${API}/api/auth/usuario/${user.uid}`)
          if (res.ok) setUsuarioDb(await res.json())
        } catch (e) { console.error(e) }
        cargarNotificaciones(user.uid)
        // Recargar notificaciones cada 60 segundos
        const intervalo = setInterval(() => cargarNotificaciones(user.uid), 60000)
        return () => clearInterval(intervalo)
      } else { setUsuarioDb(null) }
    })
    return () => unsub()
  }, [])

  // listener interno preservado (no tocar)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      // ... este es el primero, no lo toques
    })
    return () => unsub()
  }, [])

  // escucha evento de perfil actualizado
  useEffect(() => {
    const handler = (e) => {
      setUsuarioDb(prev => ({ ...prev, nombre: e.detail.nombre, foto_url: e.detail.foto_url }))
    }
    window.addEventListener("perfilActualizado", handler)
    return () => window.removeEventListener("perfilActualizado", handler)
  }, [])

  // listener interno preservado (no tocar)
  useEffect(() => {
    const handleClick = (e) => {
      // ... este es el segundo, no lo toques
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // cierra el menú al hacer click fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellAbierto(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleCerrarSesion = async () => {
    await signOut(auth)
    setMenuAbierto(false)
    navigate("/")
  }

  const fotoUrl     = usuarioDb?.foto_url || usuario?.photoURL || null
  const nombreCorto = (usuarioDb?.nombre || usuario?.email || "U").split(" ")[0]

  return (
    <>
      <style>{NAV_CSS}</style>
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      <nav style={{
        background:    "linear-gradient(135deg, #033f3f 0%, #036668 50%, #077878 100%)",
        borderBottom:  "1px solid rgba(255,255,255,0.07)",
        boxShadow:     "0 4px 28px rgba(3,60,60,0.38)",
        display:       "flex",
        alignItems:    "center",
        justifyContent:"space-between",
        padding:       "10px 28px",
        flexWrap:      "wrap",
        gap:            12,
        position:      "sticky",
        top:            0,
        zIndex:         900,
      }}>

        {/* ── LOGO ── */}
        <Link to="/" style={{ display:"flex", alignItems:"center", textDecoration:"none", flexShrink:0 }}>
          <img
            src={logo}
            alt="PawFinder"
            className="nav-logo"
            style={{
              height:       60,
              width:        "auto",
              borderRadius: 14,
              border:       "2px solid rgba(255,255,255,0.18)",
              boxShadow:    "0 4px 16px rgba(0,0,0,0.22)",
            }}
          />
        </Link>

        {/* ── LINKS (solo desktop) ── */}
        <div className="nav-bones-wrap" style={{
          display:        "flex",
          gap:             4,
          flexWrap:       "wrap",
          justifyContent: "center",
          alignItems:     "center",
        }}>
          {links.map(({ name, path: linkPath, iconKey }) => (
            <BoneLink key={linkPath} name={name} path={linkPath} iconKey={iconKey} />
          ))}
        </div>

        {/* ── CAMPANITA + PERFIL / LOGIN ── */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>

          {/* Campanita de notificaciones — solo si hay sesión */}
          {usuario && (
          <div ref={bellRef} style={{ position:"relative" }}>
            <button className="bell-btn" onClick={() => setBellAbierto(v => !v)} title="Notificaciones">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {noLeidas > 0 && <span className="bell-badge">{noLeidas}</span>}
            </button>

            {bellAbierto && (
              <div className="bell-panel">
                {/* Cabecera */}
                <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid #f0ebe0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontWeight:800, fontSize:14, color:"#0e3e46" }}>Notificaciones</span>
                  {noLeidas > 0 && (
                    <span style={{ fontSize:11, fontWeight:700, color:"#e8b84b", background:"#fffbf0", borderRadius:99, padding:"2px 8px", border:"1px solid #e8b84b" }}>
                      {noLeidas} nuevas
                    </span>
                  )}
                </div>
                {/* Lista */}
                {notificaciones.length === 0 && (
                  <div style={{ padding:"20px 16px", textAlign:"center", color:"#999", fontSize:12 }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>🔔</div>
                    Sin notificaciones aún
                  </div>
                )}
                {notificaciones.map(n => (
                  <div key={n.id} className={`bell-notif${!n.leida ? " unread" : ""}`}
                    onClick={() => !n.leida && marcarLeida(n.id)}
                    style={{ cursor: !n.leida ? "pointer" : "default" }}>
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:"50%", background: n.leida ? "#f0ebe0" : "#e0f2f2", flexShrink:0, marginTop:1 }}>
                      {NOTIF_ICONS[n.tipo]}
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:12.5, fontWeight: n.leida ? 500 : 700, color:"#0e3e46", lineHeight:1.4 }}>{n.texto || n.mensaje}</p>
                      <p style={{ margin:"3px 0 0", fontSize:11, color:"#999", fontWeight:500 }}>{n.tiempo}</p>
                    </div>
                    {!n.leida && (
                      <div style={{ width:8, height:8, borderRadius:"50%", background:"#e8b84b", flexShrink:0, marginTop:4 }} />
                    )}
                  </div>
                ))}
                {/* Footer */}
                <div style={{ padding:"10px 16px", borderTop:"1px solid #f0ebe0", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                  {noLeidas > 0 && (
                    <button onClick={marcarTodasLeidas}
                      style={{ fontSize:11, fontWeight:700, color:"#036668", background:"none", border:"1px solid #036668", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      ✓ Marcar todas leídas
                    </button>
                  )}
                  <button onClick={() => { setBellAbierto(false); window.location.href='/Reportes' }}
                    style={{ fontSize:11, fontWeight:700, color:"#036668", background:"none", border:"none", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", marginLeft:"auto" }}>
                    Ver mis reportes →
                  </button>
                </div>
              </div>
            )}
          </div>)}

          {/* ── PERFIL / LOGIN ── */}
          {usuario ? (
            <div ref={menuRef} style={{ position:"relative" }}>

            {/* botón disparador */}
            <button
              onClick={() => setMenuAbierto(v => !v)}
              className="perfil-trigger"
            >
              {fotoUrl ? (
                <img
                  src={fotoUrl} alt="perfil"
                  style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(255,255,255,0.45)", flexShrink:0 }}
                  onError={(e) => { e.target.style.display="none"; e.target.nextSibling.style.display="flex" }}
                />
              ) : null}
              <div style={{ width:34, height:34, borderRadius:"50%", background:"#e8b84b", display: fotoUrl ? "none" : "flex", alignItems:"center", justifyContent:"center", fontSize:15, color:"#0e3e46", fontWeight:900, flexShrink:0 }}>
                {nombreCorto[0].toUpperCase()}
              </div>
              <span className="nav-nombre-text" style={{ fontSize:14, color:"rgba(255,255,255,0.92)", maxWidth:110, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {nombreCorto}
              </span>
              {/* flecha SVG que rota al abrir */}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink:0, opacity:0.75, transition:"transform 0.2s", transform: menuAbierto ? "rotate(180deg)" : "none" }}>
                <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* dropdown */}
            {menuAbierto && (
              <div className="perfil-menu">
                {/* cabecera del dropdown */}
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #f0ebe0", background:"#fafaf8", display:"flex", alignItems:"center", gap:12 }}>
                  {fotoUrl ? (
                    <img src={fotoUrl} alt=""
                      style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", border:"2px solid #D9C4A0" }}
                      onError={(e) => { e.target.style.display="none"; e.target.nextSibling.style.display="flex" }}
                    />
                  ) : null}
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"#036668", display: fotoUrl ? "none" : "flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"white", fontWeight:900, flexShrink:0 }}>
                    {nombreCorto[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:"#0e3e46", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {usuarioDb?.nombre || "Usuario"}
                    </div>
                    <div style={{ fontSize:12, color:"#888", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {usuario.email}
                    </div>
                  </div>
                </div>

                <Link to="/mi-cuenta" className="perfil-item" onClick={() => setMenuAbierto(false)}>
                  Mi cuenta
                </Link>
                <button className="perfil-item danger" onClick={handleCerrarSesion}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" style={{ textDecoration:"none", flexShrink:0 }}>
            <button className="nav-login-btn">Iniciar sesión</button>
          </Link>
        )}
          {/* ── HAMBURGER (solo móvil) ── */}
          <button
            className={`nav-hamburger${drawerOpen ? " open" : ""}`}
            onClick={() => setDrawerOpen(v => !v)}
            aria-label="Abrir menú"
          >
            <span /><span /><span />
          </button>

        </div>{/* end bell+profile wrapper */}
      </nav>

      {/* ── DRAWER MÓVIL ── */}
      {drawerOpen && (
        <>
          <div className="pf-drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="pf-drawer-panel">
            {/* Header drawer */}
            <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <img src={logo} alt="PawFinder" style={{ height:46, borderRadius:10, border:"2px solid rgba(255,255,255,0.2)" }} />
                <button onClick={() => setDrawerOpen(false)}
                  style={{ background:"rgba(255,255,255,0.12)", border:"none", color:"white", width:32, height:32, borderRadius:10, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>
              {usuario ? (
                <div style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.08)", borderRadius:14, padding:"10px 14px" }}>
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="" style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover", border:"2px solid #e8b84b" }} />
                  ) : (
                    <div style={{ width:38, height:38, borderRadius:"50%", background:"#e8b84b", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:15, color:"#0e3e46", flexShrink:0 }}>
                      {nombreCorto[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:800, color:"white", fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{usuarioDb?.nombre || nombreCorto}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.55)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{usuario.email}</div>
                  </div>
                </div>
              ) : (
                <Link to="/login" onClick={() => setDrawerOpen(false)}
                  style={{ display:"block", textAlign:"center", padding:"11px", borderRadius:14, background:"#e8b84b", color:"#0a3d2d", fontWeight:900, fontSize:14, textDecoration:"none" }}>
                  Iniciar sesión
                </Link>
              )}
            </div>

            {/* Links */}
            <div style={{ flex:1, paddingTop:8, paddingBottom:8 }}>
              {links.map(({ name, path: lp, iconKey }) => {
                const EMOJIS = { home:"🏠", report:"🐾", map:"🗺️", shield:"💉", heart:"❤️" }
                return (
                  <Link key={lp} to={lp} className={`pf-drawer-link${loc.pathname === lp ? " active" : ""}`}>
                    <span className="pf-drawer-icon">{EMOJIS[iconKey] || "•"}</span>
                    {name}
                  </Link>
                )
              })}
            </div>

            {/* Footer drawer */}
            {usuario && (
              <div style={{ padding:"12px 16px 24px", borderTop:"1px solid rgba(255,255,255,0.1)" }}>
                <Link to="/mi-cuenta" onClick={() => setDrawerOpen(false)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:12, background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.8)", textDecoration:"none", fontSize:13, fontWeight:700, marginBottom:8 }}>
                  👤 Mi cuenta
                </Link>
                <button onClick={() => { handleCerrarSesion(); setDrawerOpen(false) }}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:12, background:"rgba(220,38,38,0.15)", color:"#fca5a5", border:"none", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:12, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  🚪 Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── BOTTOM NAV (solo móvil) ── */}
      <nav className={`pf-bottom-nav${navHidden ? " hidden" : ""}`}>
        <div className="pf-bottom-nav-inner">
          {[
            { name:"Inicio",   path:"/",           icon:"🏠" },
            { name:"Reportes", path:"/Reportes",   icon:"🐾" },
            { name:"Mapa",     path:"/mapa",       icon:"🗺️" },
            { name:"Campañas", path:"/campanas",   icon:"💉" },
            { name:"Adoptar",  path:"/adopciones", icon:"❤️" },
          ].map(({ name, path: bp, icon }) => (
            <Link key={bp} to={bp} className={`pf-bnav-item${loc.pathname === bp ? " active" : ""}`}>
              <span className="pf-bnav-icon">{icon}</span>
              <span>{name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}

// ── MI CUENTA ────────────────────────────────────────────────────
function MiCuenta() {
  const [usuario,          setUsuario]          = useState(null)
  const [usuarioDb,        setUsuarioDb]         = useState(null)
  const [nombre,           setNombre]            = useState("")
  const [celular,          setCelular]           = useState("")
  const [dni,              setDni]               = useState("")
  const [fechaNacimiento,  setFechaNacimiento]   = useState("")
  const [direccion,        setDireccion]         = useState("")
  const [genero,           setGenero]            = useState("")
  const [fotoPreview,      setFotoPreview]       = useState(null)
  const [fotoBase64,       setFotoBase64]        = useState(null)
  const [guardando,        setGuardando]         = useState(false)
  const [mensaje,          setMensaje]           = useState({ texto:"", tipo:"" })
  const [modalEmail,       setModalEmail]        = useState(false)
  const [modalPassword,    setModalPassword]     = useState(false)
  const [modalEliminar,    setModalEliminar]     = useState(false)
  const [confirmTexto,     setConfirmTexto]      = useState("")
  const [nuevoEmail,       setNuevoEmail]        = useState("")
  const [passwordActual,   setPasswordActual]    = useState("")
  const [nuevaPassword,    setNuevaPassword]     = useState("")
  const [confirmarPassword,setConfirmarPassword] = useState("")
  const fileInputRef = useRef(null)
  const navigate     = useNavigate()

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { navigate("/login"); return }
      setUsuario(user)
      setNuevoEmail(user.email)
      try {
        const res = await fetch(`${API}/api/auth/usuario/${user.uid}`)
        if (res.ok) {
          const data = await res.json()
          setUsuarioDb(data)
          setNombre(data.nombre || "")
          setCelular(data.celular || "")
          setDni(data.dni || "")
          setFechaNacimiento(data.fecha_nacimiento ? data.fecha_nacimiento.slice(0,10) : "")
          setDireccion(data.direccion || "")
          setGenero(data.genero || "")
          setFotoPreview(data.foto_url || user.photoURL || null)
        }
      } catch (e) { console.error(e) }
    })
    return () => unsub()
  }, [])

  const mostrarMensaje = (texto, tipo = "exito") => {
    setMensaje({ texto, tipo })
    setTimeout(() => setMensaje({ texto:"", tipo:"" }), 4000)
  }

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert("Máximo 2MB"); return }
    const reader = new FileReader()
    reader.onloadend = () => { setFotoPreview(reader.result); setFotoBase64(reader.result) }
    reader.readAsDataURL(file)
  }

  const guardarCambios = async () => {
    if (!nombre.trim()) { mostrarMensaje("El nombre no puede estar vacío", "error"); return }
    setGuardando(true)
    try {
      const res = await fetch(`${API}/api/auth/actualizar`, {
        method: "PUT",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          firebase_uid: usuario.uid, nombre,
          foto_url: fotoBase64 || fotoPreview || null,
          celular: celular || null,
          dni: dni || null,
          fecha_nacimiento: fechaNacimiento || null,
          direccion: direccion || null,
          genero: genero || null,
        })
      })
      if (res.ok) {
        mostrarMensaje("✅ Perfil actualizado correctamente")
        setFotoBase64(null)
        window.dispatchEvent(new CustomEvent("perfilActualizado", { detail: { foto_url: fotoBase64 || fotoPreview, nombre } }))
      } else mostrarMensaje("❌ Error al guardar", "error")
    } catch { mostrarMensaje("❌ Error al conectar", "error") }
    finally { setGuardando(false) }
  }

  const cambiarEmail = async () => {
    if (!nuevoEmail.trim() || nuevoEmail === usuario.email) { mostrarMensaje("Ingresa un email diferente", "error"); return }
    if (!passwordActual) { mostrarMensaje("Ingresa tu contraseña actual", "error"); return }
    setGuardando(true)
    try {
      const { signInWithEmailAndPassword, updateEmail } = await import("firebase/auth")
      await signInWithEmailAndPassword(auth, usuario.email, passwordActual)
      await updateEmail(auth.currentUser, nuevoEmail)
      await fetch(`${API}/api/auth/actualizar`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ firebase_uid: usuario.uid, nombre, foto_url: fotoPreview })
      })
      mostrarMensaje("✅ Email actualizado correctamente")
      setModalEmail(false)
      setPasswordActual("")
    } catch (e) {
      if      (e.code === "auth/wrong-password")      mostrarMensaje("❌ Contraseña incorrecta",   "error")
      else if (e.code === "auth/email-already-in-use") mostrarMensaje("❌ Email ya en uso",         "error")
      else                                              mostrarMensaje("❌ " + e.message,           "error")
    } finally { setGuardando(false) }
  }

  const cambiarPassword = async () => {
    if (!passwordActual)                             { mostrarMensaje("Ingresa tu contraseña actual",    "error"); return }
    if (!nuevaPassword || nuevaPassword.length < 6)  { mostrarMensaje("Mínimo 6 caracteres",            "error"); return }
    if (nuevaPassword !== confirmarPassword)          { mostrarMensaje("Las contraseñas no coinciden",   "error"); return }
    setGuardando(true)
    try {
      const { signInWithEmailAndPassword, updatePassword } = await import("firebase/auth")
      await signInWithEmailAndPassword(auth, usuario.email, passwordActual)
      await updatePassword(auth.currentUser, nuevaPassword)
      mostrarMensaje("✅ Contraseña actualizada")
      setModalPassword(false)
      setPasswordActual(""); setNuevaPassword(""); setConfirmarPassword("")
    } catch (e) {
      if (e.code === "auth/wrong-password") mostrarMensaje("❌ Contraseña incorrecta", "error")
      else                                  mostrarMensaje("❌ " + e.message,          "error")
    } finally { setGuardando(false) }
  }

  const eliminarCuenta = async () => {
    if (confirmTexto.trim().toLowerCase() !== "eliminar") {
      mostrarMensaje('Escribe "eliminar" para confirmar', "error"); return
    }
    setGuardando(true)
    try {
      await fetch(`${API}/api/auth/usuario/${usuario.uid}`, { method: "DELETE" })
      const { deleteUser } = await import("firebase/auth")
      await deleteUser(auth.currentUser)
      navigate("/login")
    } catch (e) {
      mostrarMensaje("❌ Error al eliminar la cuenta. Si usas Google, vuelve a iniciar sesión primero.", "error")
    } finally { setGuardando(false) }
  }

  if (!usuario) return null

  const esGoogleUser = usuario.providerData?.[0]?.providerId === "google.com"

  const inputSty = {
    width:"100%", padding:"10px 14px", borderRadius:10,
    border:"1.5px solid #007A7B", fontSize:13, color:"#003F5A",
    boxSizing:"border-box", outline:"none",
    fontFamily:"'Plus Jakarta Sans', sans-serif",
  }
  const labelSty = {
    fontSize:11, fontWeight:800, color:"#DD6600",
    display:"block", marginBottom:4,
    fontFamily:"'Plus Jakarta Sans', sans-serif",
  }

  return (
    <div style={{ minHeight:"100vh", background:"#F2EDE3", padding:20, display:"flex", justifyContent:"center", position:"relative" }}>
      <FondoAnimado />
      <div style={{ background:"white", borderRadius:24, padding:36, maxWidth:460, width:"100%", boxShadow:"0 8px 32px rgba(0,0,0,0.1)", height:"fit-content", marginTop:20, position:"relative", zIndex:1 }}>
        <h1 style={{ fontWeight:900, fontSize:22, color:"#003F5A", marginBottom:4 }}>Mi cuenta</h1>
        <p  style={{ fontSize:13, color:"#6b5b3e", marginBottom:24 }}>Administra tu información personal</p>

        {mensaje.texto && (
          <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:16, fontSize:13, fontWeight:700, background: mensaje.tipo==="error"?"#fff0f0":"#e6f7f7", color: mensaje.tipo==="error"?"#c62828":"#007A7B" }}>
            {mensaje.texto}
          </div>
        )}

        {/* Foto */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
          <div style={{ position:"relative", marginBottom:8 }}>
            {fotoPreview ? (
              <img src={fotoPreview} alt="" style={{ width:90, height:90, borderRadius:"50%", objectFit:"cover", border:"3px solid #DD6600" }} />
            ) : (
              <div style={{ width:90, height:90, borderRadius:"50%", background:"#036668", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, color:"white", fontWeight:900 }}>
                {(nombre || usuario.email || "U")[0].toUpperCase()}
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} style={{ position:"absolute", bottom:0, right:0, width:28, height:28, borderRadius:"50%", background:"#DD6600", color:"white", border:"2px solid white", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>✏️</button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFotoChange} />
          <span style={{ fontSize:11, color:"#888" }}>Clic en ✏️ para cambiar foto</span>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom:16 }}>
          <label style={labelSty}>NOMBRE COMPLETO</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputSty} placeholder="Tu nombre completo" />
        </div>

        {/* DNI y Celular */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
          <div>
            <label style={labelSty}>DNI / DOCUMENTO</label>
            <input value={dni} onChange={(e) => setDni(e.target.value)} style={inputSty} placeholder="12345678" maxLength={15} />
          </div>
          <div>
            <label style={labelSty}>CELULAR</label>
            <input value={celular} onChange={(e) => setCelular(e.target.value)} style={inputSty} placeholder="987 654 321" maxLength={15} />
          </div>
        </div>

        {/* Fecha de nacimiento y Género */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
          <div>
            <label style={labelSty}>FECHA DE NACIMIENTO</label>
            <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} style={inputSty} />
          </div>
          <div>
            <label style={labelSty}>GÉNERO</label>
            <select value={genero} onChange={(e) => setGenero(e.target.value)} style={inputSty}>
              <option value="">Sin especificar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        {/* Dirección */}
        <div style={{ marginBottom:20 }}>
          <label style={labelSty}>DIRECCIÓN</label>
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} style={inputSty} placeholder="Ej: Jr. Lima 123, Puno" />
        </div>

        {/* Email */}
        <div style={{ marginBottom:20 }}>
          <label style={labelSty}>EMAIL</label>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, padding:"10px 14px", borderRadius:10, background:"#f5f0e8", fontSize:13, color:"#888" }}>{usuario.email}</div>
            {!esGoogleUser && (
              <button onClick={() => setModalEmail(true)} style={{ padding:"10px 14px", borderRadius:10, background:"#007A7B", color:"white", border:"none", fontWeight:800, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
                Cambiar
              </button>
            )}
          </div>
        </div>

        {/* Contraseña */}
        {!esGoogleUser && (
          <div style={{ marginBottom:20 }}>
            <label style={labelSty}>CONTRASEÑA</label>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ flex:1, padding:"10px 14px", borderRadius:10, background:"#f5f0e8", fontSize:13, color:"#888" }}>••••••••</div>
              <button onClick={() => setModalPassword(true)} style={{ padding:"10px 14px", borderRadius:10, background:"#007A7B", color:"white", border:"none", fontWeight:800, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
                Cambiar
              </button>
            </div>
          </div>
        )}

        {esGoogleUser && (
          <div style={{ padding:14, borderRadius:12, background:"#f5f0e8", marginBottom:20 }}>
            <p style={{ fontSize:12, color:"#6b5b3e", margin:0 }}>🔒 Cuenta Google — el email y contraseña se administran desde Google.</p>
          </div>
        )}

        <button onClick={guardarCambios} disabled={guardando} style={{ width:"100%", padding:12, borderRadius:12, background:"#DD6600", color:"white", border:"none", fontWeight:900, fontSize:14, cursor:"pointer", opacity: guardando?0.6:1 }}>
          {guardando ? "Guardando..." : "Actualizar cambios"}
        </button>
        <button onClick={() => navigate(-1)} style={{ width:"100%", padding:10, borderRadius:12, background:"#f5f0e8", color:"#DD6600", border:"none", fontWeight:900, fontSize:13, cursor:"pointer", marginTop:10 }}>
          ← Volver
        </button>

        {/* Zona peligrosa */}
        <div style={{ marginTop:32, borderTop:"1.5px solid #f5c6a0", paddingTop:20 }}>
          <p style={{ fontSize:11, fontWeight:800, color:"#c62828", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Zona peligrosa</p>
          <button onClick={() => { setConfirmTexto(""); setModalEliminar(true) }}
            style={{ width:"100%", padding:10, borderRadius:12, background:"#fff0f0", color:"#c62828", border:"1.5px solid #f5c6a0", fontWeight:900, fontSize:13, cursor:"pointer" }}>
            🗑️ Eliminar mi cuenta
          </button>
        </div>
      </div>

      {/* Modal cambiar email */}
      {modalEmail && (
        <div className="modal-overlay" onClick={(e) => e.target.className==="modal-overlay" && setModalEmail(false)}>
          <div className="modal-box">
            <h3 style={{ fontWeight:900, fontSize:17, color:"#003F5A", marginBottom:16 }}>Cambiar email</h3>
            <div style={{ marginBottom:12 }}>
              <label style={labelSty}>NUEVO EMAIL</label>
              <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} style={inputSty} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={labelSty}>CONTRASEÑA ACTUAL</label>
              <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} style={inputSty} placeholder="Para confirmar el cambio" />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={cambiarEmail} disabled={guardando} style={{ flex:1, padding:11, borderRadius:12, background:"#007A7B", color:"white", border:"none", fontWeight:900, cursor:"pointer" }}>
                {guardando ? "Guardando..." : "Confirmar"}
              </button>
              <button onClick={() => { setModalEmail(false); setPasswordActual("") }} style={{ flex:1, padding:11, borderRadius:12, background:"#f5f0e8", color:"#DD6600", border:"none", fontWeight:900, cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar cuenta */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={(e) => e.target.className==="modal-overlay" && setModalEliminar(false)}>
          <div className="modal-box">
            <h3 style={{ fontWeight:900, fontSize:17, color:"#c62828", marginBottom:8 }}>⚠️ Eliminar cuenta</h3>
            <p style={{ fontSize:13, color:"#444", marginBottom:16, lineHeight:1.5 }}>
              Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán tu perfil, campañas, veterinarias y todos tus datos.
            </p>
            <div style={{ marginBottom:16 }}>
              <label style={{ ...labelSty, color:"#c62828" }}>ESCRIBE "eliminar" PARA CONFIRMAR</label>
              <input value={confirmTexto} onChange={(e) => setConfirmTexto(e.target.value)}
                style={{ ...inputSty, border:"1.5px solid #c62828" }} placeholder='eliminar' />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={eliminarCuenta} disabled={guardando}
                style={{ flex:1, padding:11, borderRadius:12, background:"#c62828", color:"white", border:"none", fontWeight:900, cursor:"pointer", opacity:guardando?0.6:1 }}>
                {guardando ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button onClick={() => setModalEliminar(false)}
                style={{ flex:1, padding:11, borderRadius:12, background:"#f5f0e8", color:"#DD6600", border:"none", fontWeight:900, cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {modalPassword && (
        <div className="modal-overlay" onClick={(e) => e.target.className==="modal-overlay" && setModalPassword(false)}>
          <div className="modal-box">
            <h3 style={{ fontWeight:900, fontSize:17, color:"#003F5A", marginBottom:16 }}>Cambiar contraseña</h3>
            <div style={{ marginBottom:12 }}>
              <label style={labelSty}>CONTRASEÑA ACTUAL</label>
              <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} style={inputSty} placeholder="Tu contraseña actual" />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={labelSty}>NUEVA CONTRASEÑA</label>
              <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} style={inputSty} placeholder="Mínimo 6 caracteres" />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={labelSty}>CONFIRMAR NUEVA CONTRASEÑA</label>
              <input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} style={inputSty} placeholder="Repite la nueva contraseña" />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={cambiarPassword} disabled={guardando} style={{ flex:1, padding:11, borderRadius:12, background:"#007A7B", color:"white", border:"none", fontWeight:900, cursor:"pointer" }}>
                {guardando ? "Guardando..." : "Confirmar"}
              </button>
              <button onClick={() => { setModalPassword(false); setPasswordActual(""); setNuevaPassword(""); setConfirmarPassword("") }} style={{ flex:1, padding:11, borderRadius:12, background:"#f5f0e8", color:"#DD6600", border:"none", fontWeight:900, cursor:"pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── APP ROOT ──────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"             element={<Home />}        />
        <Route path="/mapa"         element={<Mapa />}        />
        <Route path="/campanas"     element={<Campanas />}    />
        <Route path="/login"        element={<Login />}       />
        <Route path="/adopciones"   element={<Adopciones />}  />
        <Route path="/veterinarias" element={<Veterinarias />}/>
        <Route path="/Reportes"     element={<Reportes />}    />
        <Route path="/mi-cuenta"    element={<MiCuenta />}    />
      </Routes>
    </BrowserRouter>
  )
}