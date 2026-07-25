const express = require('express')
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

// GET /api/valoraciones
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.firebase_uid, v.estrellas, v.comentario, v.created_at,
             COALESCE(u.nombre, v.nombre) AS nombre,
             COALESCE(u.foto_url, v.foto_url) AS foto_url
      FROM valoraciones v
      LEFT JOIN usuarios u ON u.firebase_uid = v.firebase_uid
      ORDER BY v.created_at DESC
    `)
    res.json(result.rows)
  } catch (e) {
    console.error('Error obteniendo valoraciones:', e.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /api/valoraciones — upsert por firebase_uid (un usuario = una valoración)
router.post('/', async (req, res) => {
  const { firebase_uid, nombre, foto_url, estrellas, comentario } = req.body
  if (!firebase_uid || !estrellas || !comentario?.trim()) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }
  const stars = parseInt(estrellas)
  if (stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Estrellas debe ser entre 1 y 5' })
  }
  try {
    const result = await pool.query(`
      INSERT INTO valoraciones (firebase_uid, nombre, foto_url, estrellas, comentario)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (firebase_uid)
      DO UPDATE SET
        nombre     = EXCLUDED.nombre,
        foto_url   = EXCLUDED.foto_url,
        estrellas  = EXCLUDED.estrellas,
        comentario = EXCLUDED.comentario,
        created_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [firebase_uid, nombre || null, foto_url || null, stars, comentario.trim()])
    res.json({ ok: true, valoracion: result.rows[0] })
  } catch (e) {
    console.error('Error guardando valoración:', e.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// DELETE /api/valoraciones/:firebase_uid
router.delete('/:firebase_uid', async (req, res) => {
  const { firebase_uid } = req.params
  try {
    await pool.query('DELETE FROM valoraciones WHERE firebase_uid = $1', [firebase_uid])
    res.json({ ok: true })
  } catch (e) {
    console.error('Error eliminando valoración:', e.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router