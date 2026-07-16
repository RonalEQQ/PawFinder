import { useState, useEffect } from 'react'
import { auth } from '../firebase/firebaseConfig'
import FondoAnimado from '../components/FondoAnimado'

const API = import.meta.env.VITE_API_URL

const p = {
    primario: "#DD6600", fondo: "#F2EDE3", blanco: "#FFFFFF",
    borde: "#007A7B", texto: "#003F5A", textoSub: "#6b5b3e",
    exito: "#007A7B", peligro: "#c62828", warn: "#f59e0b"
}

const RAZAS_PERRO = ['Mestizo', 'Golden Retriever', 'Schnauzer', 'Labrador', 'Beagle', 'Shih Tzu', 'Pitbull', 'Otro']
const RAZAS_GATO = ['Mestizo', 'Siamés', 'Persa', 'Maine Coon', 'Angora', 'Otro']
const RAZAS_CONEJO = ['Mestizo', 'Enano', 'Angora', 'Belier', 'Rex', 'Otro']
const EDADES = ['Cachorro (0-6 meses)', 'Joven (6 meses-2 años)', 'Adulto (2-7 años)', 'Senior (7+ años)']
const SALUD_OPTS = ['Vacunado', 'Desparasitado', 'Esterilizado', 'Necesita atención veterinaria']
const estadoBadge = (estado, urgente) => {
    if (urgente) return { label: '🔴 URGENTE', bg: '#c62828', color: 'white' }
    if (estado === 'adoptado') return { label: '✅ ADOPTADO', bg: '#888', color: 'white' }
    return { label: '🟢 DISPONIBLE', bg: '#007A7B', color: 'white' }
}

