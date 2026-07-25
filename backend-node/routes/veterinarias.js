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

// GET /api/veterinarias — obtener todas o filtrar por usuario o por radio
router.get('/', async (req, res) => {
  const { usuario_id, lat, lng, radio } = req.query

  try {
    let resultado

    if (usuario_id) {
      // Mis veterinarias
      resultado = await pool.query(
        `SELECT v.*, 
          COALESCE(json_agg(vi.url ORDER BY vi.orden) FILTER (WHERE vi.url IS NOT NULL), '[]') as imagenes
         FROM veterinarias v
         LEFT JOIN veterinaria_imagenes vi ON v.id = vi.veterinaria_id
         WHERE v.usuario_id = $1
         GROUP BY v.id
         ORDER BY v.created_at DESC`,
        [usuario_id]
      )
    } else if (lat && lng) {
      // Buscar por radio en km usando fórmula de distancia
      const radioKm = parseFloat(radio) || 5
      resultado = await pool.query(
        `SELECT v.*,
          COALESCE(json_agg(vi.url ORDER BY vi.orden) FILTER (WHERE vi.url IS NOT NULL), '[]') as imagenes,
          (6371 * acos(
            cos(radians($1)) * cos(radians(v.lat)) *
            cos(radians(v.lng) - radians($2)) +
            sin(radians($1)) * sin(radians(v.lat))
          )) AS distancia_km
         FROM veterinarias v
         LEFT JOIN veterinaria_imagenes vi ON v.id = vi.veterinaria_id
         GROUP BY v.id
         HAVING (6371 * acos(
           cos(radians($1)) * cos(radians(v.lat)) *
           cos(radians(v.lng) - radians($2)) +
           sin(radians($1)) * sin(radians(v.lat))
         )) <= $3
         ORDER BY distancia_km ASC`,
        [parseFloat(lat), parseFloat(lng), radioKm]
      )
    } else {
      // Todas
      resultado = await pool.query(
        `SELECT v.*,
          COALESCE(json_agg(vi.url ORDER BY vi.orden) FILTER (WHERE vi.url IS NOT NULL), '[]') as imagenes
         FROM veterinarias v
         LEFT JOIN veterinaria_imagenes vi ON v.id = vi.veterinaria_id
         GROUP BY v.id
         ORDER BY v.created_at DESC`
      )
    }

    res.json(resultado.rows)
  } catch (error) {
    console.error('Error obteniendo veterinarias:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// POST /api/veterinarias — crear nueva veterinaria
router.post('/', async (req, res) => {
  const { usuario_id, nombre, direccion, ruc, lat, lng, telefono, horario, imagenes_existentes, imagenes } = req.body

  if (!nombre || !ruc || !direccion || !lat || !lng) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO veterinarias (usuario_id, nombre, direccion, ruc, lat, lng, telefono, horario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [usuario_id, nombre, direccion, ruc, lat, lng, telefono, horario]
    )

    const vet = resultado.rows[0]

    // Guardar imágenes si vienen
    if (imagenes && imagenes.length > 0) {
      for (let i = 0; i < imagenes.length; i++) {
        await pool.query(
          'INSERT INTO veterinaria_imagenes (veterinaria_id, url, orden) VALUES ($1,$2,$3)',
          [vet.id, imagenes[i], i]
        )
      }
    }

    res.status(201).json(vet)
  } catch (error) {
    console.error('Error creando veterinaria:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// PUT /api/veterinarias/:id — editar veterinaria
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, direccion, ruc, lat, lng, telefono, horario, imagenes_existentes, imagenes } = req.body

  try {
    await pool.query(
      `UPDATE veterinarias SET nombre=$1, direccion=$2, ruc=$3, lat=$4, lng=$5, telefono=$6, horario=$7
       WHERE id=$8`,
      [nombre, direccion, ruc, lat, lng, telefono, horario, id]
    )

    // Borrar imágenes antiguas y volver a insertar
    await pool.query('DELETE FROM veterinaria_imagenes WHERE veterinaria_id = $1', [id])

    const todasImagenes = [...(imagenes_existentes || []), ...(imagenes || [])]
    for (let i = 0; i < todasImagenes.length; i++) {
      await pool.query(
        'INSERT INTO veterinaria_imagenes (veterinaria_id, url, orden) VALUES ($1,$2,$3)',
        [id, todasImagenes[i], i]
      )
    }

    res.json({ ok: true })
  } catch (error) {
    console.error('Error editando veterinaria:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// DELETE /api/veterinarias/:id — eliminar veterinaria
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    await pool.query('DELETE FROM veterinarias WHERE id = $1', [id])
    res.json({ ok: true })
  } catch (error) {
    console.error('Error eliminando veterinaria:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router