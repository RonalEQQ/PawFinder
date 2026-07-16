import { useState, useEffect } from 'react'
import { auth } from '../firebase/firebaseConfig'
import FondoAnimado from '../components/FondoAnimado'

const API = import.meta.env.VITE_API_URL

export default function Campanas() {
    const paleta = {
        primario: "#DD6600", fondoGeneral: "#EAD9C7",
        tarjetaBlanca: "#FFFFFF", borde: "#007A7B", textoPrincipal: "#003F5A",
        textoSecundario: "#6b5b3e", exito: "#007A7B", info: "#FEA02F",
        mapa: "#007A7B", warning: "#DD6600"
    }

    const [mensajePerrito, setMensajePerrito] = useState('')
    const [mostrarPerrito, setMostrarPerrito] = useState(false)
    const [pestana, setPestana] = useState('campanas') // 'campanas' | 'mis'
    const [campanas, setCampanas] = useState([])
    const [likesUsuario, setLikesUsuario] = useState(new Set())
    const [usuarioDb, setUsuarioDb] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [modalNuevaCampana, setModalNuevaCampana] = useState(false)
    const [modalEditar, setModalEditar] = useState(false)
    const [campanaEditando, setCampanaEditando] = useState(null)
    const [modalImagen, setModalImagen] = useState(false)
    const [imagenSeleccionada, setImagenSeleccionada] = useState(null)
    const [filtroTexto, setFiltroTexto] = useState('')
    const [comprimiendo, setComprimiendo] = useState(false)
    const [mostrarArchivadas, setMostrarArchivadas] = useState(false)
    const [animandoLike, setAnimandoLike] = useState(null)
    const [verificandoRuc, setVerificandoRuc] = useState(false)
    const [datosRuc, setDatosRuc] = useState(null)
    const [errorRuc, setErrorRuc] = useState('')
    const [guardando, setGuardando] = useState(false)



    const [nuevaCampana, setNuevaCampana] = useState({
    nombre: '', zona: '', lugar: '', fecha_inicio: '', fecha_fin: '',
    hora_inicio: '', hora_fin: '', tipo_vacuna: '', tipo_vacuna_otro: '',
    ruc: '', descripcion: '', imagen: null, imagenPreview: null,
    ubicacionVerificada: false
    })


    const [formEditar, setFormEditar] = useState({
        nombre: '', zona: '', lugar: '', fecha_inicio: '', fecha_fin: '',
        hora_inicio: '', hora_fin: '', tipo_vacuna: '', tipo_vacuna_otro: '',
        ruc: '', descripcion: '', imagen: null, imagenPreview: null
    })

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const res = await fetch(API + '/api/auth/usuario/' + user.uid)
                    if (res.ok) setUsuarioDb(await res.json())
                } catch (e) { console.error(e) }
            }
        })
        return () => unsubscribe()
    }, [])

    const cargarCampanas = async () => {
        setCargando(true)
        try {
            const res = await fetch(API + '/api/campanas')
            const data = await res.json()
            if (res.ok) setCampanas(Array.isArray(data) ? data : [])
        } catch (e) { console.error(e) }
        finally { setCargando(false) }
    }

    useEffect(() => { cargarCampanas() }, [])

    const verificarRuc = async () => {
        if (!nuevaCampana.ruc || nuevaCampana.ruc.length !== 11) { setErrorRuc('El RUC debe tener 11 dígitos'); return }
        setVerificandoRuc(true); setErrorRuc(''); setDatosRuc(null)
        try {
            const res = await fetch(API + '/api/ruc/' + nuevaCampana.ruc)
            const data = await res.json()
            if (!res.ok) setErrorRuc(data.error || 'RUC no encontrado')
            else if (data.estado !== 'ACTIVO' || data.condicion !== 'HABIDO') setErrorRuc('RUC ' + data.estado + ' / ' + data.condicion + ' — no válido')
            else setDatosRuc(data)
        } catch { setErrorRuc('No se pudo conectar al servidor') }
        finally { setVerificandoRuc(false) }
    }

    const comprimirImagen = (base64, maxWidth = 800, calidad = 0.7) => new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            let w = img.width, h = img.height
            if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth }
            canvas.width = w; canvas.height = h
            canvas.getContext('2d').drawImage(img, 0, 0, w, h)
            resolve(canvas.toDataURL('image/jpeg', calidad))
        }
        img.src = base64
    })

    const handleImagenChange = async (e, esEditar = false) => {
        const file = e.target.files[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) { alert('Máximo 2MB.'); return }
        setComprimiendo(true)
        const reader = new FileReader()
        reader.onloadend = async () => {
            try {
                const comprimida = await comprimirImagen(reader.result)
                if (esEditar) setFormEditar(prev => ({ ...prev, imagen: comprimida, imagenPreview: comprimida }))
                else setNuevaCampana(prev => ({ ...prev, imagen: comprimida, imagenPreview: comprimida }))
            } catch {
                if (esEditar) setFormEditar(prev => ({ ...prev, imagen: reader.result, imagenPreview: reader.result }))
                else setNuevaCampana(prev => ({ ...prev, imagen: reader.result, imagenPreview: reader.result }))
            } finally { setComprimiendo(false) }
        }
        reader.readAsDataURL(file)
    }

    const handleLike = async (campanaId) => {
        if (!usuarioDb) { alert('Debes iniciar sesión para dar like'); return }
        setAnimandoLike(campanaId)
        setTimeout(() => setAnimandoLike(null), 300)
        try {
            const res = await fetch(API + '/api/campanas/' + campanaId + '/like', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: usuarioDb.id })
            })
            const data = await res.json()
            setLikesUsuario(prev => {
                const nuevo = new Set(prev)
                data.like ? nuevo.add(campanaId) : nuevo.delete(campanaId)
                return nuevo
            })
            cargarCampanas()
        } catch (e) { console.error(e) }
    }

    const handleAgregarCampana = async () => {
        if (!usuarioDb) {
            cerrarModal()
            window.location.href = '/login'
            return
        }
    
        if (!nuevaCampana.nombre || !nuevaCampana.zona || !nuevaCampana.lugar ||
            !nuevaCampana.fecha_inicio || !nuevaCampana.fecha_fin) {

            alert('Complete todos los campos obligatorios'); return
        }
        
        setGuardando(true)
        try {
            const res = await fetch(API + '/api/campanas', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: usuarioDb?.id || null,
                    nombre: nuevaCampana.nombre, zona: nuevaCampana.zona,
                    lugar: nuevaCampana.lugar, fecha_inicio: nuevaCampana.fecha_inicio,
                    fecha_fin: nuevaCampana.fecha_fin, ruc: nuevaCampana.ruc,
                    razon_social: datosRuc?.razonSocial || null,
                    descripcion: nuevaCampana.descripcion || '',
                    imagen: nuevaCampana.imagen || null,
                    tipo_vacuna: nuevaCampana.tipo_vacuna === 'Otros' ? nuevaCampana.tipo_vacuna_otro : nuevaCampana.tipo_vacuna,
                    hora_inicio: nuevaCampana.hora_inicio || null,
                    hora_fin: nuevaCampana.hora_fin || null
                })
            })
            if (res.ok) { await cargarCampanas(); cerrarModal() }
            else { const err = await res.json(); alert('Error: ' + (err.error || 'No se pudo guardar')) }
        } catch { alert('Error al conectar con el servidor') }
        finally { setGuardando(false) }
    }


    const abrirEditar = (c) => {
        setCampanaEditando(c)
        setFormEditar({
            nombre: c.nombre || '', zona: c.zona || '', lugar: c.lugar || '',
            fecha_inicio: c.fecha_inicio?.split('T')[0] || '',
            fecha_fin: c.fecha_fin?.split('T')[0] || '',
            hora_inicio: c.hora_inicio || '', hora_fin: c.hora_fin || '',
            tipo_vacuna: c.tipo_vacuna || '', tipo_vacuna_otro: '',
            ruc: c.ruc || '', descripcion: c.descripcion || '',
            imagen: c.imagen || null, imagenPreview: c.imagen || null
        })
        setModalEditar(true)
    }


    const handleGuardarEdicion = async () => {
        if (!formEditar.nombre || !formEditar.zona || !formEditar.lugar ||
            !formEditar.fecha_inicio || !formEditar.fecha_fin) {
            alert('Complete todos los campos obligatorios'); return
        }
        setGuardando(true)
        try {
            const res = await fetch(API + '/api/campanas/' + campanaEditando.id, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({
                    nombre: formEditar.nombre, zona: formEditar.zona,
                    lugar: formEditar.lugar, fecha_inicio: formEditar.fecha_inicio,
                    fecha_fin: formEditar.fecha_fin,
                    hora_inicio: formEditar.hora_inicio || null,
                    hora_fin: formEditar.hora_fin || null,
                    tipo_vacuna: formEditar.tipo_vacuna === 'Otros' ? formEditar.tipo_vacuna_otro : formEditar.tipo_vacuna,
                    ruc: formEditar.ruc || null,
                    descripcion: formEditar.descripcion,
                    imagen: formEditar.imagen || null
                })

            })
            if (res.ok) { await cargarCampanas(); setModalEditar(false); setCampanaEditando(null) }
            else { const err = await res.json(); alert('Error: ' + (err.error || 'No se pudo editar')) }
        } catch { alert('Error al conectar') }
        finally { setGuardando(false) }
    }

    const handleEliminar = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar esta campaña?')) return
        try {
            const res = await fetch(API + '/api/campanas/' + id, { method: 'DELETE' })
            if (res.ok) await cargarCampanas()
            else alert('Error al eliminar')
        } catch { alert('Error al conectar') }
    }


    const cerrarModal = () => {
    setModalNuevaCampana(false); setDatosRuc(null); setErrorRuc('')
    setNuevaCampana({ nombre: '', zona: '', lugar: '', fecha_inicio: '', fecha_fin: '', hora_inicio: '', hora_fin: '', tipo_vacuna: '', tipo_vacuna_otro: '', ruc: '', descripcion: '', imagen: null, imagenPreview: null, ubicacionVerificada: false })
    }

    const formatearFecha = (fecha) => {
        if (!fecha) return 'Fecha no definida'
        return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    const obtenerEstado = (fecha_inicio, fecha_fin) => {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
        const inicio = new Date(fecha_inicio); inicio.setHours(0, 0, 0, 0)
        const fin = new Date(fecha_fin); fin.setHours(0, 0, 0, 0)
        if (hoy < inicio) return "Próximamente"
        if (hoy >= inicio && hoy <= fin) return "En curso"
        return "Finalizada"
    }

    const esDueno = (c) => usuarioDb && c.usuario_id === usuarioDb.id

    const todasActivas = campanas.filter(c => !c.archivada &&
        (c.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
            c.zona?.toLowerCase().includes(filtroTexto.toLowerCase())))

    const todasArchivadas = campanas.filter(c => c.archivada &&
        (c.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
            c.zona?.toLowerCase().includes(filtroTexto.toLowerCase())))

    const misCampanas = campanas.filter(c => esDueno(c) &&
        (c.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
            c.zona?.toLowerCase().includes(filtroTexto.toLowerCase())))

    const inputSty = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid ' + paleta.borde, fontSize: 13, outline: 'none', boxSizing: 'border-box' }

    const TikTokLikeButton = ({ campanaId, likes, archivada }) => {
        const yaDioLike = likesUsuario.has(campanaId)
        const animando = animandoLike === campanaId
        return (
            <button onClick={() => !archivada && handleLike(campanaId)} disabled={archivada}
                className={'flex items-center gap-1 px-3 py-1.5 rounded-full transition-all duration-200 ' + (archivada ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 active:scale-95') + (animando ? ' scale-125' : '')}
                style={{ backgroundColor: yaDioLike ? 'rgba(221,102,0,0.1)' : paleta.fondoGeneral, border: '1px solid ' + (yaDioLike ? paleta.primario : '#e2d3be') }}>
                <span className={'text-lg ' + (animando ? 'animate-bounce' : '')}>{yaDioLike ? '❤️' : '🤍'}</span>
                <span className="text-sm font-bold" style={{ color: yaDioLike ? paleta.primario : paleta.textoSecundario }}>{likes || 0}</span>
            </button>
        )
    }

    const TarjetaCampana = ({ c, mostrarAcciones = false }) => {
        const estado = obtenerEstado(c.fecha_inicio, c.fecha_fin)
        const esMia = esDueno(c)
        return (
            <div className="rounded-xl overflow-hidden shadow-md border flex flex-col transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: paleta.tarjetaBlanca, borderColor: esMia ? paleta.primario : paleta.borde, borderWidth: esMia ? 2 : 1 }}>
                <div className="w-full h-44 bg-gray-100 cursor-pointer overflow-hidden flex items-center justify-center relative group"
                    onClick={() => c.imagen && (setImagenSeleccionada(c.imagen), setModalImagen(true))}>
                    {c.imagen ? (
                        <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                        <span className="text-gray-400 text-sm">Sin imagen</span>
                    )}
                    {esMia && !mostrarAcciones && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-black text-white" style={{ backgroundColor: paleta.primario }}>
                            Mi campaña
                        </div>
                    )}
                </div>
                <div className="p-3 flex-1">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-black text-md flex-1" style={{ color: paleta.textoPrincipal }}>{c.nombre}</h3>
                        <TikTokLikeButton campanaId={c.id} likes={c.likes} archivada={c.archivada || estado === 'Finalizada'} />
                    </div>
                    {c.razon_social && <div className="text-xs mt-1 font-semibold" style={{ color: paleta.exito }}>🏢 {c.razon_social}</div>}
                    <div className="text-xs mt-2" style={{ color: paleta.textoSecundario }}>📍 Ciudad: {c.zona}</div>
                    <div className="text-xs mt-1" style={{ color: paleta.textoSecundario }}>🏠 Ubicación: {c.lugar}</div>
                    <div className="text-xs mt-1" style={{ color: paleta.textoSecundario }}>
                        📅 Del {formatearFecha(c.fecha_inicio)} al {formatearFecha(c.fecha_fin)}
                    </div>
                    {c.descripcion && (
                        <div className="text-xs mt-2 p-2 rounded-lg" style={{ backgroundColor: paleta.fondoGeneral, color: paleta.textoSecundario }}>
                            📝 {c.descripcion}
                        </div>
                    )}
                    <div className="text-xs font-semibold mt-2" style={{ color: estado === 'En curso' ? paleta.exito : estado === 'Próximamente' ? paleta.warning : '#999' }}>
                        {estado === 'En curso' && '🟢 En curso'}
                        {estado === 'Próximamente' && '🟡 Próximamente'}
                        {estado === 'Finalizada' && '⚫ Finalizada'}
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: paleta.fondoGeneral, color: paleta.borde }}>
                            RUC: {c.ruc}
                        </span>
                        <button onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.lugar + ', ' + c.zona), '_blank')}
                            className="text-xs font-bold px-3 py-1 rounded-lg hover:opacity-80"
                            style={{ backgroundColor: paleta.fondoGeneral, color: paleta.mapa }}>
                            🗺️ Como llegar
                        </button>
                    </div>
                    {mostrarAcciones && (
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => abrirEditar(c)}
                                className="flex-1 py-1.5 rounded-lg text-xs font-black hover:opacity-80"
                                style={{ backgroundColor: paleta.borde, color: 'white' }}>
                                ✏️ Editar
                            </button>
                            <button onClick={() => handleEliminar(c.id)}
                                className="flex-1 py-1.5 rounded-lg text-xs font-black hover:opacity-80"
                                style={{ backgroundColor: '#c62828', color: 'white' }}>
                                🗑️ Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative"
            style={{ paddingBottom: 80, backgroundImage: "url('/fono.png')", backgroundSize: "contain", backgroundPosition: "center", backgroundAttachment: "fixed", backgroundColor: paleta.fondoGeneral }}>
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]"></div>
        <FondoAnimado />

            <div className="relative z-10 max-w-5xl mx-auto p-5 flex flex-col" style={{ minHeight: '100vh' }}>
            
                {/* Pestañas */}
                <div className="campanas-topbar flex gap-3 mb-5">
                    <button onClick={() => setPestana('campanas')}
                        className="px-6 py-2.5 rounded-xl font-black text-sm transition-all"
                        style={{ backgroundColor: pestana === 'campanas' ? paleta.primario : paleta.tarjetaBlanca, color: pestana === 'campanas' ? 'white' : paleta.textoPrincipal, border: '2px solid ' + paleta.primario }}>
                        🐾 Campañas
                    </button>
                    <button onClick={() => setPestana('mis')}
                        className="px-6 py-2.5 rounded-xl font-black text-sm transition-all"
                        style={{ backgroundColor: pestana === 'mis' ? paleta.primario : paleta.tarjetaBlanca, color: pestana === 'mis' ? 'white' : paleta.textoPrincipal, border: '2px solid ' + paleta.primario }}>
                        📋 Mis campañas {usuarioDb && '(' + misCampanas.length + ')'}
                    </button>

                    {/* Buscador */}
                    <input type="text" placeholder="Buscar..."
                        value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl border bg-white text-sm focus:outline-none"
                        style={{ borderColor: paleta.borde }} />

                    {/* Archivadas solo en pestaña campañas */}
                    {pestana === 'campanas' && (

                        <div style={{ position: 'relative' }} className="group">
                            <button onClick={() => setMostrarArchivadas(!mostrarArchivadas)}
                                className="px-4 rounded-xl text-sm font-black"
                                style={{ backgroundColor: mostrarArchivadas ? paleta.primario : paleta.fondoGeneral, color: mostrarArchivadas ? 'white' : paleta.textoPrincipal, height: '100%', minHeight: 42 }}>
                                {mostrarArchivadas ? '📂 Activas' : '📁 Archivadas'}
                            </button>
                            {!mostrarArchivadas && (
                                <div className="group-hover:block hidden" style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                                    background: '#003F5A', color: 'white', borderRadius: 10,
                                    padding: '8px 12px', fontSize: 12, fontWeight: 600,
                                    maxWidth: 200, lineHeight: 1.5, zIndex: 999,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                    whiteSpace: 'normal'
                                }}>
                                    Aquí encontrarás campañas pasadas que ya finalizaron
                                    <div style={{
                                        position: 'absolute', top: -6, right: 16,
                                        width: 0, height: 0,
                                        borderLeft: '6px solid transparent',
                                        borderRight: '6px solid transparent',
                                        borderBottom: '6px solid #003F5A'
                                    }}/>
                                </div>
                            )}
                        </div>




                    )}
                </div>

                {/* ── PESTAÑA CAMPAÑAS ── */}
                {pestana === 'campanas' && (
                    <>
                        {/* Estadísticas */}
                        <div className="rounded-2xl p-3 mb-4 shadow-md border" style={{ backgroundColor: paleta.tarjetaBlanca, borderColor: paleta.borde }}>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <div className="text-xl font-black" style={{ color: paleta.primario }}>{campanas.length}</div>
                                    <div className="text-xs" style={{ color: paleta.textoSecundario }}>Total</div>
                                </div>
                                <div>
                                    <div className="text-xl font-black" style={{ color: paleta.exito }}>{campanas.filter(c => !c.archivada).length}</div>
                                    <div className="text-xs" style={{ color: paleta.textoSecundario }}>Activas</div>
                                </div>
                                <div>
                                    <div className="text-xl font-black" style={{ color: paleta.info }}>{campanas.filter(c => c.archivada).length}</div>
                                    <div className="text-xs" style={{ color: paleta.textoSecundario }}>Archivadas</div>
                                </div>
                            </div>
                        </div>

                        {cargando ? (
                            <div className="text-center py-8" style={{ color: paleta.textoSecundario }}>Cargando campañas...</div>
                        ) : (mostrarArchivadas ? todasArchivadas : todasActivas).length === 0 ? (
                            <div className="text-center py-8" style={{ color: paleta.textoSecundario }}>
                                {mostrarArchivadas ? 'No hay campañas archivadas' : 'No hay campañas activas'}
                            </div>
                        ) : (
                            <div className="campanas-grid grid grid-cols-1 md:grid-cols-2 gap-5 pb-5">
                                {(mostrarArchivadas ? todasArchivadas : todasActivas).map(c => (
                                    <TarjetaCampana key={c.id} c={c} mostrarAcciones={false} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── PESTAÑA MIS CAMPAÑAS ── */}


                {pestana === 'mis' && (
                    <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
                        {!usuarioDb ? (
                            <div className="text-center py-8" style={{ color: paleta.textoSecundario }}>
                                Inicia sesión para ver tus campañas
                            </div>
                        ) : misCampanas.length === 0 ? (
                            <div className="text-center py-8" style={{ color: paleta.textoSecundario }}>
                                Aún no has publicado ninguna campaña
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-4">
                                {misCampanas.map(c => (
                                    <TarjetaCampana key={c.id} c={c} mostrarAcciones={true} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Botón fijo nueva campaña — solo en pestaña mis */}
                {pestana === 'mis' && (
                    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px', background: 'rgba(234,217,199,0.95)', backdropFilter: 'blur(8px)', zIndex: 100, borderTop: '1px solid #e2d3be' }}>
                        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
                            <button onClick={() => {
                                if (!usuarioDb) {
                                    setMensajePerrito('🐾 ¡Woof! Para publicar una campaña primero debes iniciar sesión. ¡Únete a la comunidad PAW FINDER!! 🐶')
                                    setMostrarPerrito(true)
                                    setTimeout(() => setMostrarPerrito(false), 7000)
                                } else {
                                    setModalNuevaCampana(true)
                                }
                            }}
                                className="w-full py-3 rounded-xl text-sm font-black transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                style={{ backgroundColor: paleta.primario, color: "white" }}>
                                + Nueva campaña
                            </button>
                        </div>
                    </div>
                )}






            </div>

            {/* Modal imagen */}
            {modalImagen && imagenSeleccionada && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(14,62,70,0.85)", backdropFilter: "blur(4px)" }} onClick={() => setModalImagen(false)}>
                    <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                        <img src={imagenSeleccionada} alt="Vista completa" className="max-w-full max-h-screen object-contain rounded-lg" />
                        <button onClick={() => setModalImagen(false)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 text-xl">✕</button>
                    </div>
                </div>
            )}

            {/* Modal nueva campaña */}
            {modalNuevaCampana && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: "rgba(14,62,70,0.6)", backdropFilter: "blur(4px)" }}
                    onClick={(e) => e.target === e.currentTarget && cerrarModal()}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 overflow-y-auto"
                        style={{ border: "1.5px solid " + paleta.borde, maxHeight: "90vh" }}>
                        <h3 className="font-black text-lg mb-4" style={{ color: paleta.primario }}>Nueva Campaña</h3>




                        <div className="space-y-3">
                            {/* Nombre */}
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Nombre de la campaña *</label>
                                <input type="text" value={nuevaCampana.nombre}
                                    onChange={(e) => setNuevaCampana(p => ({ ...p, nombre: e.target.value }))} style={inputSty} placeholder="Ej: Vacunatón Puno 2026" />
                            </div>

                            {/* Tipo de vacuna */}
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Tipo de campaña *</label>
                                <select value={nuevaCampana.tipo_vacuna || ''}
                                    onChange={(e) => setNuevaCampana(p => ({ ...p, tipo_vacuna: e.target.value }))}
                                    style={inputSty}>
                                    <option value="">— Selecciona una opción —</option>
                                    <option value="Rabia">💉 Rabia</option>
                                    <option value="Esterilización">✂️ Esterilización</option>
                                    <option value="Desparasitación">🐛 Desparasitación</option>
                                    <option value="Vacunación general">🩺 Vacunación general</option>
                                    <option value="Otros">✏️ Otros</option>
                                </select>
                                {nuevaCampana.tipo_vacuna === 'Otros' && (
                                    <input type="text" placeholder="Describe el tipo de campaña..."
                                        value={nuevaCampana.tipo_vacuna_otro || ''}
                                        onChange={(e) => setNuevaCampana(p => ({ ...p, tipo_vacuna_otro: e.target.value }))}
                                        style={{ ...inputSty, marginTop: 6 }} />
                                )}
                            </div>

                            {/* Ciudad */}
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Ciudad *</label>
                                <input type="text" value={nuevaCampana.zona}
                                    onChange={(e) => setNuevaCampana(p => ({ ...p, zona: e.target.value }))}
                                    style={inputSty} placeholder="Ej: Puno, Juliaca" />
                            </div>

                            {/* Ubicación con verificación */}
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Ubicación *</label>
                                <div className="flex gap-2">
                                    <input type="text" value={nuevaCampana.lugar}
                                        onChange={(e) => setNuevaCampana(p => ({ ...p, lugar: e.target.value, ubicacionVerificada: false }))}
                                        style={{ ...inputSty, flex: 1 }} placeholder="Ej: Jr. Los Incas 123, Plaza Mayor" />



                                    <button onClick={async () => {
                                        if (!nuevaCampana.lugar) return
                                        try {
                                            const ciudad = nuevaCampana.zona || 'Puno'
                                            // Intentar varias combinaciones
                                            const intentos = [
                                                nuevaCampana.lugar + ', ' + ciudad + ', Peru',
                                                nuevaCampana.lugar + ', ' + ciudad,
                                                nuevaCampana.lugar + ', Peru',
                                                nuevaCampana.lugar
                                            ]
                                            let encontrado = false
                                            for (var ii = 0; ii < intentos.length; ii++) {
                                                var q = encodeURIComponent(intentos[ii])
                                                var res2 = await fetch('https://nominatim.openstreetmap.org/search?q=' + q + '&format=json&limit=1&countrycodes=pe')
                                                var data = await res2.json()
                                                if (data.length > 0) {    
                                                    encontrado = true
                                                    break
                                                }
                                            }
                                            if (encontrado) {
                                                setNuevaCampana(p => ({ ...p, ubicacionVerificada: true }))
                                            } else {
                                                setNuevaCampana(p => ({ ...p, ubicacionVerificada: false }))
                                                alert('No se encontró esa dirección en Perú. Prueba escribir solo el nombre de la calle sin "Jr." o el número.')
                                            }
                                        } catch { alert('Error al verificar dirección') }
                                    }}
                                    
                                        className="px-3 py-2 rounded-lg text-xs font-black"
                                        style={{ backgroundColor: nuevaCampana.ubicacionVerificada ? paleta.exito : paleta.borde, color: 'white', whiteSpace: 'nowrap' }}>
                                        {nuevaCampana.ubicacionVerificada ? '✓ Verificada' : 'Verificar'}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!navigator.geolocation) { alert('Tu navegador no soporta geolocalización'); return }
                                        navigator.geolocation.getCurrentPosition(
                                            function(pos) {
                                                var lat = pos.coords.latitude
                                                var lng = pos.coords.longitude
                                                fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&accept-language=es')
                                                    .then(function(r) { return r.json() })
                                                    .then(function(d) {
                                                        var a = d.address || {}
                                                        var partes = [a.road, a.suburb, a.city_district].filter(Boolean)
                                                        var nombre = partes.length > 0 ? partes.join(', ') : d.display_name.split(',')[0]
                                                        setNuevaCampana(function(p) { return Object.assign({}, p, { lugar: nombre, ubicacionVerificada: true }) })
                                                    })
                                                    .catch(function() { alert('No se pudo obtener el nombre de la calle') })
                                            },
                                            function() { alert('No se pudo obtener tu ubicación. Verifica los permisos.') },
                                            { enableHighAccuracy: true, timeout: 10000 }
                                        )
                                    }}
                                    className="mt-2 w-full py-1.5 rounded-lg text-xs font-black"
                                    style={{ backgroundColor: '#E0F2F2', color: paleta.exito, border: '1.5px solid ' + paleta.exito }}>
                                    📡 Usar mi ubicación actual
                                </button>
                                {nuevaCampana.ubicacionVerificada && (
                                    <div className="text-xs mt-1 font-semibold" style={{ color: paleta.exito }}>✓ Dirección encontrada correctamente</div>
                                )}
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Fecha inicio *</label>
                                    <input type="date" value={nuevaCampana.fecha_inicio}
                                        onChange={(e) => setNuevaCampana(p => ({ ...p, fecha_inicio: e.target.value }))} style={inputSty} />
                                </div>
                                <div>
                                    <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Fecha fin *</label>
                                    <input type="date" value={nuevaCampana.fecha_fin}
                                        onChange={(e) => setNuevaCampana(p => ({ ...p, fecha_fin: e.target.value }))} style={inputSty} />
                                </div>
                            </div>

                            {/* Horas */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Hora inicio</label>
                                    <input type="time" value={nuevaCampana.hora_inicio || ''}
                                        onChange={(e) => setNuevaCampana(p => ({ ...p, hora_inicio: e.target.value }))} style={inputSty} />
                                </div>
                                <div>
                                    <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Hora fin</label>
                                    <input type="time" value={nuevaCampana.hora_fin || ''}
                                        onChange={(e) => setNuevaCampana(p => ({ ...p, hora_fin: e.target.value }))} style={inputSty} />
                                </div>
                            </div>

                            {/* RUC opcional */}
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>
                                    RUC <span style={{ color: paleta.textoSecundario, fontWeight: 400 }}>(opcional)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input type="text" value={nuevaCampana.ruc}
                                        onChange={(e) => { setNuevaCampana(p => ({ ...p, ruc: e.target.value })); setDatosRuc(null); setErrorRuc('') }}
                                        maxLength="11" placeholder="Ej: 20131312955" style={{ ...inputSty, flex: 1 }} />
                                    <button onClick={verificarRuc} disabled={verificandoRuc || nuevaCampana.ruc.length !== 11}
                                        className="px-3 py-2 rounded-lg text-xs font-black"
                                        style={{ backgroundColor: paleta.primario, color: 'white', opacity: (verificandoRuc || nuevaCampana.ruc.length !== 11) ? 0.5 : 1 }}>
                                        {verificandoRuc ? 'Buscando...' : 'Verificar'}
                                    </button>
                                </div>
                                {errorRuc && <div className="text-xs mt-1 font-semibold" style={{ color: '#cc0000' }}>⚠ {errorRuc}</div>}
                                {datosRuc && (
                                    <div className="mt-2 p-2 rounded-lg text-xs" style={{ backgroundColor: '#e6f7f7', borderLeft: '3px solid ' + paleta.exito }}>
                                        <div className="font-black" style={{ color: paleta.exito }}>✓ RUC válido</div>
                                        <div style={{ color: paleta.textoPrincipal }}>{datosRuc.razonSocial}</div>
                                        <div style={{ color: paleta.textoSecundario }}>{datosRuc.distrito}, {datosRuc.provincia}</div>
                                    </div>
                                )}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Descripción</label>
                                <textarea value={nuevaCampana.descripcion}
                                    onChange={(e) => setNuevaCampana(p => ({ ...p, descripcion: e.target.value }))}
                                    rows="2" style={inputSty} placeholder="Describe la campaña..."></textarea>
                            </div>

                            {/* Imagen */}
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Imagen referencial</label>
                                <input type="file" accept="image/*" onChange={(e) => handleImagenChange(e, false)} style={inputSty} />
                                {comprimiendo && <div className="text-xs mt-1 text-gray-500">Comprimiendo imagen...</div>}
                                {nuevaCampana.imagenPreview && !comprimiendo && (
                                    <img src={nuevaCampana.imagenPreview} alt="prev" className="h-20 rounded-lg object-cover mt-2" />
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={handleAgregarCampana} disabled={guardando}
                                className="flex-1 py-2 rounded-xl text-sm font-black"
                                style={{ backgroundColor: paleta.primario, color: "white", opacity: guardando ? 0.6 : 1 }}>
                                {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button onClick={cerrarModal} className="flex-1 py-2 rounded-xl text-sm font-black"
                                style={{ backgroundColor: paleta.fondoGeneral, color: paleta.primario }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal editar */}
            {modalEditar && campanaEditando && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: "rgba(14,62,70,0.6)", backdropFilter: "blur(4px)" }}
                    onClick={(e) => e.target === e.currentTarget && setModalEditar(false)}>
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 overflow-y-auto max-h-[90vh]"
                        style={{ border: '1.5px solid ' + paleta.borde }}>
                        <h3 className="font-black text-lg mb-4" style={{ color: paleta.primario }}>Editar Campaña</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Nombre de la campaña *</label>
                                <input type="text" value={formEditar.nombre}
                                    onChange={(e) => setFormEditar(p => ({ ...p, nombre: e.target.value }))} style={inputSty} />
                            </div>
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Tipo de campaña *</label>
                                <select value={formEditar.tipo_vacuna || ''}
                                    onChange={(e) => setFormEditar(p => ({ ...p, tipo_vacuna: e.target.value }))}
                                    style={inputSty}>
                                    <option value="">— Selecciona una opción —</option>
                                    <option value="Rabia">💉 Rabia</option>
                                    <option value="Esterilización">✂️ Esterilización</option>
                                    <option value="Desparasitación">🐛 Desparasitación</option>
                                    <option value="Vacunación general">🩺 Vacunación general</option>
                                    <option value="Otros">✏️ Otros</option>
                                </select>
                                {formEditar.tipo_vacuna === 'Otros' && (
                                    <input type="text" placeholder="Describe el tipo de campaña..."
                                        value={formEditar.tipo_vacuna_otro || ''}
                                        onChange={(e) => setFormEditar(p => ({ ...p, tipo_vacuna_otro: e.target.value }))}
                                        style={{ ...inputSty, marginTop: 6 }} />
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Ciudad *</label>
                                <input type="text" value={formEditar.zona}
                                    onChange={(e) => setFormEditar(p => ({ ...p, zona: e.target.value }))}
                                    style={inputSty} placeholder="Ej: Puno, Juliaca" />
                            </div>
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Ubicación *</label>
                                <input type="text" value={formEditar.lugar}
                                    onChange={(e) => setFormEditar(p => ({ ...p, lugar: e.target.value }))}
                                    style={inputSty} placeholder="Ej: Jr. Los Incas 123, Plaza Mayor" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Fecha inicio *</label>
                                    <input type="date" value={formEditar.fecha_inicio}
                                        onChange={(e) => setFormEditar(p => ({ ...p, fecha_inicio: e.target.value }))} style={inputSty} />
                                </div>
                                <div>
                                    <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Fecha fin *</label>
                                    <input type="date" value={formEditar.fecha_fin}
                                        onChange={(e) => setFormEditar(p => ({ ...p, fecha_fin: e.target.value }))} style={inputSty} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Hora inicio</label>
                                    <input type="time" value={formEditar.hora_inicio || ''}
                                        onChange={(e) => setFormEditar(p => ({ ...p, hora_inicio: e.target.value }))} style={inputSty} />
                                </div>
                                <div>
                                    <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Hora fin</label>
                                    <input type="time" value={formEditar.hora_fin || ''}
                                        onChange={(e) => setFormEditar(p => ({ ...p, hora_fin: e.target.value }))} style={inputSty} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>
                                    RUC <span style={{ color: paleta.textoSecundario, fontWeight: 400 }}>(opcional)</span>
                                </label>
                                <input type="text" value={formEditar.ruc || ''}
                                    onChange={(e) => setFormEditar(p => ({ ...p, ruc: e.target.value }))}
                                    maxLength="11" placeholder="Ej: 20131312955" style={inputSty} />
                            </div>
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Descripción</label>
                                <textarea value={formEditar.descripcion}
                                    onChange={(e) => setFormEditar(p => ({ ...p, descripcion: e.target.value }))}
                                    rows="2" style={inputSty}></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-black block mb-1" style={{ color: paleta.primario }}>Imagen</label>
                                {formEditar.imagenPreview && (
                                    <img src={formEditar.imagenPreview} alt="actual" className="h-20 rounded-lg object-cover mb-2" />
                                )}
                                <input type="file" accept="image/*" onChange={(e) => handleImagenChange(e, true)} style={inputSty} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={handleGuardarEdicion} disabled={guardando}
                                className="flex-1 py-2 rounded-xl text-sm font-black"
                                style={{ backgroundColor: paleta.primario, color: "white", opacity: guardando ? 0.6 : 1 }}>
                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                            <button onClick={() => setModalEditar(false)} className="flex-1 py-2 rounded-xl text-sm font-black"
                                style={{ backgroundColor: paleta.fondoGeneral, color: paleta.primario }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html:
                '@keyframes bounceHeart{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}' +
                '.animate-bounce{animation:bounceHeart 0.3s ease-in-out}' +
                '@keyframes aparecer{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}' +
                '@keyframes saltar{from{transform:translateY(0)}to{transform:translateY(-10px)}}'
            }} />


            {/* Perrito mensajero */}
            {mostrarPerrito && (
                <div style={{
                    position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px 16px 4px 16px',
                        padding: '14px 18px', maxWidth: 260, fontSize: 13, fontWeight: 700,
                        color: '#003F5A', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        border: '2px solid #DD6600', animation: 'aparecer 0.3s ease',
                        lineHeight: 1.5
                    }}>
                        🐾 ¡Woof! Para publicar una campaña primero debes iniciar sesión. ¡Únete a la comunidad PAW FINDER!! 🐶
                    </div>
                    <img src="/perrito.png" alt="perrito"
                        style={{ width: 140, height: 140, objectFit: 'contain', animation: 'saltar 0.6s ease infinite alternate' }} />
                </div>
            )}


        </div>
    )
}