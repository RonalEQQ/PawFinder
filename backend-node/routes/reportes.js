const express = require('express')
const { enviarEmailSimilitud } = require('../services/email')
const router = express.Router()
const { Pool } = require('pg')
const dotenv = require('dotenv')
dotenv.config({ path: require('path').join(__dirname, '..', '.env') })

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
)

// ─── Función: calcula similitud entre dos reportes (0-100) ────
function calcularSimilitud(r1, r2) {
  let puntos = 0

  // Raza (peso 60%)
  const raza1 = (r1.raza || '').toLowerCase().trim()
  const raza2 = (r2.raza || '').toLowerCase().trim()
  if (raza1 && raza2) {
    if (raza1 === raza2) {
      puntos += 60
    } else {
      const w1 = raza1.split(' ')
      const w2 = raza2.split(' ')
      const comunes = w1.filter(p => w2.some(a => a.includes(p) || p.includes(a)))
      if (comunes.length > 0) puntos += Math.round(30 + (comunes.length / Math.max(w1.length, w2.length)) * 25)
    }
  }

  // Color (peso 25%)
  const c1 = (r1.color || '').toLowerCase().trim()
  const c2 = (r2.color || '').toLowerCase().trim()
  if (c1 && c2) {
    if (c1 === c2) puntos += 25
    else if (c1.includes(c2) || c2.includes(c1)) puntos += 12
  }

  // Zona/lugar (peso 15%)
  const l1 = (r1.lugar || '').toLowerCase()
  const l2 = (r2.lugar || '').toLowerCase()
  if (l1 && l2) {
    const words1 = l1.split(/[,\s]+/).filter(w => w.length > 3)
    const words2 = l2.split(/[,\s]+/).filter(w => w.length > 3)
    if (words1.some(w => words2.some(v => v.includes(w) || w.includes(v)))) puntos += 15
  }

  return Math.min(puntos, 99)
}

// ─── Función: genera notificaciones de similitud tras un nuevo reporte ──
async function generarNotificacionesSimilitud(pool, nuevoReporte) {
  try {
    // Si es un avistamiento (posible_perdido), busca reportes perdidos similares
    // Si es un reporte perdido, busca avistamientos similares
    const tipoContrario = nuevoReporte.tipo === 'perdido' ? 'posible_perdido' : 'perdido'

    const reportesContrarios = await pool.query(
      `SELECT r.*, u.firebase_uid AS owner_firebase_uid, u.id AS owner_id
       FROM reportes r
       JOIN usuarios u ON u.firebase_uid = r.firebase_uid
       WHERE r.tipo = $1
         AND r.estado = 'activo'
         AND r.id != $2`,
      [tipoContrario, nuevoReporte.id]
    )

    for (const r of reportesContrarios.rows) {
      const sim = calcularSimilitud(nuevoReporte, r)
      if (sim < 25) continue  // umbral mínimo 25%

      // Obtener usuario destino (dueño del reporte contrario)
      const uRes = await pool.query(
        'SELECT id FROM usuarios WHERE firebase_uid = $1', [r.owner_firebase_uid]
      )
      if (uRes.rows.length === 0) continue
      const destinatario_id = uRes.rows[0].id

      const esNuevoPerdido = nuevoReporte.tipo === 'perdido'
      const mensaje = esNuevoPerdido
        ? `🐾 Se reportó una mascota perdida (${nuevoReporte.raza || 'raza desconocida'}) en ${nuevoReporte.lugar || 'Puno'} con ${sim}% de similitud con tu avistamiento.`
        : `🔍 Se registró un avistamiento de un perro (${nuevoReporte.raza || 'raza desconocida'}) en ${nuevoReporte.lugar || 'Puno'} con ${sim}% de similitud con tu reporte de ${r.nombre || 'tu mascota'}.`

      // Verificar que no exista ya una notificación similar reciente (evitar duplicados)
      const existe = await pool.query(
        `SELECT id FROM notificaciones
         WHERE usuario_id=$1 AND reporte_origen_id=$2 AND tipo='similitud'
           AND created_at > NOW() - INTERVAL '1 hour'`,
        [destinatario_id, nuevoReporte.id]
      )
      if (existe.rows.length > 0) continue

      await pool.query(
        `INSERT INTO notificaciones
           (usuario_id, tipo, mensaje, similitud_pct, reporte_origen_id, reporte_destino_id)
         VALUES ($1, 'similitud', $2, $3, $4, $5)`,
        [destinatario_id, mensaje, sim, nuevoReporte.id, r.id]
      )

      // ── Enviar email al dueño ──────────────────────────────
      const emailRes = await pool.query(
        'SELECT email, nombre FROM usuarios WHERE id = $1', [destinatario_id]
      )
      if (emailRes.rows.length > 0) {
        const { email: emailDest, nombre: nombreDest } = emailRes.rows[0]
        // La foto del avistamiento (si es tipo perdido, la foto es del nuevo reporte)
        const fotoAvist = nuevoReporte.fotos?.[0] || null
        await enviarEmailSimilitud({
          emailDestinatario: emailDest,
          nombreDueno:       nombreDest,
          nombreMascota:     esNuevoPerdido ? null : r.nombre,
          raza:              nuevoReporte.raza || r.raza || '',
          color:             nuevoReporte.color || r.color || '',
          lugar:             nuevoReporte.lugar || '',
          similitudPct:      sim,
          fotoAvistamiento:  fotoAvist,
          tipoNuevo:         nuevoReporte.tipo,
        })
      }
    }
  } catch (e) {
    // No bloquear la respuesta si falla la notificación
    console.error('Error generando notificaciones:', e.message)
  }
}

