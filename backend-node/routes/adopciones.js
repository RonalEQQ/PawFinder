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

// GET /api/adopciones
router.get('/', async (req, res) => {
  const { usuario_id } = req.query
  try {
    let resultado
    if (usuario_id) {
      resultado = await pool.query(
        `SELECT a.*, 
          COALESCE(json_agg(af.url ORDER BY af.orden) FILTER (WHERE af.url IS NOT NULL), '[]') as fotos
         FROM adopciones a
         LEFT JOIN adopcion_fotos af ON a.id = af.adopcion_id
         WHERE a.usuario_id = $1
         GROUP BY a.id ORDER BY a.created_at DESC`,
        [usuario_id]
      )
    } else {
      resultado = await pool.query(
        `SELECT a.*,
          COALESCE(json_agg(af.url ORDER BY af.orden) FILTER (WHERE af.url IS NOT NULL), '[]') as fotos
         FROM adopciones a
         LEFT JOIN adopcion_fotos af ON a.id = af.adopcion_id
         GROUP BY a.id ORDER BY a.urgente DESC, a.created_at DESC`
      )
    }
    res.json(resultado.rows)
  } catch (error) {
    console.error('Error obteniendo adopciones:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/adopciones
router.post('/', async (req, res) => {
  const { usuario_id, especie, raza, edad, tamanio, machos, hembras, ciudad, whatsapp, salud, historia, urgente, fotos } = req.body
  if (!especie || !raza || !edad || !tamanio || !ciudad || !whatsapp) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }
  try {
    const resultado = await pool.query(
      `INSERT INTO adopciones (usuario_id, especie, raza, edad, tamanio, machos, hembras, ciudad, whatsapp, salud, historia, urgente)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [usuario_id, especie, raza, edad, tamanio, machos || 0, hembras || 0, ciudad, whatsapp, salud || [], historia || null, urgente || false]
    )
    const adopcion = resultado.rows[0]
    if (fotos && fotos.length > 0) {
      for (let i = 0; i < fotos.length; i++) {
        await pool.query(
          'INSERT INTO adopcion_fotos (adopcion_id, url, orden) VALUES ($1,$2,$3)',
          [adopcion.id, fotos[i], i]
        )
      }
    }
    res.status(201).json(adopcion)
  } catch (error) {
    console.error('Error creando adopcion:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/adopciones/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { especie, raza, edad, tamanio, machos, hembras, ciudad, whatsapp, salud, historia, urgente, estado, fotos } = req.body
  try {
    await pool.query(
      `UPDATE adopciones SET especie=$1, raza=$2, edad=$3, tamanio=$4, machos=$5, hembras=$6, ciudad=$7, whatsapp=$8, salud=$9, historia=$10, urgente=$11, estado=$12 WHERE id=$13`,
      [especie, raza, edad, tamanio, machos || 0, hembras || 0, ciudad, whatsapp, salud || [], historia || null, urgente || false, estado || 'disponible', id]
    )
    if (fotos !== undefined) {
      await pool.query('DELETE FROM adopcion_fotos WHERE adopcion_id = $1', [id])
      for (let i = 0; i < fotos.length; i++) {
        await pool.query('INSERT INTO adopcion_fotos (adopcion_id, url, orden) VALUES ($1,$2,$3)', [id, fotos[i], i])
      }
    }
    res.json({ ok: true })
  } catch (error) {
    console.error('Error editando adopcion:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// DELETE /api/adopciones/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM adopciones WHERE id = $1', [id])
    res.json({ ok: true })
  } catch (error) {
    console.error('Error eliminando adopcion:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router