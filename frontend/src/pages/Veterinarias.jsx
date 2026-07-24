import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const CENTRO_PUNO = { lat: -15.8402, lng: -70.0219 };

// =================== DATOS REALISTAS (VETERINARIAS Y REFUGIOS EN PUNO) ===================
const lugares = [
  // Veterinarias
  {
    tipo: "veterinaria",
    nombre: "Vet. Amigos Fieles",
    direccion: "Av. Gonda Amigos, 33",
    rating: 5,
    horario: "Abierto • hasta 8pm",
    abierto: true,
    telefono: "+51922546880",
    tags: [{ texto: "Emergencias", bg: "#e8f5e9", color: "#1a7a60" }, { texto: "24h", bg: "#e8eaf6", color: "#3949ab" }],
    lat: -15.8402, lng: -70.0219,
    imagen: "https://picsum.photos/id/20/100/100",
  },
  {
    tipo: "veterinaria",
    nombre: "Clínica PetCare",
    direccion: "Jr. Las Flores, 120",
    rating: 4,
    horario: "Cierra a las 6pm",
    abierto: true,
    telefono: "+51952346700",
    tags: [{ texto: "Cirugías", bg: "#e8eaf6", color: "#3949ab" }],
    lat: -15.845, lng: -70.018,
    imagen: "https://picsum.photos/id/207/100/100",
  },
  {
    tipo: "veterinaria",
    nombre: "San Martín Veterinaria",
    direccion: "Calle Lima 234",
    rating: 4,
    horario: "Abierto • hasta 7pm",
    abierto: true,
    telefono: "+51987654321",
    tags: [{ texto: "Vacunación", bg: "#e3f2fd", color: "#0d47a1" }],
    lat: -15.832, lng: -70.019,
    imagen: "https://picsum.photos/id/15/100/100",
  },
  {
    tipo: "veterinaria",
    nombre: "Veterinaria Los Andes",
    direccion: "Av. El Sol 567",
    rating: 5,
    horario: "Abierto • hasta 9pm",
    abierto: true,
    telefono: "+51981234567",
    tags: [{ texto: "Especialistas", bg: "#f3e5f5", color: "#6a1b9a" }],
    lat: -15.838, lng: -70.025,
    imagen: "https://picsum.photos/id/123/100/100",
  },
  {
    tipo: "veterinaria",
    nombre: "Centro Veterinario Titicaca",
    direccion: "Jr. Puno 890",
    rating: 4,
    horario: "Cierra a las 8pm",
    abierto: true,
    telefono: "+51983456789",
    tags: [{ texto: "Farmacia", bg: "#fff8e1", color: "#ff8f00" }],
    lat: -15.842, lng: -70.015,
    imagen: "https://picsum.photos/id/29/100/100",
  },
  {
    tipo: "veterinaria",
    nombre: "Vet. Municipal Puno",
    direccion: "Av. Túpac Amaru 321",
    rating: 3,
    horario: "Abierto • hasta 5pm",
    abierto: true,
    telefono: "+51984567890",
    tags: [{ texto: "Bajo costo", bg: "#e0f2f1", color: "#00695c" }],
    lat: -15.848, lng: -70.022,
    imagen: "https://picsum.photos/id/45/100/100",
  },
  {
    tipo: "veterinaria",
    nombre: "Animal Care Clinic",
    direccion: "Calle Arequipa 456",
    rating: 5,
    horario: "Abierto 24h",
    abierto: true,
    telefono: "+51985678901",
    tags: [{ texto: "24h", bg: "#e8eaf6", color: "#3949ab" }, { texto: "Urgencias", bg: "#ffebee", color: "#c62828" }],
    lat: -15.836, lng: -70.028,
    imagen: "https://picsum.photos/id/89/100/100",
  },
  {
    tipo: "veterinaria",
    nombre: "Pet Health Center",
    direccion: "Jr. Moquegua 100",
    rating: 4,
    horario: "Cierra a las 7pm",
    abierto: true,
    telefono: "+51986789012",
    tags: [{ texto: "Odontología", bg: "#e8f5e9", color: "#2e7d32" }],
    lat: -15.844, lng: -70.012,
    imagen: "https://picsum.photos/id/91/100/100",
  },
  {
    tipo: "veterinaria",
    nombre: "Veterinaria San Francisco",
    direccion: "Av. Simón Bolívar 77",
    rating: 4,
    horario: "Cerrado hoy",
    abierto: false,
    telefono: "+51987890123",
    tags: [{ texto: "Peluquería", bg: "#fce4ec", color: "#ad1457" }],
    lat: -15.85, lng: -70.027,
    imagen: "https://picsum.photos/id/159/100/100",
  },
  {
    tipo: "veterinaria",
    nombre: "Clínica Veterinaria Cayma",
    direccion: "Calle Huáscar 444",
    rating: 5,
    horario: "Abierto • hasta 8pm",
    abierto: true,
    telefono: "+51988901234",
    tags: [{ texto: "Imagenología", bg: "#e8eaf6", color: "#283593" }],
    lat: -15.841, lng: -70.008,
    imagen: "https://picsum.photos/id/96/100/100",
  },
  // Refugios
  {
    tipo: "refugio",
    nombre: "Refugio La Huella",
    direccion: "Calle Morada, 33",
    rating: 4,
    horario: "Abierto • hasta 8pm",
    abierto: true,
    telefono: "+51952156000",
    tags: [{ texto: "Adopciones", bg: "#fff3e0", color: "#e65100" }, { texto: "Rescate", bg: "#e8f5e9", color: "#1a7a60" }],
    lat: -15.835, lng: -70.025,
    imagen: "https://picsum.photos/id/169/100/100",
  },
  {
    tipo: "refugio",
    nombre: "Refugio San Isidro",
    direccion: "Calle Norte, 45",
    rating: 5,
    horario: "Cerrado hoy",
    abierto: false,
    telefono: "+51952346800",
    tags: [{ texto: "Adopciones", bg: "#fff3e0", color: "#e65100" }],
    lat: -15.85, lng: -70.03,
    imagen: "https://picsum.photos/id/300/100/100",
  },
  {
    tipo: "refugio",
    nombre: "Patitas Puno",
    direccion: "Av. Manco Cápac 222",
    rating: 4,
    horario: "Abierto • hasta 6pm",
    abierto: true,
    telefono: "+51990123456",
    tags: [{ texto: "Voluntariado", bg: "#e0f7fa", color: "#006064" }],
    lat: -15.837, lng: -70.018,
    imagen: "https://picsum.photos/id/201/100/100",
  },
  {
    tipo: "refugio",
    nombre: "Huellitas de Amor",
    direccion: "Jr. Ayacucho 123",
    rating: 5,
    horario: "Abierto • hasta 7pm",
    abierto: true,
    telefono: "+51991234567",
    tags: [{ texto: "Donaciones", bg: "#f1f8e9", color: "#33691e" }],
    lat: -15.839, lng: -70.023,
    imagen: "https://picsum.photos/id/104/100/100",
  },
  {
    tipo: "refugio",
    nombre: "Refugio Municipal Puno",
    direccion: "Carretera a Juliaca km 5",
    rating: 3,
    horario: "Cerrado hoy",
    abierto: false,
    telefono: "+51992345678",
    tags: [{ texto: "Esterilización", bg: "#ede7f6", color: "#4527a0" }],
    lat: -15.83, lng: -70.04,
    imagen: "https://picsum.photos/id/245/100/100",
  },
];

