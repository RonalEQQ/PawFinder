const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
const dotenv = require('dotenv')
dotenv.config({ path: require('path').join(__dirname, '..', '.env') })

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// GET /api/campanas — obtener todas las campañas
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT c.*, u.nombre as autor_nombre
       FROM campanas c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       ORDER BY c.created_at DESC`
    )

    // Archivar automáticamente las vencidas
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const campanas = resultado.rows.map(c => {
      if (c.fecha_fin && !c.archivada) {
        const fechaFin = new Date(c.fecha_fin)
        fechaFin.setHours(0, 0, 0, 0)
        if (fechaFin < hoy) {
          // Actualizar en base de datos
          pool.query('UPDATE campanas SET archivada = true WHERE id = $1', [c.id])
          return { ...c, archivada: true }
        }
      }
      return c
    })

    res.json(campanas)
  } catch (error) {
    console.error('Error obteniendo campañas:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/campanas — crear nueva campaña
router.post('/', async (req, res) => {

  const {
      usuario_id, nombre, zona, lugar, lat, lng,
      fecha_inicio, fecha_fin, hora_inicio, hora_fin,
      ruc, razon_social, tipo_vacuna,
      descripcion, imagen
  } = req.body

  if (!nombre || !zona || !lugar || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  try {
    const resultado = await pool.query(
     
      `INSERT INTO campanas 
            (usuario_id, nombre, zona, lugar, lat, lng, fecha_inicio, fecha_fin, hora_inicio, hora_fin, ruc, razon_social, tipo_vacuna, descripcion, imagen)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING *`,
            [usuario_id, nombre, zona, lugar, lat || null, lng || null, fecha_inicio, fecha_fin, hora_inicio || null, hora_fin || null, ruc || null, razon_social || null, tipo_vacuna || null, descripcion, imagen]

    )
    res.status(201).json(resultado.rows[0])
  } catch (error) {
    console.error('Error creando campaña:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/campanas/:id/like — dar o quitar like
router.post('/:id/like', async (req, res) => {
  const { id } = req.params
  const { usuario_id } = req.body

  if (!usuario_id) {
    return res.status(400).json({ error: 'usuario_id requerido' })
  }

  try {
    // Ver si ya dio like
    const existe = await pool.query(
      'SELECT id FROM campana_likes WHERE campana_id = $1 AND usuario_id = $2',
      [id, usuario_id]
    )

    if (existe.rows.length > 0) {
      // Quitar like
      await pool.query(
        'DELETE FROM campana_likes WHERE campana_id = $1 AND usuario_id = $2',
        [id, usuario_id]
      )
      await pool.query(
        'UPDATE campanas SET likes = GREATEST(0, likes - 1) WHERE id = $1',
        [id]
      )
      res.json({ like: false })
    } else {
      // Dar like
      await pool.query(
        'INSERT INTO campana_likes (campana_id, usuario_id) VALUES ($1, $2)',
        [id, usuario_id]
      )
      await pool.query(
        'UPDATE campanas SET likes = likes + 1 WHERE id = $1',
        [id]
      )
      res.json({ like: true })
    }
  } catch (error) {
    console.error('Error en like:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})




// PUT /api/campanas/:id — editar campaña
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, zona, lugar, fecha_inicio, fecha_fin, hora_inicio, hora_fin, tipo_vacuna, descripcion, imagen } = req.body
  try {
    await pool.query(

      `UPDATE campanas SET nombre=$1, zona=$2, lugar=$3, fecha_inicio=$4, fecha_fin=$5, hora_inicio=$6, hora_fin=$7, tipo_vacuna=$8, descripcion=$9, imagen=$10 WHERE id=$11`,
      [nombre, zona, lugar, fecha_inicio, fecha_fin, hora_inicio || null, hora_fin || null, tipo_vacuna || null, descripcion, imagen, id]

    )
    res.json({ ok: true })
  } catch (error) {
    console.error('Error editando campaña:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})





// DELETE /api/campanas/:id — eliminar campaña
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    await pool.query('DELETE FROM campanas WHERE id = $1', [id])
    res.json({ ok: true })
  } catch (error) {
    console.error('Error eliminando campaña:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router