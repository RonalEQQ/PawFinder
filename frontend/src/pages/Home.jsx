import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";

import img1 from "../assets/img1.jpg";
import img2 from "../assets/img2.jpg";
import img3 from "../assets/img3.jpg";
import img4 from "../assets/img4.jpg";
import img5 from "../assets/img5.jpg";
import loadingImg from "../assets/loading.jpg";
import logoImg    from "../assets/logo.jpg";
import huellaImg  from "../assets/huella.png";
import lupaImg    from "../assets/lupa.png";
import perritoImg from "../assets/perrito.png";

const API = import.meta.env.VITE_API_URL

// ── PALETA ──────────────────────────────────────────────────────
const colors = {
  azulOscuro:       "#384d51",
  azulMedio:        "#0b2643",
  celesteVerdoso:   "#4A9DA4",
  naranjaPrincipal: "#eda51f",
  naranjaClaro:     "#d2991f",
  mostaza:          "#d4a017",
  mostazaOscuro:    "#b8860b",
  beige:            "#F5E6D3",
  blanco:           "#FFFFFF",
  grisClaro:        "#E8ECEF",
  azulTexto:        "#2C5F8A",
  footerBg:         "#0c5962"
};

// ── ELEMENTOS FLOTANTES — dispersos, irregulares, muchos ─────────────
const FLOATERS = [
  // ─ HUELLAS grandes (62-82px) ─ posiciones muy variadas ─
  { t:"H", l:2,  top:5,  s:74, o:0.26, d:0,   dr:7,  r:12,  a:"U" },
  { t:"H", l:91, top:3,  s:68, o:0.25, d:3.2, dr:8,  r:-17, a:"D" },
  { t:"H", l:7,  top:38, s:80, o:0.25, d:1.5, dr:7,  r:22,  a:"S" },
  { t:"H", l:86, top:31, s:72, o:0.24, d:5.8, dr:9,  r:-9,  a:"G" },
  { t:"H", l:3,  top:67, s:76, o:0.25, d:2.3, dr:7,  r:16,  a:"U" },
  { t:"H", l:89, top:61, s:68, o:0.24, d:6.5, dr:8,  r:-24, a:"D" },
  { t:"H", l:5,  top:89, s:74, o:0.25, d:0.7, dr:8,  r:7,   a:"S" },
  { t:"H", l:84, top:88, s:70, o:0.24, d:4.1, dr:7,  r:-13, a:"G" },
  { t:"H", l:46, top:1,  s:66, o:0.23, d:8.5, dr:9,  r:35,  a:"U" },
  { t:"H", l:14, top:52, s:78, o:0.24, d:2.8, dr:7,  r:28,  a:"D" },
  { t:"H", l:77, top:55, s:70, o:0.23, d:7.2, dr:8,  r:-19, a:"S" },
  { t:"H", l:54, top:94, s:72, o:0.23, d:5,   dr:9,  r:-38, a:"G" },
  // ─ HUELLAS medianas (44-58px) ─ zona central dispersa ─
  { t:"H", l:21, top:9,  s:52, o:0.21, d:2.5, dr:8,  r:30,  a:"D" },
  { t:"H", l:67, top:12, s:50, o:0.20, d:7.3, dr:7,  r:-19, a:"U" },
  { t:"H", l:34, top:27, s:56, o:0.21, d:4.2, dr:9,  r:14,  a:"G" },
  { t:"H", l:74, top:24, s:48, o:0.20, d:1.1, dr:8,  r:-33, a:"S" },
  { t:"H", l:18, top:44, s:54, o:0.21, d:9.1, dr:7,  r:8,   a:"U" },
  { t:"H", l:61, top:49, s:50, o:0.20, d:3.7, dr:8,  r:-11, a:"D" },
  { t:"H", l:38, top:63, s:56, o:0.21, d:6.9, dr:9,  r:26,  a:"G" },
  { t:"H", l:80, top:74, s:48, o:0.19, d:0.3, dr:7,  r:-28, a:"S" },
  { t:"H", l:25, top:81, s:54, o:0.21, d:5.5, dr:8,  r:40,  a:"U" },
  { t:"H", l:58, top:77, s:50, o:0.19, d:8.8, dr:9,  r:-5,  a:"D" },
  // ─ HUELLAS pequeñas (30-42px) ─ relleno interior ─
  { t:"H", l:42, top:16, s:36, o:0.18, d:5.8, dr:8,  r:19,  a:"S" },
  { t:"H", l:29, top:35, s:38, o:0.17, d:9.5, dr:7,  r:-7,  a:"U" },
  { t:"H", l:55, top:41, s:34, o:0.18, d:2.1, dr:9,  r:22,  a:"D" },
  { t:"H", l:70, top:37, s:40, o:0.17, d:7.6, dr:8,  r:-41, a:"G" },
  { t:"H", l:11, top:73, s:36, o:0.18, d:4.4, dr:7,  r:33,  a:"S" },
  { t:"H", l:48, top:83, s:38, o:0.17, d:1.9, dr:8,  r:-16, a:"U" },
  { t:"H", l:93, top:16, s:34, o:0.18, d:6.2, dr:9,  r:8,   a:"D" },
  { t:"H", l:35, top:96, s:40, o:0.17, d:3.3, dr:7,  r:-29, a:"G" },
  // ─ LUPAS grandes (62-78px) ─ dispersas ─
  { t:"L", l:16, top:17, s:74, o:0.25, d:1.2, dr:8,  r:-11, a:"D" },
  { t:"L", l:75, top:19, s:68, o:0.24, d:5.3, dr:7,  r:13,  a:"S" },
  { t:"L", l:9,  top:51, s:76, o:0.25, d:3.1, dr:9,  r:-22, a:"U" },
  { t:"L", l:79, top:53, s:70, o:0.24, d:7.8, dr:8,  r:9,   a:"G" },
  { t:"L", l:12, top:83, s:74, o:0.25, d:0.4, dr:7,  r:-15, a:"D" },
  { t:"L", l:76, top:91, s:68, o:0.23, d:5.6, dr:9,  r:21,  a:"S" },
  { t:"L", l:43, top:7,  s:72, o:0.24, d:9.3, dr:8,  r:-30, a:"U" },
  { t:"L", l:57, top:71, s:70, o:0.23, d:2.7, dr:7,  r:37,  a:"G" },
  { t:"L", l:30, top:58, s:68, o:0.24, d:6.4, dr:9,  r:-8,  a:"D" },
  { t:"L", l:63, top:28, s:74, o:0.23, d:4.8, dr:8,  r:17,  a:"S" },
  // ─ LUPAS medianas (44-58px) ─ zona interior variada ─
  { t:"L", l:33, top:21, s:54, o:0.21, d:3.5, dr:8,  r:-6,  a:"U" },
  { t:"L", l:62, top:18, s:50, o:0.20, d:8.2, dr:7,  r:25,  a:"D" },
  { t:"L", l:27, top:46, s:56, o:0.21, d:1.8, dr:9,  r:-17, a:"G" },
  { t:"L", l:71, top:43, s:52, o:0.20, d:6.7, dr:8,  r:11,  a:"S" },
  { t:"L", l:39, top:69, s:54, o:0.21, d:4.6, dr:7,  r:-25, a:"U" },
  { t:"L", l:68, top:86, s:50, o:0.19, d:0.9, dr:9,  r:31,  a:"D" },
  { t:"L", l:22, top:93, s:52, o:0.21, d:7.4, dr:8,  r:-20, a:"G" },
  { t:"L", l:85, top:42, s:48, o:0.19, d:3.9, dr:7,  r:42,  a:"S" },
  // ─ LUPAS pequeñas (30-42px) ─ relleno disperso ─
  { t:"L", l:50, top:14, s:36, o:0.18, d:6.8, dr:8,  r:28,  a:"D" },
  { t:"L", l:44, top:48, s:38, o:0.17, d:0.6, dr:7,  r:-4,  a:"S" },
  { t:"L", l:52, top:79, s:40, o:0.18, d:9.7, dr:9,  r:15,  a:"U" },
  { t:"L", l:96, top:37, s:36, o:0.17, d:3.8, dr:8,  r:-32, a:"G" },
  { t:"L", l:1,  top:22, s:38, o:0.18, d:7.1, dr:7,  r:44,  a:"D" },
  { t:"L", l:19, top:97, s:34, o:0.17, d:2.4, dr:9,  r:-10, a:"S" },
];