export default function Adopciones() {
    const [adopciones, setAdopciones] = useState([])
    const [usuarioDb, setUsuarioDb] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [pestana, setPestana] = useState('todas')
    const [modalVer, setModalVer] = useState(null)
    const [modalForm, setModalForm] = useState(false)
    const [editando, setEditando] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [fotoIdx, setFotoIdx] = useState(0)
    const [filtroEspecie, setFiltroEspecie] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [mostrarPerrito, setMostrarPerrito] = useState(false)
    const [imagenAmpliada, setImagenAmpliada] = useState(null)

    const [comprimiendo, setComprimiendo] = useState(false)

    const [form, setForm] = useState({
        especie: '', raza: '', edad: '', tamanio: '',
        machos: 0, hembras: 0, tienesMachos: false, tienesHembras: false,
        ciudad: '', whatsapp: '', salud: [], historia: '', urgente: false, fotos: []
    })

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const res = await fetch(`${API}/api/auth/usuario/${user.uid}`)
                    if (res.ok) setUsuarioDb(await res.json())
                } catch (e) { console.error(e) }
            } else { setUsuarioDb(null) }
        })
        return () => unsub()
    }, [])

    const cargar = async () => {
        setCargando(true)
        try {
            const res = await fetch(`${API}/api/adopciones`)
            const data = await res.json()
            if (res.ok) setAdopciones(Array.isArray(data) ? data : [])
        } catch (e) { console.error(e) }
        finally { setCargando(false) }
    }

    useEffect(() => { cargar() }, [])

    const resetForm = () => setForm({
        especie: '', raza: '', razaOtro: '', edad: '', tamanio: '',
        machos: 0, hembras: 0, tienesMachos: false, tienesHembras: false,
        ciudad: '', whatsapp: '', salud: [], historia: '', urgente: false, fotos: []
    })


    const abrirNuevo = () => {
        if (!usuarioDb) { window.location.href = '/login'; return }
        resetForm(); setEditando(null); setModalForm(true)
    }

    const abrirEditar = (a) => {
        setEditando(a)
        setForm({
            especie: a.especie, raza: a.raza, edad: a.edad, tamanio: a.tamanio,
            machos: a.machos, hembras: a.hembras,
            tienesMachos: a.machos > 0, tienesHembras: a.hembras > 0,
            ciudad: a.ciudad, whatsapp: a.whatsapp,
            salud: a.salud || [], historia: a.historia || '',
            urgente: a.urgente, fotos: a.fotos || [], estado: a.estado
        })
        setModalForm(true)
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

    const handleFotos = (e) => {
        const files = Array.from(e.target.files).slice(0, 5 - form.fotos.length)
        setComprimiendo(true)
        let pendientes = files.length
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) { alert(`La foto "${file.name}" supera 5MB`); pendientes--; if (!pendientes) setComprimiendo(false); return }
            const reader = new FileReader()
            reader.onloadend = async () => {
                try {
                    const comprimida = await comprimirImagen(reader.result)
                    setForm(prev => {
                        if (prev.fotos.length >= 5) return prev
                        return { ...prev, fotos: [...prev.fotos, comprimida] }
                    })
                } finally {
                    pendientes--
                    if (!pendientes) setComprimiendo(false)
                }
            }
            reader.readAsDataURL(file)
        })
        if (!files.length) setComprimiendo(false)
    }

    const guardar = async () => {
        if (!form.especie || !form.raza || !form.edad || !form.tamanio || !form.ciudad || !form.whatsapp) {
            alert('Complete todos los campos obligatorios'); return
        }
        if (form.fotos.length === 0) { alert('Sube al menos 1 foto'); return }
        if (!form.tienesMachos && !form.tienesHembras) { alert('Indica el sexo de la mascota'); return }

        setGuardando(true)
        const body = {
            usuario_id: usuarioDb?.id || null,
            especie: form.especie, raza: form.raza === 'Otro' ? (form.razaOtro || 'Otro') : form.raza, edad: form.edad,
            tamanio: form.tamanio,
            machos: form.tienesMachos ? form.machos : 0,
            hembras: form.tienesHembras ? form.hembras : 0,
            ciudad: form.ciudad, whatsapp: form.whatsapp,
            salud: form.salud, historia: form.historia || null,
            urgente: form.urgente, fotos: form.fotos,
            estado: form.estado || 'disponible'
        }
        try {
            const url = editando ? `${API}/api/adopciones/${editando.id}` : `${API}/api/adopciones`
            const method = editando ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            if (res.ok) { await cargar(); setModalForm(false); resetForm(); setEditando(null) }
            else alert('Error al guardar')
        } catch { alert('Error al conectar') }
        finally { setGuardando(false) }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar esta publicación?')) return
        await fetch(`${API}/api/adopciones/${id}`, { method: 'DELETE' })
        cargar()
    }

    const cambiarEstado = async (a, nuevoEstado) => {
        await fetch(`${API}/api/adopciones/${a.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...a, fotos: a.fotos, estado: nuevoEstado })
        })
        cargar()
    }

    const whatsappUrl = (numero, raza) => {
        const n = numero.replace(/\D/g, '')
        const full = n.startsWith('51') ? n : `51${n}`
        const msg = encodeURIComponent(`Hola, vi tu publicación en PAW FINDER y estoy interesado/a en adoptar 🐾 (${raza})`)
        return `https://wa.me/${full}?text=${msg}`
    }

    const esMio = (a) => usuarioDb && a.usuario_id === usuarioDb.id

    const razas = form.especie === 'Perro' ? RAZAS_PERRO : form.especie === 'Gato' ? RAZAS_GATO : form.especie === 'Conejo' ? RAZAS_CONEJO : ['Otro']


    const todasFiltradas = adopciones.filter(a => {
        if (filtroEspecie && a.especie !== filtroEspecie) return false
        if (filtroEstado && a.estado !== filtroEstado) return false
        return true
    })

    const misPublicaciones = adopciones.filter(a => esMio(a))

    const inputSty = { width: '100%', padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${p.borde}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'white' }
    const btnEsp = (val) => ({
        padding: '8px 16px', borderRadius: 20, fontWeight: 800, fontSize: 13, cursor: 'pointer', border: `2px solid ${p.borde}`,
        background: form.especie === val ? p.borde : 'white', color: form.especie === val ? 'white' : p.texto
    })
    const btnTam = (val) => ({
        flex: 1, padding: '8px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer', border: `2px solid ${p.borde}`,
        background: form.tamanio === val ? p.borde : 'white', color: form.tamanio === val ? 'white' : p.texto
    })

    return (
        <div style={{ minHeight: '100vh', background: p.fondo, position: 'relative', paddingBottom: 80 }}>
      <style>{`
        @media (max-width: 900px) { .adopciones-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 480px) { .adopciones-grid { grid-template-columns: 1fr !important; } }
      `}</style>
            <FondoAnimado />

            {/* Banner adopta no compres */}
            <div style={{ background: '#007A7B', padding: '16px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>🐾</span>
                <div>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>ADOPTA, NO COMPRES</div>
                    <div style={{ color: '#b2dfdb', fontWeight: 600, fontSize: 12 }}>Dale una segunda oportunidad a quien más lo necesita ❤️</div>
                </div>
                <span style={{ fontSize: 28 }}>🐶</span>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, paddingBottom: pestana === 'mis' ? 90 : 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontWeight: 900, fontSize: 26, color: p.texto, margin: 0 }}>Adopciones 🐾</h1>
                        <p style={{ fontSize: 13, color: p.textoSub, margin: '4px 0 0' }}>Encuentra a tu compañero perfecto</p>
                    </div>

                </div>

                {/* Pestañas */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setPestana('todas')} style={{ padding: '8px 18px', borderRadius: 20, border: `2px solid ${p.primario}`, fontWeight: 900, fontSize: 13, cursor: 'pointer', background: pestana === 'todas' ? p.primario : 'white', color: pestana === 'todas' ? 'white' : p.texto }}>
                        🐾 Todas ({todasFiltradas.length})
                    </button>
                    <button onClick={() => setPestana('mis')} style={{ padding: '8px 18px', borderRadius: 20, border: `2px solid ${p.primario}`, fontWeight: 900, fontSize: 13, cursor: 'pointer', background: pestana === 'mis' ? p.primario : 'white', color: pestana === 'mis' ? 'white' : p.texto }}>
                        📋 Mis publicaciones {usuarioDb && `(${misPublicaciones.length})`}
                    </button>

                    {/* Filtros */}
                    <select value={filtroEspecie} onChange={e => setFiltroEspecie(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 20, border: `1.5px solid ${p.borde}`, fontSize: 13, cursor: 'pointer', outline: 'none' }}>
                        <option value="">Todas las especies</option>
                        <option value="Perro">🐶 Perros</option>
                        <option value="Gato">🐱 Gatos</option>
                        <option value="Otro">🐾 Otros</option>
                    </select>

                </div>

                {/* Grid */}
                {cargando ? (
                    <div style={{ textAlign: 'center', padding: 60, color: p.textoSub }}>Cargando...</div>
                ) : (
                    <div className='adopciones-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        {(pestana === 'todas' ? todasFiltradas : misPublicaciones).map(a => {
                            const badge = estadoBadge(a.estado, a.urgente)
                            const foto = a.fotos?.[0]
                            return (                           
                                <div key={a.id} style={{ borderRadius: 16, overflow: 'hidden', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: a.urgente ? `2px solid ${p.peligro}` : a.estado === 'adoptado' ? '2px solid #ccc' : `2px solid ${p.borde}`, opacity: a.estado === 'adoptado' ? 0.8 : 1 }}>
                                    {/* Foto */}

                                    <div style={{ position: 'relative', height: 200, background: '#f0ebe0', overflow: 'hidden', cursor: foto ? 'zoom-in' : 'default' }}
                                        onClick={() => foto && setImagenAmpliada(foto)}>

                                        {foto ? (
                                            <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                                onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                                        ) : (

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 48 }}>🐾</div>
                                        )}
                                        {/* Badge estado/urgente */}
                                        <div style={{ position: 'absolute', top: 8, left: 8, background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 900 }}>
                                            {badge.label}
                                        </div>
                                        {/* Badge adoptado sello */}
                                        {a.estado === 'adoptado' && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ background: 'white', borderRadius: 12, padding: '8px 16px', fontWeight: 900, fontSize: 14, color: p.exito }}>✅ ¡Adoptado!</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info básica */}
                                    <div style={{ padding: '10px 12px' }}>
                                        <div style={{ fontWeight: 900, fontSize: 13, color: p.texto }}>{a.especie} • {a.raza}</div>
                                        <div style={{ fontSize: 11, color: p.textoSub, marginTop: 2 }}>{a.edad} • {a.tamanio}</div>
                                        <div style={{ fontSize: 11, color: p.textoSub }}>📍 {a.ciudad}</div>

                                        {/* Botón adoptar */}
                                        <div style={{ position: 'relative' }} className="group">
                                            <button onClick={() => { setModalVer(a); setFotoIdx(0) }}
                                                style={{ width: '100%', marginTop: 10, padding: '9px', borderRadius: 10, background: a.estado === 'adoptado' ? '#888' : p.exito, color: 'white', border: 'none', fontWeight: 900, fontSize: 13, cursor: a.estado === 'adoptado' ? 'default' : 'pointer' }}>
                                                {a.estado === 'adoptado' ? '✅ Adoptado' : '🐾 Adoptar'}
                                            </button>
                                            {a.estado !== 'adoptado' && (
                                                <div className="group-hover:block hidden" style={{
                                                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    background: '#003F5A', color: 'white', borderRadius: 10,
                                                    padding: '8px 12px', fontSize: 11, fontWeight: 600,
                                                    whiteSpace: 'nowrap', zIndex: 999,
                                                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                                                }}>
                                                    🐾 Presiona para ver más detalles
                                                    <div style={{
                                                        position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                                                        width: 0, height: 0,
                                                        borderLeft: '6px solid transparent',
                                                        borderRight: '6px solid transparent',
                                                        borderTop: '6px solid #003F5A'
                                                    }}/>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botones dueño */}
                                        {pestana === 'mis' && esMio(a) && (
                                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                                <button onClick={() => abrirEditar(a)} style={{ flex: 1, padding: '6px', borderRadius: 8, background: p.borde, color: 'white', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>✏️ Editar</button>
                                                <button onClick={() => cambiarEstado(a, a.estado === 'disponible' ? 'adoptado' : 'disponible')}
                                                    style={{ flex: 1, padding: '6px', borderRadius: 8, background: a.estado === 'disponible' ? p.exito : p.warn, color: 'white', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                                                    {a.estado === 'disponible' ? '✅ Marcar adoptado' : '🔄 Disponible'}
                                                </button>
                                                <button onClick={() => eliminar(a.id)} style={{ padding: '6px 8px', borderRadius: 8, background: p.peligro, color: 'white', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {(pestana === 'todas' ? todasFiltradas : misPublicaciones).length === 0 && !cargando && (
                    <div style={{ textAlign: 'center', padding: 60, color: p.textoSub }}>
                        <div style={{ fontSize: 48, marginBottom: 10 }}>🐾</div>
                        <p style={{ fontWeight: 800 }}>{pestana === 'mis' ? 'Aún no tienes publicaciones' : 'No hay adopciones disponibles'}</p>
                    </div>
                )}
            </div>

            {/* Modal ver detalle */}
            {modalVer && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={() => setModalVer(null)}>
                    <div style={{ background: 'white', borderRadius: 20, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 28 }}
                        onClick={e => e.stopPropagation()}>

                        {/* Galería fotos */}
                        {modalVer.fotos?.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <img src={modalVer.fotos[fotoIdx]} alt="" style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 14 }} />
                              
                                {modalVer.fotos.length > 1 && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        {modalVer.fotos.map((f, i) => (
                                            <img key={i} src={f} alt="" onClick={() => setFotoIdx(i)}
                                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: fotoIdx === i ? `3px solid ${p.primario}` : '2px solid #e2d3be' }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                            {modalVer.urgente && <span style={{ background: p.peligro, color: 'white', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 900 }}>🔴 URGENTE</span>}
                            <span style={{ background: modalVer.estado === 'adoptado' ? '#888' : p.exito, color: 'white', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 900 }}>
                                {modalVer.estado === 'adoptado' ? '✅ ADOPTADO' : '🟢 DISPONIBLE'}
                            </span>
                        </div>

                        {/* Info */}
                        <h2 style={{ fontWeight: 900, fontSize: 20, color: p.texto, marginBottom: 12 }}>{modalVer.especie} — {modalVer.raza}</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                            <div style={{ background: '#f5f0e8', borderRadius: 10, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: p.primario }}>EDAD</div>
                                <div style={{ fontSize: 13, color: p.texto, fontWeight: 700 }}>{modalVer.edad}</div>
                            </div>
                            <div style={{ background: '#f5f0e8', borderRadius: 10, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: p.primario }}>TAMAÑO</div>
                                <div style={{ fontSize: 13, color: p.texto, fontWeight: 700 }}>{modalVer.tamanio}</div>
                            </div>
                            <div style={{ background: '#f5f0e8', borderRadius: 10, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: p.primario }}>CANTIDAD</div>
                                <div style={{ fontSize: 13, color: p.texto, fontWeight: 700 }}>
                                    {modalVer.machos > 0 && `${modalVer.machos} macho${modalVer.machos > 1 ? 's' : ''} `}
                                    {modalVer.hembras > 0 && `${modalVer.hembras} hembra${modalVer.hembras > 1 ? 's' : ''}`}
                                </div>
                            </div>
                            <div style={{ background: '#f5f0e8', borderRadius: 10, padding: '8px 12px' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: p.primario }}>CIUDAD</div>
                                <div style={{ fontSize: 13, color: p.texto, fontWeight: 700 }}>📍 {modalVer.ciudad}</div>
                            </div>
                        </div>

                        {/* Salud */}
                        {modalVer.salud?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: p.primario, marginBottom: 6 }}>SALUD</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {modalVer.salud.map(s => (
                                        <span key={s} style={{ background: '#e6f7f7', color: p.exito, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>✓ {s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Historia */}
                        {modalVer.historia && (
                            <div style={{ background: '#f5f0e8', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: p.primario, marginBottom: 4 }}>HISTORIA</div>
                                <p style={{ fontSize: 13, color: p.textoSub, margin: 0, lineHeight: 1.5 }}>{modalVer.historia}</p>
                            </div>
                        )}

                        {/* Botón WhatsApp */}
                        {modalVer.estado !== 'adoptado' && (
                            <a href={whatsappUrl(modalVer.whatsapp, modalVer.raza)} target="_blank" rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: 14, borderRadius: 14, background: '#25D366', color: 'white', fontWeight: 900, fontSize: 15, textDecoration: 'none', marginBottom: 10 }}>
                                <img src="/wts.png" alt="whatsapp" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                Chatear por WhatsApp
                            </a>
                        )}

                        <button onClick={() => setModalVer(null)} style={{ width: '100%', padding: 11, borderRadius: 12, background: '#f5f0e8', color: p.primario, border: 'none', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            {/* Modal formulario */}
            {modalForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={(e) => e.target === e.currentTarget && setModalForm(false)}>
                    <div style={{ background: 'white', borderRadius: 20, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
                        <h3 style={{ fontWeight: 900, fontSize: 18, color: p.primario, marginBottom: 20 }}>
                            {editando ? 'Editar publicación' : 'Nueva publicación de adopción'}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                            {/* Especie */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>ESPECIE *</label>
                                <div style={{ display: 'flex', gap: 8 }}>

                                    {['Perro', 'Gato', 'Conejo', 'Otro'].map(e => (
                                        <button key={e} onClick={() => setForm(f => ({ ...f, especie: e, raza: '' }))} style={btnEsp(e)}>
                                            {e === 'Perro' ? '🐶' : e === 'Gato' ? '🐱' : e === 'Conejo' ? '🐰' : '🐾'} {e}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Raza */}
                            {form.especie && (
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>RAZA *</label>
                                    {form.especie === 'Otro' ? (
                                        <input type="text" placeholder="Escribe la especie y raza (ej: Loro, Tortuga...)"
                                            value={form.razaOtro || ''}
                                            onChange={e => setForm(f => ({ ...f, razaOtro: e.target.value, raza: e.target.value }))}
                                            style={inputSty} />
                                    ) : (
                                        <>
                                            <select value={form.raza} onChange={e => setForm(f => ({ ...f, raza: e.target.value }))} style={inputSty}>
                                                <option value="">— Selecciona —</option>
                                                {razas.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            {form.raza === 'Otro' && (
                                                <input type="text" placeholder="Escribe la raza..."
                                                    value={form.razaOtro || ''}
                                                    onChange={e => setForm(f => ({ ...f, razaOtro: e.target.value }))}
                                                    style={{ ...inputSty, marginTop: 6 }} />
                                            )}
                                        </>
                                    )}
                                </div>
                            )}





                            {/* Edad */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>EDAD APROXIMADA *</label>
                                <select value={form.edad} onChange={e => setForm(f => ({ ...f, edad: e.target.value }))} style={inputSty}>
                                    <option value="">— Selecciona —</option>
                                    {EDADES.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                            </div>

                            {/* Tamaño */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>TAMAÑO *</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['Pequeño', 'Mediano', 'Grande'].map(t => (
                                        <button key={t} onClick={() => setForm(f => ({ ...f, tamanio: t }))} style={btnTam(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Sexo y cantidad */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>SEXO Y CANTIDAD *</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.tienesMachos} onChange={e => setForm(f => ({ ...f, tienesMachos: e.target.checked, machos: e.target.checked ? f.machos || 1 : 0 }))} />
                                        <span style={{ fontSize: 13, fontWeight: 700 }}>Machos:</span>
                                        {form.tienesMachos && (
                                            <input type="number" min={1} max={20} value={form.machos}
                                                onChange={e => setForm(f => ({ ...f, machos: parseInt(e.target.value) || 1 }))}
                                                style={{ width: 50, padding: '4px 8px', borderRadius: 8, border: `1.5px solid ${p.borde}`, fontSize: 13, outline: 'none' }} />
                                        )}
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={form.tienesHembras} onChange={e => setForm(f => ({ ...f, tienesHembras: e.target.checked, hembras: e.target.checked ? f.hembras || 1 : 0 }))} />
                                        <span style={{ fontSize: 13, fontWeight: 700 }}>Hembras:</span>
                                        {form.tienesHembras && (
                                            <input type="number" min={1} max={20} value={form.hembras}
                                                onChange={e => setForm(f => ({ ...f, hembras: parseInt(e.target.value) || 1 }))}
                                                style={{ width: 50, padding: '4px 8px', borderRadius: 8, border: `1.5px solid ${p.borde}`, fontSize: 13, outline: 'none' }} />
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Ciudad */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>CIUDAD *</label>
                                <input type="text" value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                                    style={inputSty} placeholder="Ej: Puno, Juliaca" />
                            </div>

                            {/* WhatsApp */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>WHATSAPP *</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ background: '#f5f0e8', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: p.texto, border: `1.5px solid ${p.borde}` }}>+51</span>
                                    <input type="tel" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value.replace(/\D/g, '') }))}
                                        style={{ ...inputSty, flex: 1 }} placeholder="987654321" maxLength={9} />
                                </div>
                            </div>

                            {/* Salud */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>SALUD <span style={{ fontWeight: 400, color: p.textoSub }}>(opcional)</span></label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {SALUD_OPTS.map(s => (
                                        <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                                            <input type="checkbox" checked={form.salud.includes(s)}
                                                onChange={e => setForm(f => ({ ...f, salud: e.target.checked ? [...f.salud, s] : f.salud.filter(x => x !== s) }))} />
                                            {s}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Historia */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>HISTORIA <span style={{ fontWeight: 400, color: p.textoSub }}>(opcional)</span></label>
                                <textarea value={form.historia} onChange={e => setForm(f => ({ ...f, historia: e.target.value }))}
                                    rows={3} style={inputSty} placeholder="Cuéntanos su historia..." />
                            </div>

                            {/* Fotos */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>FOTOS * (mínimo 1, máximo 5)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                    {form.fotos.map((f, i) => (
                                        <div key={i} style={{ position: 'relative' }}>
                                            <img src={f} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: `2px solid ${p.borde}` }} />
                                            <button onClick={() => setForm(prev => ({ ...prev, fotos: prev.fotos.filter((_, idx) => idx !== i) }))}
                                                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: p.peligro, color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 900, padding: 0 }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                                {form.fotos.length < 5 && (
                                    <input type="file" accept="image/*" multiple onChange={handleFotos}
                                        style={{ ...inputSty, padding: '6px' }} />
                                )}
                                {comprimiendo && <div style={{ fontSize: 11, color: p.textoSub, marginTop: 4 }}>Comprimiendo imagen...</div>}
                                <div style={{ fontSize: 11, color: p.textoSub, marginTop: 4 }}>{form.fotos.length}/5 fotos</div>
                            </div>

                            {/* Urgente */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 12, background: form.urgente ? '#fff0f0' : '#f5f0e8', border: `2px solid ${form.urgente ? p.peligro : '#e2d3be'}` }}>
                                <input type="checkbox" checked={form.urgente} onChange={e => setForm(f => ({ ...f, urgente: e.target.checked }))} />
                                <span style={{ fontSize: 13, fontWeight: 800, color: form.urgente ? p.peligro : p.texto }}>🔴 Marcar como URGENTE</span>
                                <span style={{ fontSize: 11, color: p.textoSub }}>(resalta la tarjeta)</span>
                            </label>

                            {/* Estado si es edición */}
                            {editando && (
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: p.primario, display: 'block', marginBottom: 6 }}>ESTADO</label>
                                    <select value={form.estado || 'disponible'} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} style={inputSty}>
                                        <option value="disponible">🟢 Disponible</option>
                                        <option value="adoptado">✅ Adoptado</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button onClick={guardar} disabled={guardando}
                                style={{ flex: 1, padding: 13, borderRadius: 12, background: p.primario, color: 'white', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer', opacity: guardando ? 0.6 : 1 }}>
                                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Publicar'}
                            </button>
                            <button onClick={() => { setModalForm(false); resetForm(); setEditando(null) }}
                                style={{ flex: 1, padding: 13, borderRadius: 12, background: '#f5f0e8', color: p.primario, border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}






            {/* Botón fijo */}
            {pestana === 'mis' && (
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px', background: 'rgba(234,217,199,0.95)', backdropFilter: 'blur(8px)', zIndex: 100, borderTop: '1px solid #e2d3be' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <button onClick={() => {
                        if (!usuarioDb) {
                            setMostrarPerrito(true)
                            setTimeout(() => setMostrarPerrito(false), 7000)
                        } else {
                            abrirNuevo()
                        }
                    }}
                        style={{ width: '100%', padding: 13, borderRadius: 14, background: p.primario, color: 'white', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
                        + Publicar adopción 🐾
                    </button>
                </div>
            </div>
            )}

            {/* Perrito mensajero */}
            {mostrarPerrito && (
                <div style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ background: 'white', borderRadius: '16px 16px 4px 16px', padding: '14px 18px', maxWidth: 260, fontSize: 13, fontWeight: 700, color: '#003F5A', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '2px solid #DD6600', lineHeight: 1.5 }}>
                        🐾 ¡Woof! Para publicar una adopción primero debes iniciar sesión. ¡Únete a la comunidad PAW FINDER! 🐶
                    </div>
                    <img src="/perrito.png" alt="perrito" style={{ width: 140, height: 140, objectFit: 'contain', animation: 'saltar 0.6s ease infinite alternate' }} />
                </div>
            )}

            <style>{`
                @keyframes saltar { from { transform: translateY(0); } to { transform: translateY(-10px); } }
            `}</style>



            {/* Modal imagen ampliada */}
            {imagenAmpliada && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={() => setImagenAmpliada(null)}>
                    <img src={imagenAmpliada} alt="" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }} onClick={e => e.stopPropagation()} />
                    <button onClick={() => setImagenAmpliada(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 40, height: 40, fontSize: 18, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                </div>
            )}            
        </div>
    )
}