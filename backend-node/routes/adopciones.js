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
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const resultado = await client.query(
      `INSERT INTO adopciones (usuario_id, especie, raza, edad, tamanio, machos, hembras, ciudad, whatsapp, salud, historia, urgente)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [usuario_id, especie, raza, edad, tamanio, machos || 0, hembras || 0, ciudad, whatsapp, salud || [], historia || null, urgente || false]
    )
    const adopcion = resultado.rows[0]
    if (Array.isArray(fotos) && fotos.length > 0) {
      // Un solo INSERT con todas las filas, en vez de N queries secuenciales:
      // menos viajes de ida y vuelta a Neon y, sobre todo, si algo falla no
      // queda la publicación a medias (sin foto) como pasaba antes.
      const valores = []
      const placeholders = fotos.map((url, i) => {
        const base = i * 3
        valores.push(adopcion.id, url, i)
        return `($${base + 1},$${base + 2},$${base + 3})`
      }).join(',')
      await client.query(
        `INSERT INTO adopcion_fotos (adopcion_id, url, orden) VALUES ${placeholders}`,
        valores
      )
    }
    await client.query('COMMIT')
    res.status(201).json(adopcion)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creando adopcion:', error.message, '| code:', error.code, '| detail:', error.detail, '| constraint:', error.constraint)
    res.status(500).json({ error: 'No se pudo guardar la publicación. Intenta de nuevo.' })
  } finally {
    client.release()
  }
})

// PUT /api/adopciones/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { especie, raza, edad, tamanio, machos, hembras, ciudad, whatsapp, salud, historia, urgente, estado, fotos } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE adopciones SET especie=$1, raza=$2, edad=$3, tamanio=$4, machos=$5, hembras=$6, ciudad=$7, whatsapp=$8, salud=$9, historia=$10, urgente=$11, estado=$12 WHERE id=$13`,
      [especie, raza, edad, tamanio, machos || 0, hembras || 0, ciudad, whatsapp, salud || [], historia || null, urgente || false, estado || 'disponible', id]
    )
    if (fotos !== undefined) {
      await client.query('DELETE FROM adopcion_fotos WHERE adopcion_id = $1', [id])
      if (Array.isArray(fotos) && fotos.length > 0) {
        const valores = []
        const placeholders = fotos.map((url, i) => {
          const base = i * 3
          valores.push(id, url, i)
          return `($${base + 1},$${base + 2},$${base + 3})`
        }).join(',')
        await client.query(
          `INSERT INTO adopcion_fotos (adopcion_id, url, orden) VALUES ${placeholders}`,
          valores
        )
      }
    }
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error editando adopcion:', error.message, '| code:', error.code, '| detail:', error.detail, '| constraint:', error.constraint)
    res.status(500).json({ error: 'No se pudo guardar los cambios. Intenta de nuevo.' })
  } finally {
    client.release()
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