// ── CSS ─────────────────────────────────────────────────────────
const EXTRA_CSS = `
  /* ── Animaciones flotantes — MÁXIMO movimiento, claramente visibles ── */
  @keyframes floatUD {
    0%   { transform:translateY(0px) rotate(var(--r,0deg)) scale(1); }
    25%  { transform:translateY(-32px) rotate(calc(var(--r,0deg)+8deg)) scale(1.05); }
    50%  { transform:translateY(-18px) rotate(calc(var(--r,0deg)-5deg)) scale(1.02); }
    75%  { transform:translateY(-26px) rotate(calc(var(--r,0deg)+4deg)) scale(1.04); }
    100% { transform:translateY(0px) rotate(var(--r,0deg)) scale(1); }
  }
  @keyframes floatDiag {
    0%   { transform:translate(0,0) rotate(var(--r,0deg)); }
    20%  { transform:translate(22px,-36px) rotate(calc(var(--r,0deg)+10deg)); }
    40%  { transform:translate(-8px,-22px) rotate(calc(var(--r,0deg)-7deg)); }
    60%  { transform:translate(16px,-40px) rotate(calc(var(--r,0deg)+5deg)); }
    80%  { transform:translate(-12px,-18px) rotate(calc(var(--r,0deg)-4deg)); }
    100% { transform:translate(0,0) rotate(var(--r,0deg)); }
  }
  @keyframes floatSway {
    0%   { transform:translateX(0) translateY(0) rotate(var(--r,0deg)); }
    20%  { transform:translateX(26px) translateY(-22px) rotate(calc(var(--r,0deg)+7deg)); }
    40%  { transform:translateX(8px) translateY(-38px) rotate(calc(var(--r,0deg)-6deg)); }
    60%  { transform:translateX(-20px) translateY(-28px) rotate(calc(var(--r,0deg)+4deg)); }
    80%  { transform:translateX(-10px) translateY(-10px) rotate(calc(var(--r,0deg)-3deg)); }
    100% { transform:translateX(0) translateY(0) rotate(var(--r,0deg)); }
  }
  @keyframes floatGlow {
    0%   { transform:translateY(0) scale(1) rotate(var(--r,0deg));
           opacity:var(--o,0.25); filter:invert(1) brightness(2.5); }
    30%  { transform:translateY(-28px) scale(1.2) rotate(calc(var(--r,0deg)+9deg));
           opacity:calc(var(--o,0.25)*2.8);
           filter:invert(1) brightness(5) drop-shadow(0 0 14px rgba(237,165,31,1)); }
    50%  { transform:translateY(-24px) scale(1.18) rotate(calc(var(--r,0deg)+6deg));
           opacity:calc(var(--o,0.25)*2.5);
           filter:invert(1) brightness(4.5) drop-shadow(0 0 10px rgba(237,165,31,.85)); }
    70%  { transform:translateY(-32px) scale(1.22) rotate(calc(var(--r,0deg)+11deg));
           opacity:calc(var(--o,0.25)*3);
           filter:invert(1) brightness(5.5) drop-shadow(0 0 16px rgba(237,165,31,1)); }
    100% { transform:translateY(0) scale(1) rotate(var(--r,0deg));
           opacity:var(--o,0.25); filter:invert(1) brightness(2.5); }
  }

  /* ── Entradas ── */
  @keyframes fadeInLeft  { from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)} }
  @keyframes fadeInRight { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fadeInUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }

  /* ── Generales ── */
  @keyframes pulse-slow  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.8;transform:scale(1.03)} }
  @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:.7} }
  @keyframes bounce      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes titleGlow   { 0%,100%{text-shadow:2px 2px 4px rgba(0,0,0,.2)} 50%{text-shadow:2px 2px 20px rgba(0,0,0,.45)} }
  @keyframes lineRun     { 0%{opacity:0;transform:scaleX(0);transform-origin:left} 50%{opacity:1;transform:scaleX(1)} 100%{opacity:0;transform:scaleX(0);transform-origin:right} }
  @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes modalIn     { from{opacity:0;transform:scale(.88) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes float-pet   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes shimmer     { 0%{background-position:-200% center} 100%{background-position:200% center} }

  /* ── Indicador de scroll ── */
  @keyframes scrollDot {
    0%         { transform:translateY(0);  opacity:1; }
    70%        { transform:translateY(14px); opacity:0; }
    100%       { transform:translateY(0);  opacity:0; }
  }
  @keyframes arrowPush {
    0%,100% { transform:translateY(0); opacity:.9; }
    40%     { transform:translateY(8px); opacity:1; }
    70%     { transform:translateY(4px); opacity:.8; }
  }
  @keyframes scrollRingPulse {
    0%   { transform:scale(1);   opacity:.6; }
    70%  { transform:scale(1.5); opacity:0; }
    100% { transform:scale(1.5); opacity:0; }
  }
  @keyframes scrollTextPulse {
    0%,100% { opacity:.7; letter-spacing:.2em; }
    50%     { opacity:1;  letter-spacing:.28em; }
  }

  /* ── Hover tarjetas ── */
  .stat-card-hover  { transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s; }
  .stat-card-hover:hover  { transform:translateY(-10px); box-shadow:0 24px 48px rgba(0,0,0,.22)!important; }
  .story-card-hover { transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s; }
  .story-card-hover:hover { transform:translateY(-10px); box-shadow:0 24px 48px rgba(0,0,0,.24)!important; }
  .info-card-hover  { transition:transform .3s ease,box-shadow .3s; }
  .info-card-hover:hover  { transform:translateY(-5px); box-shadow:0 14px 36px rgba(0,0,0,.18)!important; }
  .benefit-card-hover { transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s; }
  .benefit-card-hover:hover { transform:translateY(-8px) rotate(.6deg); box-shadow:0 16px 32px rgba(0,0,0,.18)!important; }
  .metric-card { transition:transform .3s cubic-bezier(.34,1.56,.64,1); }
  .metric-card:hover { transform:translateY(-8px) scale(1.12); }
  .comment-card { transition:transform .25s ease,box-shadow .25s; }
  .comment-card:hover { transform:translateX(5px); box-shadow:0 8px 24px rgba(0,0,0,.12)!important; }

  /* ── Botones ── */
  .btn-orange {
    transition:transform .28s cubic-bezier(.34,1.56,.64,1),
               box-shadow .28s ease,
               filter .28s ease;
    will-change:transform;
  }
  .btn-orange:hover {
    transform:translateY(-6px) scale(1.07);
    box-shadow:0 18px 42px rgba(237,165,31,.65),
               0 4px 12px rgba(237,165,31,.35)!important;
    filter:brightness(1.08);
  }
  .btn-orange:active { transform:translateY(-2px) scale(1.02); }

  .btn-outline {
    transition:transform .28s cubic-bezier(.34,1.56,.64,1),
               box-shadow .28s ease,
               background .28s ease,
               color .28s ease;
    will-change:transform;
  }
  .btn-outline:hover {
    transform:translateY(-6px) scale(1.07);
    box-shadow:0 18px 42px rgba(237,165,31,.45),
               0 4px 12px rgba(237,165,31,.25)!important;
    background:rgba(237,165,31,.12)!important;
    border-color:#eda51f!important;
  }
  .btn-outline:active { transform:translateY(-2px) scale(1.02); }

  /* ── Scrollbar ── */
  .custom-scrollbar::-webkit-scrollbar { width:5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background:rgba(255,255,255,.1); border-radius:10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background:#eda51f; border-radius:10px; }

  /* ── Indicador scroll — flotante y prominente ── */
  @keyframes scrollFloat {
    0%,100% { transform:translateY(0px); filter:drop-shadow(0 0 0px rgba(237,165,31,0)); }
    50%     { transform:translateY(-18px); filter:drop-shadow(0 2px 12px rgba(237,165,31,.5)); }
  }
  .scroll-indicator-wrap {
    animation:fadeInUp 1s ease 1.2s both, scrollFloat 2s ease-in-out 2.2s infinite;
    cursor:pointer;
    user-select:none;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:10px;
  }
  .scroll-label {
    font-size:15px;
    font-weight:900;
    letter-spacing:.3em;
    text-transform:uppercase;
    color:rgba(255,255,255,1);
    text-shadow:0 0 18px rgba(237,165,31,.9), 0 0 36px rgba(237,165,31,.4);
    animation:scrollTextPulse 2s ease-in-out infinite;
  }
  .scroll-mouse-wrap { position:relative; display:flex; align-items:center; justify-content:center; }
  .scroll-mouse-ring {
    position:absolute;
    width:80px; height:80px; border-radius:50%;
    border:3px solid rgba(237,165,31,.75);
    box-shadow:0 0 12px rgba(237,165,31,.3);
    animation:scrollRingPulse 1.8s ease-out infinite;
  }
  .scroll-mouse {
    width:44px; height:72px; border-radius:22px;
    border:3.5px solid rgba(255,255,255,.85);
    box-shadow:0 0 24px rgba(237,165,31,.5), 0 0 8px rgba(255,255,255,.2);
    display:flex; align-items:flex-start; justify-content:center;
    padding:9px; position:relative; z-index:1;
  }
  .scroll-dot {
    width:7px; height:16px; border-radius:99px;
    background:#eda51f;
    box-shadow:0 0 12px rgba(237,165,31,1), 0 0 4px rgba(237,165,31,.6);
    animation:scrollDot 1.5s ease-in-out infinite;
  }
  .scroll-arrows {
    display:flex; flex-direction:column; align-items:center; gap:2px;
    animation:arrowPush 1.4s ease-in-out infinite;
  }
  .scroll-arrow-line {
    width:16px; height:2px; border-radius:99px;
    background:rgba(237,165,31,.8);
    clip-path:polygon(0 0, 50% 100%, 100% 0);
    height:8px;
  }
  .scroll-chevron {
    font-size:32px; color:#eda51f; line-height:1;
    text-shadow:0 0 20px rgba(237,165,31,1), 0 2px 8px rgba(237,165,31,.6);
    animation:arrowPush 1.2s ease-in-out infinite;
  }

  /* ── btn comentario ── */
  .comment-action-btn {
    background:none; border:none; cursor:pointer;
    font-size:11px; font-weight:700;
    padding:3px 8px; border-radius:6px;
    transition:all .18s;
  }
  .comment-action-btn:hover { filter:brightness(1.15); transform:scale(1.07); }

  /* ── RESPONSIVE MÓVIL ── */
  @media (max-width: 768px) {
    .pf-home-wrap { padding-bottom: 72px; }
    .home-stories-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
    .home-stats-grid   { grid-template-columns: 1fr !important; gap: 12px !important; }
  }
  @media (min-width: 769px) {
    .home-stories-grid { grid-template-columns: repeat(3, 1fr); }
    .home-stats-grid   { grid-template-columns: repeat(3, 1fr); }
  }
`;

