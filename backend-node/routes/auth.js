const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
const dns = require('dns').promises
const dotenv = require('dotenv')
dotenv.config({ path: require('path').join(__dirname, '..', '.env') })

const DOMINIOS_DESECHABLES = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'sharklasers.com', 'grr.la', 'spam4.me', 'trashmail.com', 'trashmail.me',
  'trashmail.net', 'trashmail.at', 'trashmail.io', 'yopmail.com', 'yopmail.fr',
  'dispostable.com', 'mailnull.com', 'fakeinbox.com', 'fakemail.fr',
  'mailnesia.com', 'maildrop.cc', 'tempr.email', 'discard.email',
  'filzmail.com', 'throwam.com', 'tempinbox.com', 'trashdevil.com',
  'mailbucket.org', 'spamgourmet.com', 'byom.de', 'antispam.de',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamail.net', 'guerrillamail.org', 'spamspot.com', 'spam.la',
  'tempemail.net', 'mailmetrash.com', 'zetmail.com', 'spamhereplease.com',
])

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// GET /api/auth/verificar-email?email=...
// Comprueba si el dominio tiene registros MX (puede recibir correo) y si no es desechable
router.get('/verificar-email', async (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase()
  if (!email) return res.status(400).json({ valido: false, mensaje: 'Email requerido' })

  const partes = email.split('@')
  if (partes.length !== 2 || !partes[0] || !partes[1]) {
    return res.json({ valido: false, mensaje: 'El formato del correo no es válido' })
  }

  const dominio = partes[1]

  if (DOMINIOS_DESECHABLES.has(dominio)) {
    return res.json({ valido: false, mensaje: 'No se permiten correos temporales o desechables. Usa un correo permanente.' })
  }

  try {
    const registros = await Promise.race([
      dns.resolveMx(dominio).then(r => ({ ok: true, registros: r })),
      new Promise(resolve => setTimeout(() => resolve({ ok: 'timeout' }), 5000))
    ])

    if (registros.ok === 'timeout') {
      return res.json({ valido: true }) // Beneficio de la duda si hay timeout de red
    }
    if (!registros.registros || registros.registros.length === 0) {
      return res.json({ valido: false, mensaje: 'Este dominio no tiene servidor de correo configurado' })
    }
    return res.json({ valido: true })
  } catch (err) {
    if (err.code === 'ENOTFOUND') {
      return res.json({ valido: false, mensaje: 'El dominio del correo no existe. ¿Hay un error tipográfico?' })
    }
    if (err.code === 'ENODATA' || err.code === 'ESERVFAIL') {
      return res.json({ valido: false, mensaje: 'Este dominio no puede recibir correos electrónicos' })
    }
    return res.json({ valido: true }) // Error inesperado: no bloquear al usuario
  }
})

// POST /api/auth/sync
// Recibe los datos del usuario de Firebase y lo crea o actualiza en PostgreSQL
router.post('/sync', async (req, res) => {
  const { firebase_uid, nombre, email, foto_url } = req.body

  if (!firebase_uid || !email) {
    return res.status(400).json({ error: 'firebase_uid y email son requeridos' })
  }

  try {
    const check = await pool.query(
      'SELECT id FROM usuarios WHERE firebase_uid = $1',
      [firebase_uid]
    )
    const esNuevo = check.rows.length === 0

    const resultado = await pool.query(
      `INSERT INTO usuarios (firebase_uid, nombre, email, foto_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET nombre = $2, foto_url = $4
       RETURNING *`,
      [firebase_uid, nombre, email, foto_url]
    )

    res.json({ ok: true, usuario: resultado.rows[0], esNuevo })
  } catch (error) {
    console.error('Error en auth/sync:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/auth/usuario/:firebase_uid
// Obtiene los datos del usuario desde PostgreSQL
router.get('/usuario/:firebase_uid', async (req, res) => {
  const { firebase_uid } = req.params

  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE firebase_uid = $1',
      [firebase_uid]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json(resultado.rows[0])
  } catch (error) {
    console.error('Error obteniendo usuario:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})


// PUT /api/auth/actualizar
router.put('/actualizar', async (req, res) => {
  const { firebase_uid, nombre, foto_url, celular, dni, fecha_nacimiento, direccion, genero } = req.body
  try {
    const resultado = await pool.query(
      `UPDATE usuarios
       SET nombre = $1, foto_url = $2, celular = $3, dni = $4,
           fecha_nacimiento = $5, direccion = $6, genero = $7
       WHERE firebase_uid = $8 RETURNING *`,
      [nombre, foto_url, celular || null, dni || null, fecha_nacimiento || null, direccion || null, genero || null, firebase_uid]
    )
    res.json({ ok: true, usuario: resultado.rows[0] })
  } catch (error) {
    console.error('Error actualizando usuario:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// DELETE /api/auth/usuario/:firebase_uid
// Elimina el usuario y todos sus datos asociados en una transacción atómica
router.delete('/usuario/:firebase_uid', async (req, res) => {
  const { firebase_uid } = req.params
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const userRes = await client.query(
      'SELECT id FROM usuarios WHERE firebase_uid = $1',
      [firebase_uid]
    )
    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    const userId = userRes.rows[0].id

    // Likes de este usuario en campañas ajenas
    await client.query('DELETE FROM campana_likes WHERE usuario_id = $1', [userId])
    // Likes de otros usuarios en las campañas de este usuario
    await client.query(
      'DELETE FROM campana_likes WHERE campana_id IN (SELECT id FROM campanas WHERE usuario_id = $1)',
      [userId]
    )
    // Campañas propias
    await client.query('DELETE FROM campanas WHERE usuario_id = $1', [userId])
    // Imágenes de veterinarias propias
    await client.query(
      'DELETE FROM veterinaria_imagenes WHERE veterinaria_id IN (SELECT id FROM veterinarias WHERE usuario_id = $1)',
      [userId]
    )
    // Veterinarias propias
    await client.query('DELETE FROM veterinarias WHERE usuario_id = $1', [userId])
    // Usuario
    await client.query('DELETE FROM usuarios WHERE firebase_uid = $1', [firebase_uid])

    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error eliminando cuenta:', error.message)
    res.status(500).json({ error: 'Error interno del servidor' })
  } finally {
    client.release()
  }
})

module.exports = router