// Función distancia Haversine (solo para mostrar distancia, no para filtrar)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function Veterinarias() {
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [ubicacionUsuario, setUbicacionUsuario] = useState(null);
  const [usandoUbicacion, setUsandoUbicacion] = useState(false);

  useEffect(() => {
    if (usandoUbicacion && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUbicacionUsuario({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUbicacionUsuario(CENTRO_PUNO)
      );
    } else if (!usandoUbicacion) {
      setUbicacionUsuario(CENTRO_PUNO);
    }
  }, [usandoUbicacion]);

  const puntoReferencia = ubicacionUsuario || CENTRO_PUNO;

  // Filtrar solo por tipo y búsqueda (sin radio)
  const filtrados = lugares.filter(lugar => {
    const coincideTipo = filtro === "todos" || lugar.tipo === filtro;
    const coincideBusqueda = lugar.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                             lugar.direccion.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  }).map(lugar => ({
    ...lugar,
    distanciaCalculada: getDistanceFromLatLonInKm(puntoReferencia.lat, puntoReferencia.lng, lugar.lat, lugar.lng)
  }));

  // Icono circular mejorado
  const getCustomIcon = (imagenUrl) => L.divIcon({
    html: `<div style="width:44px; height:44px; border-radius:50%; overflow:hidden; border:3px solid white; outline:2px solid #007A7B; background:white; box-shadow:0 2px 8px rgba(0,0,0,0.3);"><img src="${imagenUrl}" style="width:100%; height:100%; object-fit:cover;" /></div>`,
    iconSize: [44,44],
    iconAnchor: [22,44],
    popupAnchor: [0,-44],
    className: ""
  });

  // PALETA DE COLORES ACTUALIZADA
  const paleta = {
    primario: "#DD6600",      // Naranja fuerte
    secundario: "#FEA02F",    // Naranja claro
    fondoGeneral: "#EAD9C7",  // Beige claro
    tarjetaBlanca: "#FFFFFF",
    borde: "#007A7B",         // Verde azulado
    textoPrincipal: "#003F5A", // Azul petróleo
    textoSecundario: "#6b5b3e",
    exito: "#007A7B",         // Verde azulado
    mapa: "#007A7B",          // Verde azulado
    acento: "#FEA02F"         // Naranja claro
  };

  return (
    <div 
      className="min-h-screen p-5 relative" style={{ paddingBottom: 80 }} 
      style={{ 
        backgroundImage: "url('/fono.png')",
        backgroundSize: "contain",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundColor: paleta.fondoGeneral
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .vet-main-layout { flex-direction: column !important; }
          .vet-sidebar-list { max-height: 300px; overflow-y: auto; }
        }
      `}</style>
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]"></div>
      <div className="relative z-10 max-w-6xl mx-auto">
        <style>{`
          @media (max-width: 768px) {
            .vet-map-box { height: 220px !important; }
          }
        `}</style>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Columna izquierda: mapa y filtros */}
          <div className="rounded-2xl p-4 shadow-md border" style={{ backgroundColor: paleta.tarjetaBlanca, borderColor: paleta.borde }}>
            <h2 className="font-black text-lg mb-3" style={{ color: paleta.primario }}>Buscar cerca de mí</h2>
            
            {/* Tipo de lugar */}
            <p className="text-xs font-black uppercase mb-1" style={{ color: paleta.textoPrincipal }}>Tipo de lugar</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[["todos","Todos"],["veterinaria","Veterinarias"],["refugio","Refugios"]].map(([val,label]) => (
                <span key={val} onClick={() => setFiltro(val)} className="text-xs font-bold px-3 py-1 rounded-full cursor-pointer"
                  style={{ backgroundColor: filtro===val ? paleta.primario : paleta.fondoGeneral, color: filtro===val ? "#FFFFFF" : paleta.textoPrincipal }}>
                  {label}
                </span>
              ))}
            </div>
            
            <button onClick={() => setUsandoUbicacion(!usandoUbicacion)} className="text-xs font-bold mb-3 px-3 py-1 rounded-full"
              style={{ backgroundColor: usandoUbicacion ? paleta.primario : paleta.fondoGeneral, color: usandoUbicacion ? "#FFFFFF" : paleta.textoPrincipal }}>
              {usandoUbicacion ? "📍 Usando mi ubicación" : "📍 Usar mi ubicación"}
            </button>
            
            <div className="w-full h-64 rounded-xl overflow-hidden mb-4 border" style={{ borderColor: paleta.borde }}>
              <MapContainer center={[CENTRO_PUNO.lat, CENTRO_PUNO.lng]} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                {filtrados.map(lugar => (
                  <Marker key={lugar.nombre} position={[lugar.lat, lugar.lng]} icon={getCustomIcon(lugar.imagen)}>
                    <Popup>
                      <div className="text-center">
                        <img src={lugar.imagen} alt={lugar.nombre} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
                        <h3 className="font-bold text-sm" style={{ color: paleta.textoPrincipal }}>{lugar.nombre}</h3>
                        <p className="text-xs">{lugar.direccion}</p>
                        <p className="text-xs">Distancia: {lugar.distanciaCalculada.toFixed(1)} km</p>

                        <div className="flex gap-2 justify-center mt-2">
                          <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lugar.lat},${lugar.lng}`,"_blank")}
                            className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: paleta.mapa, color: "white" }}>Ruta exacta</button>
                        </div>

                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <input type="text" placeholder="Buscar por nombre o dirección..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}
              className="w-full p-2 rounded-xl border text-sm" style={{ borderColor: paleta.borde, backgroundColor: paleta.fondoGeneral }} 
              />
          </div>

          {/* Columna derecha: resultados */}
          <div className="rounded-2xl p-4 shadow-md border" style={{ backgroundColor: paleta.tarjetaBlanca, borderColor: paleta.borde }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-xl" style={{ color: paleta.primario }}>Resultados cercanos</h2>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: paleta.primario, color: "#FFFFFF" }}>{filtrados.length} encontrados</span>
            </div>
            {filtrados.length === 0 ? (
              <div className="text-center py-8" style={{ color: paleta.textoSecundario }}>
                <div className="text-4xl mb-2">🔍</div>
                <p className="font-bold">No hay lugares</p>
                <p className="text-xs">Prueba cambiando el filtro o la búsqueda</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filtrados.map(v => (
                  <div key={v.nombre} className="flex gap-3 p-2 border-b last:border-0" style={{ borderColor: paleta.borde }}>
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: v.abierto ? "#e8f5e9" : "#fce4ec" }}>
                      <img src={v.imagen} alt={v.nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-sm" style={{ color: paleta.textoPrincipal }}>{v.nombre}</h3>
                      <div className="text-xs" style={{ color: paleta.primario }}>{"★".repeat(v.rating)}{"☆".repeat(5-v.rating)}</div>
                      <div className="text-xs text-gray-600">{v.direccion} • {v.distanciaCalculada.toFixed(1)} km</div>
                      <div className="text-xs font-bold" style={{ color: v.abierto ? paleta.exito : "#c62828" }}>{v.horario}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {v.tags.map(tag => <span key={tag.texto} className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: tag.bg, color: tag.color }}>{tag.texto}</span>)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`,"_blank")}
                        className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: paleta.mapa, color: "white" }}>Ruta</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}