export default function Home() {
  const navigate = useNavigate();

  // ── State ────────────────────────────────────────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newComment,   setNewComment]   = useState("");
  const [newRating,    setNewRating]    = useState(5);
  const [displayStats, setDisplayStats] = useState({ found:0, reports:0, accuracy:0 });
  const [isLoading,    setIsLoading]    = useState(true);
  const [showScrollTop,setShowScrollTop]= useState(false);
  const [typedText,    setTypedText]    = useState("");
  const [typedIndex,   setTypedIndex]   = useState(0);
  const [usuarioActual,setUsuarioActual]= useState(null);
  const [showModal,       setShowModal]       = useState(false);
  const [editingId,       setEditingId]       = useState(null);
  const [editText,        setEditText]        = useState("");
  const [editRating,      setEditRating]      = useState(5);
  const [enviando,        setEnviando]        = useState(false);
  const [mensajeComent,   setMensajeComent]   = useState({ texto:"", tipo:"" });

  const carouselIntervalRef = useRef(null);
  const statsRef            = useRef(null);
  const statsAnimated       = useRef(false);

  const fullText = "CADA MASCOTA MERECE VOLVER A CASA";

  const [comments, setComments] = useState([]);
  const [promedioEstrellas, setPromedioEstrellas] = useState(null);

  const carouselImages = [img1, img2, img3, img4, img5];
  const carouselMessages = [
    "CADA MASCOTA MERECE VOLVER A CASA",
    "JUNTOS PODEMOS HACER LA DIFERENCIA",
    "REPORTA, COMPARTE, ENCUENTRA",
    "LA COMUNIDAD ES NUESTRA FUERZA",
    "PUNO UNIDO POR SUS MASCOTAS"
  ];

  const petStories = [
    { id:1, name:"Luna",  type:"Golden Retriever",    image:"https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&h=600&fit=crop", story:"Luna se perdió cerca del mercado central. Gracias a 3 reportes de vecinos, fue encontrada en solo 24 horas.", location:"Puno - Centro",     daysFound:1 },
    { id:2, name:"Max",   type:"Jack Russell Terrier",image:"https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=500&h=600&fit=crop", story:"Max escapó por una puerta abierta en la zona norte. Un usuario reportó su avistamiento y su dueño lo recuperó esa misma noche.", location:"Puno - Zona Norte", daysFound:0 },
    { id:3, name:"Rocky", type:"Pastor Alemán",       image:"https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=500&h=600&fit=crop", story:"Rocky se perdió durante un paseo cerca del estadio. La comunidad se movilizó rápidamente y en solo 4 horas estaba de vuelta.", location:"Puno - Estadio",    daysFound:0 },
  ];

  // ── Auth ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUsuarioActual(u));
    return () => unsub();
  }, []);

  // ── Cargar valoraciones desde la BD ──────────────────────────────
  const cargarValoraciones = async () => {
    try {
      const res = await fetch(`${API}/api/valoraciones`)
      if (!res.ok) return
      const data = await res.json()
      if (!Array.isArray(data)) return
      setComments(data.map(v => ({
        id:     v.id,
        uid:    v.firebase_uid,
        name:   v.nombre || "Usuario",
        rating: v.estrellas,
        text:   v.comentario,
        date:   new Date(v.created_at).toLocaleDateString("es-PE"),
        avatar: (v.nombre || "U")[0].toUpperCase(),
        foto:   v.foto_url || null,
      })))
      if (data.length > 0) {
        const prom = data.reduce((s, v) => s + v.estrellas, 0) / data.length
        setPromedioEstrellas(prom.toFixed(1))
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => { cargarValoraciones() }, []);

  // ── Typing ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typedIndex < fullText.length) {
      const t = setTimeout(() => {
        setTypedText(p => p + fullText[typedIndex]);
        setTypedIndex(p => p + 1);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [typedIndex]);

  // ── Stats con IntersectionObserver ───────────────────────────────
  // easeOut cúbico: acelera al inicio, desacelera al final
  const animateNumber = useCallback((target, setter, dur = 2400) => {
    let t0 = null;
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      if (!t0) t0 = now;
      const raw = Math.min((now - t0) / dur, 1);
      const p   = easeOut(raw);
      setter(Math.floor(p * target));
      if (raw < 1) requestAnimationFrame(step); else setter(target);
    };
    requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true;
        animateNumber(247,  v => setDisplayStats(p => ({...p, found:v})));    // "24/7" → anima 0→247 pero mostramos "24/7" fijo
        animateNumber(100,  v => setDisplayStats(p => ({...p, reports:v})));   // 100%
        animateNumber(95,   v => setDisplayStats(p => ({...p, accuracy:v}))); // 95%
      }
    }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, [animateNumber]);

  // ── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    carouselIntervalRef.current = setInterval(() => {
      setCurrentImageIndex(p => (p+1) % carouselImages.length);
      setTypedText(""); setTypedIndex(0);
    }, 6000);
    const onScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => { clearTimeout(timer); clearInterval(carouselIntervalRef.current); window.removeEventListener("scroll", onScroll); };
  }, []);

  const jumpCarousel = (idx) => {
    setCurrentImageIndex(idx); setTypedText(""); setTypedIndex(0);
    clearInterval(carouselIntervalRef.current);
    carouselIntervalRef.current = setInterval(() => {
      setCurrentImageIndex(p => (p+1) % carouselImages.length);
      setTypedText(""); setTypedIndex(0);
    }, 6000);
  };

  const scrollToTop   = () => window.scrollTo({ top:0, behavior:"smooth" });
  const scrollToStats = () => document.getElementById("stats-section")?.scrollIntoView({ behavior:"smooth" });

  // ── Comentarios ──────────────────────────────────────────────────
  const mostrarMsgComent = (texto, tipo = "ok") => {
    setMensajeComent({ texto, tipo })
    setTimeout(() => setMensajeComent({ texto:"", tipo:"" }), 4000)
  }

  const addComment = async () => {
    if (!usuarioActual) {
      sessionStorage.setItem("pawfinder_redirect", "#testimonials");
      setShowModal(true);
      return;
    }
    if (!newComment.trim()) { mostrarMsgComent("Escribe un comentario antes de enviar.", "error"); return; }
    setEnviando(true)
    try {
      const res = await fetch(`${API}/api/valoraciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: usuarioActual.uid,
          nombre:   usuarioActual.displayName || usuarioActual.email?.split("@")[0] || "Usuario",
          foto_url: usuarioActual.photoURL || null,
          estrellas: newRating,
          comentario: newComment.trim(),
        })
      })
      if (res.ok) {
        setNewComment(""); setNewRating(5);
        await cargarValoraciones()
        mostrarMsgComent("✅ ¡Gracias por tu opinión!")
      } else {
        mostrarMsgComent("❌ Error al guardar. Intenta de nuevo.", "error")
      }
    } catch { mostrarMsgComent("❌ Sin conexión con el servidor.", "error") }
    finally { setEnviando(false) }
  };

  const deleteComment = async (uid) => {
    try {
      await fetch(`${API}/api/valoraciones/${uid}`, { method: "DELETE" })
      await cargarValoraciones()
      mostrarMsgComent("🗑️ Valoración eliminada.")
    } catch { mostrarMsgComent("❌ Error al eliminar.", "error") }
  };

  const startEdit = (c) => { setEditingId(c.id); setEditText(c.text); setEditRating(c.rating); };
  const saveEdit  = async () => {
    if (!editText.trim()) return;
    const comment = comments.find(c => c.id === editingId)
    if (!comment || !usuarioActual) return
    setEnviando(true)
    try {
      const res = await fetch(`${API}/api/valoraciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: usuarioActual.uid,
          nombre:   usuarioActual.displayName || usuarioActual.email?.split("@")[0] || "Usuario",
          foto_url: usuarioActual.photoURL || null,
          estrellas: editRating,
          comentario: editText.trim(),
        })
      })
      if (res.ok) {
        setEditingId(null); setEditText("");
        await cargarValoraciones()
        mostrarMsgComent("✅ Opinión actualizada.")
      } else {
        mostrarMsgComent("❌ Error al actualizar.", "error")
      }
    } catch { mostrarMsgComent("❌ Sin conexión.", "error") }
    finally { setEnviando(false) }
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
        style={{ background:`linear-gradient(135deg,${colors.azulOscuro} 0%,${colors.azulMedio} 60%,${colors.celesteVerdoso} 100%)` }}>
        <style>{EXTRA_CSS}</style>

        {/* Logo centrado con sombra */}
        <div style={{ position:"relative", width:140, height:140, marginBottom:28 }}>
          <img
            src={logoImg}
            alt="PawFinder"
            style={{
              width:140, height:140,
              borderRadius:"50%",
              objectFit:"cover",
              border:`4px solid ${colors.naranjaPrincipal}`,
              boxShadow:"0 8px 32px rgba(0,0,0,0.35)",
              animation:"pulse-slow 2s ease-in-out infinite",
              display:"block",
            }}
          />
          {/* Spinner alrededor del logo */}
          <div style={{
            position:"absolute",
            inset:-6,
            borderRadius:"50%",
            border:`4px solid transparent`,
            borderTopColor: colors.naranjaPrincipal,
            borderRightColor: colors.naranjaClaro,
            animation:"spin 1s linear infinite",
            pointerEvents:"none",
          }} />
        </div>

        {/* Texto */}
        <h1 style={{
          color:"white",
          fontSize:26,
          fontWeight:900,
          marginBottom:6,
          letterSpacing:"0.5px",
          fontFamily:"'Montserrat',sans-serif",
          animation:"pulse-slow 2s ease-in-out infinite",
        }}>
          PawFinder
        </h1>
        <p style={{
          color:"rgba(255,255,255,0.7)",
          fontSize:13,
          marginBottom:28,
          fontFamily:"'Montserrat',sans-serif",
        }}>
          Mascotas Puno
        </p>

        {/* Tres puntos animados */}
        <div style={{ display:"flex", gap:10 }}>
          {[0, 0.2, 0.4].map((d, i) => (
            <div key={i} style={{
              width:12, height:12, borderRadius:"50%",
              backgroundColor: [colors.naranjaPrincipal, colors.naranjaClaro, colors.celesteVerdoso][i],
              animation:`bounce 1.2s ease-in-out ${d}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-x-hidden pf-home-wrap"
      style={{ background:`linear-gradient(135deg,${colors.azulOscuro} 0%,${colors.azulMedio} 25%,${colors.celesteVerdoso} 50%,${colors.naranjaPrincipal} 75%,${colors.mostaza} 100%)`, fontFamily:"'Montserrat',sans-serif" }}>

      <style>{EXTRA_CSS}</style>

      {/* ── FONDO FLOTANTE ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex:0 }}>
        {FLOATERS.map((el,i) => {
          const animMap = { U:"floatUD", D:"floatDiag", S:"floatSway", G:"floatGlow" };
          const animName = animMap[el.a] || "floatUD";
          return (
            <img key={i} src={el.t==="H" ? huellaImg : lupaImg} alt=""
              style={{
                position:"absolute",
                left:`${el.l}%`, top:`${el.top}%`,
                width:el.s, height:el.s,
                opacity:el.o,
                "--o":String(el.o),
                filter:"invert(1) brightness(2.5)",
                animation:`${animName} ${el.dr}s ease-in-out ${el.d}s infinite`,
                animationTimingFunction:"cubic-bezier(0.45,0.05,0.55,0.95)",
                "--r":`${el.r}deg`,
                transform:`rotate(${el.r}deg)`,
                userSelect:"none",
                pointerEvents:"none",
              }}
            />
          );
        })}
      </div>

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
      <div id="home" className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="flex flex-col md:flex-row items-center gap-12">

          {/* ── Columna izquierda ── */}
          <div className="flex-1 text-center md:text-left" style={{ animation:"fadeInLeft .8s ease-out both" }}>
            <div className="relative inline-block mb-4">
              {["PAW","FINDER"].map((word,i)=>(
                <h1 key={word} className="font-black leading-tight"
                  style={{ fontFamily:"'DM Sans',sans-serif", color:colors.blanco, letterSpacing:"0.1em",
                    fontSize:"clamp(36px,8vw,96px)",
                    textShadow:`0 0 20px ${colors.naranjaPrincipal}80, 0 0 40px ${colors.mostaza}40`,
                    marginTop:i===1?4:0 }}>
                  {word}
                </h1>
              ))}
              <div className="absolute -bottom-3 left-1/4 h-0.5"
                style={{ width:"50%", backgroundColor:colors.naranjaPrincipal, animation:"lineRun 3s ease-in-out infinite" }}></div>
            </div>

            <p className="text-base md:text-lg mb-3 font-light tracking-wide"
              style={{ color:colors.naranjaClaro, animation:"pulse-slow 2s ease-in-out infinite" }}>
              Pet Lovers | Desde 2026
            </p>
            <p className="text-lg md:text-xl mb-3 leading-relaxed font-light" style={{ color:colors.blanco }}>
              Uniendo corazones y patitas
            </p>
            <p className="text-sm md:text-base max-w-md mx-auto md:mx-0 leading-relaxed mb-6" style={{ color:colors.blanco }}>
              Conectamos a dueños con sus mascotas perdidas mediante tecnología avanzada,
              reportes en tiempo real y una comunidad solidaria en Puno.
            </p>

            {/* Botones — diseño según imagen de referencia */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {/* Botón naranja — Reportar Mascota */}
              <button onClick={() => navigate("/Reportes")}
                className="group btn-orange flex items-center justify-center gap-3 font-black text-white relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg,${colors.naranjaPrincipal},${colors.mostaza})`,
                  borderRadius: 14,
                  padding: "16px 32px",
                  fontSize: "1.05rem",
                  boxShadow: `0 6px 24px rgba(237,165,31,.45)`,
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}>
                {/* Ícono pata SVG */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9"  cy="5"  r="2.2"/>
                  <circle cx="15" cy="5"  r="2.2"/>
                  <circle cx="5"  cy="11" r="2.2"/>
                  <circle cx="19" cy="11" r="2.2"/>
                  <path d="M12 22c-3.2 0-7.5-2.2-7.5-6.2 0-2.2 2-3.3 4.2-4.3 1-.5 2.1-1 3.3-1s2.3.5 3.3 1c2.2 1 4.2 2.1 4.2 4.3C19.5 19.8 15.2 22 12 22z"/>
                </svg>
                <span>Reportar Mascota</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-2">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
                <div className="absolute inset-0 bg-white/15 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12"/>
              </button>

              {/* Botón teal oscuro — Ver Mapa de Reportes */}
              <button onClick={() => navigate("/mapa")}
                className="group btn-outline flex items-center justify-center gap-3 font-black relative overflow-hidden"
                style={{
                  background: colors.azulOscuro,
                  border: `2px solid ${colors.naranjaPrincipal}50`,
                  borderRadius: 14,
                  padding: "16px 28px",
                  fontSize: "1.05rem",
                  color: colors.blanco,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                }}>
                {/* Ícono mapa SVG */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                  <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
                <span>Ver Mapa de Reportes</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-2">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500"/>
              </button>
            </div>

            {/* Métricas fijas */}
            <div className="mt-10 flex gap-8 justify-center md:justify-start flex-wrap">
              {[
                { v:"24/7",  l:"Soporte"               },
                { v:"100%",  l:"Gratuito"               },
                { v:"95%",   l:"Precisión de matching"  },
              ].map((m,i)=>(
                <div key={i} className="text-center cursor-default metric-card"
                  style={{ animationDelay:`${i*.1}s`, minWidth:72 }}>
                  <div className="text-2xl md:text-3xl font-black"
                    style={{ color:colors.naranjaPrincipal, fontFamily:"'DM Sans',sans-serif" }}>
                    {m.v}
                  </div>
                  <div className="text-xs text-white/70 mt-1 leading-tight">{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Carrusel ── */}
          <div className="flex-1" style={{ animation:"fadeInRight .8s ease-out .15s both" }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 transition-all duration-500 hover:scale-[1.02] hover:rotate-1 group"
              style={{ borderColor:colors.naranjaPrincipal }}>

              <div className="relative overflow-hidden" style={{ height:"clamp(280px,45vw,450px)" }}>
                <img src={carouselImages[currentImageIndex]} alt="Mascota"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Esquinas */}
                {[["top-4 left-4",{borderTop:`3px solid ${colors.naranjaPrincipal}`,borderLeft:`3px solid ${colors.naranjaPrincipal}`},0],
                  ["top-4 right-4",{borderTop:`3px solid ${colors.naranjaPrincipal}`,borderRight:`3px solid ${colors.naranjaPrincipal}`},.5],
                  ["bottom-4 left-4",{borderBottom:`3px solid ${colors.naranjaPrincipal}`,borderLeft:`3px solid ${colors.naranjaPrincipal}`},1],
                  ["bottom-4 right-4",{borderBottom:`3px solid ${colors.naranjaPrincipal}`,borderRight:`3px solid ${colors.naranjaPrincipal}`},1.5]
                ].map(([cls,sty,d],i)=>(
                  <div key={i} className={`absolute ${cls} w-12 h-12`}
                    style={{ ...sty, animation:`pulse-slow 2s ease-in-out ${d}s infinite` }} />
                ))}
              </div>

              {/* Typing text */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-white text-center font-bold text-xl md:text-2xl tracking-wider"
                  style={{ fontFamily:"'DM Sans',sans-serif", textShadow:"2px 2px 4px rgba(0,0,0,.5)" }}>
                  {currentImageIndex===0 ? typedText : carouselMessages[currentImageIndex]}
                  {currentImageIndex===0 && typedIndex<fullText.length && (
                    <span className="inline-block w-0.5 h-6 bg-white ml-1" style={{ animation:"blink .8s step-end infinite" }}></span>
                  )}
                </div>
                <div className="w-20 h-1 mx-auto mt-3 rounded-full"
                  style={{ backgroundColor:colors.naranjaPrincipal, animation:"pulse 2s ease-in-out infinite" }}></div>
              </div>

              {/* Indicadores */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {carouselImages.map((_,idx)=>(
                  <button key={idx} onClick={()=>jumpCarousel(idx)}
                    className="transition-all duration-300 rounded-full"
                    style={{ width:idx===currentImageIndex?40:6, height:6, backgroundColor:idx===currentImageIndex?colors.naranjaPrincipal:"rgba(255,255,255,.4)" }} />
                ))}
              </div>

              {/* Flechas */}
              {[-1,1].map(dir=>(
                <button key={dir}
                  onClick={()=>jumpCarousel((currentImageIndex+dir+carouselImages.length)%carouselImages.length)}
                  className={`absolute ${dir===-1?"left-3":"right-3"} top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110`}>
                  {dir===-1?"‹":"›"}
                </button>
              ))}

              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white">
                {currentImageIndex+1} / {carouselImages.length}
              </div>
            </div>

            {/* Miniaturas */}
            <div className="flex justify-center gap-2 mt-3">
              {carouselImages.map((img,idx)=>(
                <button key={idx} onClick={()=>jumpCarousel(idx)}
                  className="relative w-12 h-10 rounded-md overflow-hidden transition-all duration-300"
                  style={{ opacity:idx===currentImageIndex?1:.6, transform:idx===currentImageIndex?"scale(1.1)":"scale(1)", outline:idx===currentImageIndex?`2px solid ${colors.naranjaPrincipal}`:"none" }}>
                  <img src={img} alt={`Min ${idx+1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── INDICADOR SCROLL — pequeño y sutil ── */}
        <div style={{ position:"relative", display:"flex", justifyContent:"center" }}>
          <div className="scroll-indicator-wrap" onClick={scrollToStats}
            style={{
              position:"absolute",
              top:"-200px",
              zIndex:30,
              background:"rgba(10,22,40,0.22)",
              backdropFilter:"blur(4px)",
              borderRadius:20,
              padding:"7px 14px",
              border:"1px solid rgba(255,255,255,0.12)",
              opacity:0.65,
            }}>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:".22em", textTransform:"uppercase", color:"rgba(255,255,255,.75)", display:"block", textAlign:"center", marginBottom:5 }}>Desliza</span>
            <div className="scroll-mouse-wrap">
              <div className="scroll-mouse-ring" style={{ animationDelay:"0s", width:40, height:40, border:"1.5px solid rgba(237,165,31,.45)" }}></div>
              <div className="scroll-mouse" style={{ width:24, height:38, borderRadius:12, border:"2px solid rgba(255,255,255,.5)", padding:"5px" }}>
                <div className="scroll-dot" style={{ width:4, height:8 }}></div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0, marginTop:1 }}>
              <span style={{ fontSize:16, color:"rgba(237,165,31,.7)", lineHeight:1, animation:"arrowPush 1.4s ease-in-out infinite" }}>⌄</span>
              <span style={{ fontSize:13, color:"rgba(237,165,31,.4)", lineHeight:1, marginTop:"-8px", animation:"arrowPush 1.4s ease-in-out .15s infinite" }}>⌄</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          ESTADÍSTICAS
      ════════════════════════════════════ */}
      <div id="stats-section" ref={statsRef} className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="home-stats-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              value: displayStats.found,
              display: "24/7",
              label: "Soporte",
              sublabel: "Siempre disponibles",
              svgIcon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.celesteVerdoso} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                </svg>
              ),
              ringColor: colors.celesteVerdoso,
              pct: 100,
              target: 247,
            },
            {
              value: displayStats.reports,
              display: "100%",
              label: "Gratito",
              sublabel: "Siempre gratis para todos",
              svgIcon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.celesteVerdoso} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              ),
              ringColor: colors.naranjaPrincipal,
              pct: 100,
              target: 100,
            },
            {
              value: displayStats.accuracy,
              display: "98%",
              label: "Precisión de matching",
              sublabel: "Tecnología que conecta corazones",
              svgIcon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.celesteVerdoso} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
              ),
              ringColor: colors.celesteVerdoso,
              pct: 98,
              target: 98,
            },
          ].map((stat, i) => {
            const radius = 36;
            const circ = 2 * Math.PI * radius;
            const pctForRing = i === 0 ? 100 : stat.pct;
            const ringDash = circ - (circ * pctForRing) / 100;
            return (
              <div key={i} className="rounded-2xl p-6 text-center border-2 stat-card-hover flex items-center gap-5"
                style={{
                  backgroundColor: colors.beige,
                  borderColor: `${colors.naranjaPrincipal}40`,
                  animation: `fadeInUp .6s ease-out ${i * .15}s both`,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                }}>
                {/* Circular progress */}
                <div style={{ position:"relative", flexShrink:0 }}>
                  <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform:"rotate(-90deg)" }}>
                    <circle cx="46" cy="46" r={radius} fill="none" stroke="#e0d4c3" strokeWidth="6" />
                    <circle
                      cx="46" cy="46" r={radius}
                      fill="none"
                      stroke={stat.ringColor}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={ringDash}
                      style={{ transition:"stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1)" }}
                    />
                  </svg>
                  {/* checkmark inside circle */}
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{
                      width:28, height:28, borderRadius:"50%",
                      background: stat.ringColor,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#fff", fontSize:14, fontWeight:900,
                      boxShadow:`0 2px 8px ${stat.ringColor}60`,
                    }}>✓</div>
                  </div>
                </div>

                {/* Right content */}
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                    <div className="text-4xl font-black tabular-nums"
                      style={{
                        fontFamily:"'DM Sans',sans-serif",
                        color: colors.naranjaPrincipal,
                        lineHeight:1,
                      }}>
                      {stat.display}
                    </div>
                    <span style={{ display:"flex", alignItems:"center" }}>{stat.svgIcon}</span>
                  </div>
                  <div className="font-black tracking-wide text-sm" style={{ color: colors.azulOscuro }}>{stat.label}</div>
                  <div className="text-xs mt-1" style={{ color: colors.azulOscuro, opacity:0.6 }}>{stat.sublabel}</div>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* ════════════════════════════════════
          HISTORIAS
      ════════════════════════════════════ */}
      <div id="stories" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-12 tracking-tight"
          style={{ fontFamily:"'DM Sans',sans-serif", color:colors.beige, animation:"titleGlow 3s ease-in-out infinite" }}>
          Historias de éxito
        </h2>
        <div className="home-stories-grid grid gap-8">
          {petStories.map((pet,idx)=>(
            <div key={pet.id} className="rounded-2xl overflow-hidden border-2 story-card-hover group"
              style={{ backgroundColor:colors.beige, borderColor:colors.celesteVerdoso, animation:`fadeInUp .6s ease-out ${idx*.15}s both` }}>
              <div className="relative h-72 overflow-hidden">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background:`linear-gradient(135deg,${colors.naranjaPrincipal},${colors.mostaza})` }}>
                  {pet.daysFound===0?"Encontrada en menos de 24h":`Encontrada en ${pet.daysFound} día`}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/60 rounded-full px-2 py-0.5 text-xs text-white backdrop-blur-sm">{pet.location}</div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
              </div>
              <div className="p-5">
                <h3 className="text-xl md:text-2xl font-bold mb-1" style={{ color:colors.naranjaPrincipal, fontFamily:"'DM Sans',sans-serif" }}>{pet.name}</h3>
                <p className="text-xs mb-2 font-semibold" style={{ color:colors.celesteVerdoso }}>{pet.type}</p>
                <p className="text-sm leading-relaxed" style={{ color:colors.azulOscuro }}>{pet.story}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor:colors.naranjaPrincipal, animation:"pulse 2s ease-in-out infinite" }}></div>
                  <span className="text-xs font-semibold" style={{ color:colors.naranjaPrincipal }}>Reencuentro exitoso</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════
          SOBRE NOSOTROS + MISIÓN
      ════════════════════════════════════ */}
      <div id="about" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title:"Sobre Nosotros", paras:["Paw Finder nació en Puno (2026) con el objetivo de utilizar la tecnología para resolver la pérdida de mascotas en nuestra región.","Contamos con un equipo comprometido con el bienestar animal. Hemos desarrollado algoritmos de reconocimiento facial y un sistema de matching inteligente.","Hoy, cientos de familias puneñas han podido reencontrarse gracias a nuestra plataforma."], footer:["Fundado en 2026","25 colaboradores","Puno - Perú"], extras:null, badges:null },
            { title:"Nuestra Misión", paras:["Conectar a dueños con sus mascotas perdidas en Puno mediante tecnología avanzada y una comunidad solidaria."], footer:null, extras:[{l:"Visión 2026:",t:" Ser la plataforma líder en el sur del Perú."},{l:"Impacto social:",t:" Donamos el 8% de ganancias a refugios locales."}], badges:["Compromiso","Innovación","Empatía","Transparencia"] }
          ].map((card,i)=>(
            <div key={i} className="rounded-2xl p-6 border-2 info-card-hover group"
              style={{ backgroundColor:colors.beige, borderColor:colors.naranjaPrincipal }}>
              <h3 className="text-xl md:text-2xl font-black mb-3" style={{ color:colors.celesteVerdoso, fontFamily:"'DM Sans',sans-serif" }}>{card.title}</h3>
              {card.paras.map((p,j)=><p key={j} className="text-sm leading-relaxed mb-2" style={{ color:colors.azulOscuro }}>{p}</p>)}
              {card.extras?.map((e,j)=>(
                <p key={j} className="text-sm leading-relaxed mb-2" style={{ color:colors.azulOscuro }}>
                  <span className="font-bold" style={{ color:colors.naranjaPrincipal }}>{e.l}</span>{e.t}
                </p>
              ))}
              {card.footer && (
                <div className="mt-4 pt-3 border-t flex justify-between text-xs" style={{ borderColor:colors.naranjaPrincipal+"40", color:colors.naranjaClaro }}>
                  {card.footer.map(f=><span key={f} className="hover:scale-105 transition-transform inline-block">{f}</span>)}
                </div>
              )}
              {card.badges && (
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-2 justify-center" style={{ borderColor:colors.naranjaPrincipal+"40" }}>
                  {card.badges.map(b=>(
                    <span key={b} className="text-xs px-2 py-1 rounded-full cursor-default transition-all hover:scale-105 hover:rotate-2"
                      style={{ backgroundColor:colors.naranjaPrincipal+"20", color:colors.naranjaClaro }}>{b}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════
          BENEFICIOS
      ════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-center mb-10"
          style={{ fontFamily:"'DM Sans',sans-serif", color:colors.beige, animation:"titleGlow 3s ease-in-out infinite" }}>
          ¿Por qué elegir Paw Finder?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[{t:"Respuesta Rápida",s:"Notificaciones en tiempo real"},{t:"100% Seguro",s:"Datos protegidos"},{t:"Enfoque Local",s:"Solo en Puno"},{t:"Comunidad Activa",s:"Miles de usuarios"}].map((b,i)=>(
            <div key={i} className="rounded-xl p-4 md:p-5 text-center border-2 benefit-card-hover"
              style={{ backgroundColor:colors.beige, borderColor:colors.celesteVerdoso }}>
              <h4 className="font-bold text-sm md:text-base mb-1" style={{ color:colors.azulOscuro }}>{b.t}</h4>
              <p className="text-xs" style={{ color:colors.azulOscuro }}>{b.s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════
          COMENTARIOS
      ════════════════════════════════════ */}
      <div id="testimonials" className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="backdrop-blur-md rounded-2xl p-6 border-2"
          style={{ backgroundColor:`${colors.azulOscuro}cc`, borderColor:colors.naranjaPrincipal }}>

          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2"
              style={{ fontFamily:"'DM Sans',sans-serif", color:colors.naranjaPrincipal }}>
              Opiniones de la comunidad
            </h2>
            {promedioEstrellas ? (
              <p className="text-sm" style={{ color:colors.blanco }}>
                ⭐ {promedioEstrellas} sobre 5 · {comments.length} {comments.length === 1 ? "opinión" : "opiniones"}
              </p>
            ) : (
              <p className="text-sm" style={{ color:colors.blanco }}>Sé el primero en dejar tu opinión</p>
            )}
          </div>

          {/* Mensaje de estado */}
          {mensajeComent.texto && (
            <div className="mb-4 px-4 py-2 rounded-lg text-sm font-bold text-center"
              style={{ background: mensajeComent.tipo==="error" ? "#fff0f0" : "#e6f7f0",
                       color:      mensajeComent.tipo==="error" ? "#c62828" : "#007A7B" }}>
              {mensajeComent.texto}
            </div>
          )}

          {/* ── PANEL SUPERIOR: mi opinión o formulario nuevo ── */}
          {(() => {
            const miOpinion = usuarioActual ? comments.find(c => c.uid === usuarioActual.uid) : null;

            /* A) Usuario no autenticado → formulario bloqueado */
            if (!usuarioActual) return (
              <div className="mb-6 rounded-xl p-4 border" style={{ backgroundColor:colors.beige, borderColor:`${colors.naranjaPrincipal}50` }}>
                <h3 className="font-bold mb-2 text-base md:text-lg" style={{ color:colors.azulOscuro }}>Deja tu opinión:</h3>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(star=>(
                    <button key={star} onClick={()=>{ sessionStorage.setItem("pawfinder_redirect","#testimonials"); setShowModal(true); }}
                      className="text-xl md:text-2xl transition-all hover:scale-125"
                      style={{ color:star<=newRating?"#eab308":"#9ca3af" }}>★</button>
                  ))}
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input type="text" readOnly
                    placeholder="Inicia sesión para comentar..."
                    onClick={()=>{ sessionStorage.setItem("pawfinder_redirect","#testimonials"); setShowModal(true); }}
                    className="flex-1 bg-white rounded-lg px-4 py-2 border focus:outline-none text-sm"
                    style={{ borderColor:`${colors.naranjaPrincipal}50`, cursor:"pointer" }} />
                  <button onClick={()=>{ sessionStorage.setItem("pawfinder_redirect","#testimonials"); setShowModal(true); }}
                    className="font-bold px-6 py-2 rounded-lg hover:scale-105 transition-all text-sm text-white"
                    style={{ background:`linear-gradient(135deg,${colors.naranjaPrincipal},${colors.mostaza})` }}>
                    Enviar
                  </button>
                </div>
              </div>
            );

            /* B) Usuario autenticado, ya tiene opinión, modo LECTURA */
            if (miOpinion && editingId !== miOpinion.id) return (
              <div className="mb-6 rounded-xl p-4 border-2" style={{ backgroundColor:colors.beige, borderColor:colors.naranjaPrincipal }}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className="text-xs font-black uppercase tracking-wider" style={{ color:colors.naranjaPrincipal }}>Tu opinión publicada</span>
                  <div className="flex gap-2">
                    <button className="comment-action-btn"
                      style={{ color:colors.celesteVerdoso, backgroundColor:colors.celesteVerdoso+"22" }}
                      onClick={()=>startEdit(miOpinion)}>
                      ✏️ Editar
                    </button>
                    <button className="comment-action-btn"
                      style={{ color:"#e74c3c", backgroundColor:"#e74c3c18" }}
                      onClick={()=>deleteComment(miOpinion.uid)}>
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {miOpinion.foto ? (
                    <img src={miOpinion.foto} alt={miOpinion.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      style={{ border:`2px solid ${colors.naranjaPrincipal}` }} />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                      style={{ background:`linear-gradient(135deg,${colors.naranjaPrincipal},${colors.mostaza})` }}>
                      {miOpinion.avatar}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm" style={{ color:colors.azulOscuro }}>{miOpinion.name}</span>
                      <span className="text-xs text-gray-500">{miOpinion.date}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_,i)=>(
                        <span key={i} className={`text-base ${i<miOpinion.rating?"text-yellow-500":"text-gray-300"}`}>★</span>
                      ))}
                    </div>
                    <p className="text-sm" style={{ color:colors.azulOscuro }}>{miOpinion.text}</p>
                  </div>
                </div>
              </div>
            );

            /* C) Usuario autenticado, ya tiene opinión, modo EDICIÓN */
            if (miOpinion && editingId === miOpinion.id) return (
              <div className="mb-6 rounded-xl p-4 border-2" style={{ backgroundColor:colors.beige, borderColor:colors.celesteVerdoso }}>
                <h3 className="font-bold mb-3 text-base" style={{ color:colors.azulOscuro }}>✏️ Editar tu opinión:</h3>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(star=>(
                    <button key={star} onClick={()=>setEditRating(star)}
                      className="text-xl md:text-2xl transition-all hover:scale-125"
                      style={{ color:star<=editRating?"#eab308":"#9ca3af" }}>★</button>
                  ))}
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input type="text" value={editText} onChange={e=>setEditText(e.target.value)}
                    placeholder="Tu comentario..."
                    className="flex-1 bg-white rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ borderColor:`${colors.celesteVerdoso}80` }}
                    onKeyPress={e=>e.key==="Enter"&&saveEdit()} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={enviando}
                      className="font-bold px-5 py-2 rounded-lg hover:scale-105 transition-all text-sm text-white"
                      style={{ background:`linear-gradient(135deg,${colors.celesteVerdoso},${colors.azulOscuro})`, opacity:enviando?0.7:1 }}>
                      {enviando ? "Guardando..." : "Guardar"}
                    </button>
                    <button onClick={()=>setEditingId(null)}
                      className="font-bold px-4 py-2 rounded-lg text-sm"
                      style={{ background:"#e5e7eb", color:"#6b7280" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            );

            /* D) Usuario autenticado, sin opinión → formulario nuevo */
            return (
              <div className="mb-6 rounded-xl p-4 border" style={{ backgroundColor:colors.beige, borderColor:`${colors.naranjaPrincipal}50` }}>
                <h3 className="font-bold mb-2 text-base md:text-lg" style={{ color:colors.azulOscuro }}>Deja tu opinión:</h3>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(star=>(
                    <button key={star} onClick={()=>setNewRating(star)}
                      className="text-xl md:text-2xl transition-all hover:scale-125"
                      style={{ color:star<=newRating?"#eab308":"#9ca3af" }}>★</button>
                  ))}
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input type="text" value={newComment} onChange={e=>setNewComment(e.target.value)}
                    placeholder="Cuéntanos tu experiencia..."
                    className="flex-1 bg-white rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 transition-all text-sm"
                    style={{ borderColor:`${colors.naranjaPrincipal}50` }}
                    onKeyPress={e=>e.key==="Enter"&&addComment()} />
                  <button onClick={addComment} disabled={enviando}
                    className="font-bold px-6 py-2 rounded-lg hover:scale-105 hover:shadow-lg transition-all text-sm text-white"
                    style={{ background:`linear-gradient(135deg,${colors.naranjaPrincipal},${colors.mostaza})`, opacity:enviando?0.7:1 }}>
                    {enviando ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Lista de opiniones de la comunidad (excluye la propia) */}
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {comments.filter(c => !usuarioActual || c.uid !== usuarioActual.uid).map(comment=>(
              <div key={comment.id} className="bg-white rounded-lg p-3 comment-card">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {comment.foto ? (
                    <img src={comment.foto} alt={comment.name}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      style={{ border:`2px solid ${colors.naranjaPrincipal}` }} />
                  ) : (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold text-xs md:text-sm text-white flex-shrink-0"
                      style={{ background:`linear-gradient(135deg,${colors.naranjaPrincipal},${colors.mostaza})` }}>
                      {comment.avatar}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-center flex-wrap gap-1 mb-1">
                      <div>
                        <span className="font-bold text-xs md:text-sm" style={{ color:colors.azulOscuro }}>{comment.name}</span>
                        <span className="text-xs ml-2 text-gray-500">{comment.date}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_,i)=>(
                          <span key={i} className={`text-xs md:text-sm ${i<comment.rating?"text-yellow-500":"text-gray-300"}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 text-xs md:text-sm">{comment.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          FOOTER
      ════════════════════════════════════ */}
      <footer className="relative z-10 mt-8 py-8 md:py-12 border-t-2"
        style={{ backgroundColor:colors.footerBg, borderColor:colors.naranjaPrincipal }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center md:text-left">
            <div className="transition-all duration-300 hover:-translate-y-1">
              <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color:colors.naranjaPrincipal, fontFamily:"'DM Sans',sans-serif" }}>PAW FINDER</h3>
              <p className="text-xs md:text-sm italic mb-2" style={{ color:colors.naranjaClaro }}>Pet Lovers</p>
              <p className="text-xs md:text-sm text-white/80">Plataforma líder en reunificación de mascotas en Puno. 2026 inició nuestro sistema.</p>
            </div>
            <div className="transition-all duration-300 hover:-translate-y-1">
              <h4 className="font-bold mb-3 md:mb-4 text-base md:text-lg" style={{ color:colors.naranjaPrincipal }}>Enlaces</h4>
              <ul className="space-y-2 text-xs md:text-sm text-white/80">
                <li><button onClick={()=>navigate("/Reportes")} className="hover:translate-x-2 transition inline-block hover:text-white">Reportar mascota</button></li>
                <li><button onClick={()=>navigate("/mapa")}     className="hover:translate-x-2 transition inline-block hover:text-white">Ver mapa</button></li>
              </ul>
            </div>
            <div className="transition-all duration-300 hover:-translate-y-1">
              <h4 className="font-bold mb-3 md:mb-4 text-base md:text-lg" style={{ color:colors.naranjaPrincipal }}>Contacto</h4>
              <ul className="space-y-2 text-xs md:text-sm text-white/80">
                <li>+51 951 234 567</li><li>hola@pawfinder.com</li><li>Puno - Perú</li>
              </ul>
            </div>
            <div className="transition-all duration-300 hover:-translate-y-1">
              <h4 className="font-bold mb-3 md:mb-4 text-base md:text-lg" style={{ color:colors.naranjaPrincipal }}>Horario</h4>
              <ul className="space-y-2 text-xs md:text-sm text-white/80">
                <li>Soporte 24/7</li><li>Oficina: Lun-Vie 9am-6pm</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-8 md:mt-10 pt-6 border-t border-white/20 text-xs md:text-sm text-white/80">
            © 2026 PAW FINDER · Uniendo familias puneñas, una patita a la vez
          </div>
        </div>
      </footer>

      {/* ── SCROLL TO TOP ── */}
      {showScrollTop && (
        <button onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl"
          style={{ backgroundColor:colors.naranjaPrincipal, color:colors.azulOscuro, animation:"bounce 2s ease-in-out infinite", fontSize:18, fontWeight:900 }}>
          ↑
        </button>
      )}

      {/* ── MODAL LOGIN (solo comentarios) ── */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background:"rgba(11,38,67,.78)", backdropFilter:"blur(6px)" }}
          onClick={()=>setShowModal(false)}>
          <div className="rounded-3xl p-8 max-w-sm w-full text-center relative"
            style={{ backgroundColor:colors.beige, boxShadow:"0 32px 80px rgba(0,0,0,.35)", animation:"modalIn .3s cubic-bezier(.16,1,.3,1) both" }}
            onClick={e=>e.stopPropagation()}>

            <button onClick={()=>setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all hover:scale-110"
              style={{ backgroundColor:colors.naranjaPrincipal+"30", color:colors.azulOscuro }}>×</button>

            <img src={perritoImg} alt="Perrito" className="mx-auto mb-4"
              style={{ width:110, height:110, objectFit:"contain", filter:"drop-shadow(0 8px 16px rgba(0,0,0,.15))", animation:"float-pet 2.5s ease-in-out infinite" }} />

            <h3 className="text-xl font-black mb-3" style={{ color:colors.azulOscuro, fontFamily:"'DM Sans',sans-serif" }}>¡Woof!</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color:colors.azulOscuro }}>
              Para publicar una opinión primero debes iniciar sesión. ¡Únete a la comunidad PAW FINDER!
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={()=>{ setShowModal(false); navigate("/login"); }}
                className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
                style={{ background:`linear-gradient(135deg,${colors.naranjaPrincipal},${colors.mostaza})` }}>
                Iniciar sesión
              </button>
              <button
                onClick={()=>{ setShowModal(false); navigate("/login"); }}
                className="w-full py-3 rounded-xl font-bold transition-all hover:scale-105"
                style={{ backgroundColor:colors.azulMedio+"20", color:colors.azulOscuro, border:`2px solid ${colors.naranjaPrincipal}50` }}>
                Registrarme
              </button>
              <button onClick={()=>setShowModal(false)}
                className="text-xs font-semibold mt-1 transition-all hover:opacity-70"
                style={{ color:colors.azulOscuro, background:"none", border:"none", cursor:"pointer" }}>
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}