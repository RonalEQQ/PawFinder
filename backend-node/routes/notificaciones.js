const express = require('express')
const router  = express.Router()
const { Pool } = require('pg')
const dotenv  = require('dotenv')
dotenv.config({ path: require('path').join(__dirname, '..', '.env') })

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// ─── GET /api/notificaciones?firebase_uid=xxx ──────────────────
// Devuelve notificaciones del usuario, ordenadas por fecha desc
router.get('/', async (req, res) => {
  const { firebase_uid } = req.query
  if (!firebase_uid) return res.status(400).json({ error: 'firebase_uid requerido' })

  try {
    // Obtener usuario_id
    const uRes = await pool.query(
      'SELECT id FROM usuarios WHERE firebase_uid = $1', [firebase_uid]
    )
    if (uRes.rows.length === 0) return res.json([])
    const usuario_id = uRes.rows[0].id

    const result = await pool.query(
      `SELECT * FROM notificaciones
       WHERE usuario_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [usuario_id]
    )
    res.json(result.rows)
  } catch (e) {
    console.error('Error notificaciones GET:', e.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// ─── PUT /api/notificaciones/leida/:id ────────────────────────
// Marca una notificación como leída
router.put('/leida/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('UPDATE notificaciones SET leida=true WHERE id=$1', [id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// ─── PUT /api/notificaciones/leer-todas ───────────────────────
// Marca todas las notificaciones del usuario como leídas
router.put('/leer-todas', async (req, res) => {
  const { firebase_uid } = req.body
  if (!firebase_uid) return res.status(400).json({ error: 'firebase_uid requerido' })
  try {
    const uRes = await pool.query(
      'SELECT id FROM usuarios WHERE firebase_uid = $1', [firebase_uid]
    )
    if (uRes.rows.length === 0) return res.json({ ok: true })
    const usuario_id = uRes.rows[0].id
    await pool.query(
      'UPDATE notificaciones SET leida=true WHERE usuario_id=$1', [usuario_id]
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Error interno' })
  }
})

// ─── DELETE /api/notificaciones/:id ───────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notificaciones WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router