// GET /api/reportes  (opcional: ?firebase_uid= para filtrar los propios)
router.get('/', async (req, res) => {
  const { firebase_uid } = req.query
  try {
    const where = firebase_uid ? 'WHERE r.firebase_uid = $1' : ''
    const params = firebase_uid ? [firebase_uid] : []
    const result = await pool.query(
      `SELECT r.*,
         COALESCE(json_agg(rf.url ORDER BY rf.orden) FILTER (WHERE rf.url IS NOT NULL), '[]') AS fotos
       FROM reportes r
       LEFT JOIN reporte_fotos rf ON rf.reporte_id = r.id
       ${where}
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      params
    )
    res.json(result.rows)
  } catch (e) {
    console.error('Error obteniendo reportes:', e.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /api/reportes
router.post('/', async (req, res) => {
  const {
    firebase_uid, usuario_nombre,
    nombre, raza, color, sexo,
    lugar, direccion_completa, lat, lng,
    fecha, hora_aproximada, timestamp_registro,
    telefono, descripcion,
    tipo, estado,
    fotos,
  } = req.body

  if (!tipo) return res.status(400).json({ error: 'tipo es requerido' })

  const client = await pool.connect()
  let reporte
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO reportes
         (firebase_uid, usuario_nombre, nombre, raza, color, sexo,
          lugar, direccion_completa, lat, lng,
          fecha, hora_aproximada, timestamp_registro,
          telefono, descripcion, tipo, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        firebase_uid || null,
        usuario_nombre || 'Usuario',
        nombre || 'Sin nombre',
        raza || '',
        color || '',
        sexo || '',
        lugar || 'Puno',
        direccion_completa || lugar || 'Puno',
        lat || -15.8402,
        lng || -70.0219,
        fecha || new Date().toLocaleDateString('es-PE'),
        hora_aproximada || '',
        timestamp_registro ? new Date(timestamp_registro) : new Date(),
        telefono || '',
        descripcion || '',
        tipo,
        estado || 'activo',
      ]
    )
    reporte = result.rows[0]

    if (Array.isArray(fotos) && fotos.length > 0) {
      // Un solo INSERT con todas las filas: menos viajes a Neon y, si algo
      // falla, el reporte no queda guardado a medias (sin fotos).
      const valores = []
      const placeholders = fotos.map((url, i) => {
        const base = i * 3
        valores.push(reporte.id, url, i)
        return `($${base + 1},$${base + 2},$${base + 3})`
      }).join(',')
      await client.query(
        `INSERT INTO reporte_fotos (reporte_id, url, orden) VALUES ${placeholders}`,
        valores
      )
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Error creando reporte:', e.message, '| code:', e.code, '| detail:', e.detail, '| constraint:', e.constraint)
    return res.status(500).json({ error: 'No se pudo guardar el reporte. Intenta de nuevo.' })
  } finally {
    client.release()
  }

  try {
    // ── Generar notificaciones de similitud ─────────────────
    // Va después del COMMIT y fuera de la transacción a propósito: es un
    // efecto secundario (notificaciones + email) y no debe poder revertir
    // ni bloquear el reporte ya guardado con éxito.
    await generarNotificacionesSimilitud(pool, reporte)
  } catch (e) {
    console.error('Error generando notificaciones de similitud:', e.message)
  }

  res.status(201).json({ ok: true, reporte })
})

// PUT /api/reportes/:id  — actualizar campos del reporte
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const {
    nombre, raza, color, sexo,
    lugar, direccion_completa, lat, lng,
    telefono, descripcion, hora_aproximada,
  } = req.body
  try {
    const result = await pool.query(
      `UPDATE reportes SET
         nombre=$1, raza=$2, color=$3, sexo=$4,
         lugar=$5, direccion_completa=$6, lat=$7, lng=$8,
         telefono=$9, descripcion=$10, hora_aproximada=$11
       WHERE id=$12 RETURNING *`,
      [nombre, raza, color, sexo, lugar, direccion_completa, lat, lng, telefono, descripcion, hora_aproximada, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reporte no encontrado' })
    res.json({ ok: true, reporte: result.rows[0] })
  } catch (e) {
    console.error('Error actualizando reporte:', e.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// PUT /api/reportes/:id/estado  — cambiar estado (resuelto, activo, restaurar)
router.put('/:id/estado', async (req, res) => {
  const { id } = req.params
  const { estado, activo_para_todos, dias_activo, fecha } = req.body
  try {
    const result = await pool.query(
      `UPDATE reportes SET
         estado = COALESCE($1, estado),
         activo_para_todos = COALESCE($2, activo_para_todos),
         dias_activo = COALESCE($3, dias_activo),
         fecha = COALESCE($4, fecha)
       WHERE id=$5 RETURNING *`,
      [estado || null, activo_para_todos ?? null, dias_activo ?? null, fecha || null, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reporte no encontrado' })
    res.json({ ok: true, reporte: result.rows[0] })
  } catch (e) {
    console.error('Error actualizando estado:', e.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// DELETE /api/reportes/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM reportes WHERE id=$1', [id])
    res.json({ ok: true })
  } catch (e) {
    console.error('Error eliminando reporte:', e.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router