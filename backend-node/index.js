const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { Pool } = require('pg')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '20mb' }))

// Conexión a PostgreSQL
// Conexión a Neon (producción) o local según variables disponibles
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

// Verificar conexión y migrar columnas nuevas si no existen
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message)
  } else {
    console.log('✅ Conectado a PostgreSQL correctamente')
    try {
      await client.query(`
        ALTER TABLE usuarios
          ADD COLUMN IF NOT EXISTS celular VARCHAR(20),
          ADD COLUMN IF NOT EXISTS dni VARCHAR(15),
          ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
          ADD COLUMN IF NOT EXISTS direccion VARCHAR(255),
          ADD COLUMN IF NOT EXISTS genero VARCHAR(20)
      `)
      console.log('✅ Columnas de perfil verificadas/migradas')
      await client.query(`
        ALTER TABLE campanas
          ADD COLUMN IF NOT EXISTS tipo_vacuna VARCHAR(100),
          ADD COLUMN IF NOT EXISTS hora_inicio TIME,
          ADD COLUMN IF NOT EXISTS hora_fin TIME
      `)
      console.log('✅ Columnas de campañas verificadas/migradas')
      await client.query(`
        CREATE TABLE IF NOT EXISTS adopciones (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
          especie VARCHAR(50) NOT NULL,
          raza VARCHAR(100) NOT NULL,
          edad VARCHAR(50) NOT NULL,
          tamanio VARCHAR(50) NOT NULL,
          machos INTEGER DEFAULT 0,
          hembras INTEGER DEFAULT 0,
          ciudad VARCHAR(100) NOT NULL,
          whatsapp VARCHAR(20) NOT NULL,
          salud TEXT[] DEFAULT '{}',
          historia TEXT,
          urgente BOOLEAN DEFAULT false,
          estado VARCHAR(20) DEFAULT 'disponible',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await client.query(`
        CREATE TABLE IF NOT EXISTS adopcion_fotos (
          id SERIAL PRIMARY KEY,
          adopcion_id INTEGER REFERENCES adopciones(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          orden INTEGER DEFAULT 0
        )
      `)
      console.log('✅ Tablas de adopciones verificadas/creadas')
      await client.query(`
        CREATE TABLE IF NOT EXISTS valoraciones (
          id          SERIAL PRIMARY KEY,
          firebase_uid VARCHAR(128) NOT NULL UNIQUE,
          nombre      VARCHAR(150),
          foto_url    TEXT,
          estrellas   INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
          comentario  TEXT NOT NULL,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('✅ Tabla de valoraciones verificada/creada')
      await client.query(`
        CREATE TABLE IF NOT EXISTS reportes (
          id                  SERIAL PRIMARY KEY,
          firebase_uid        VARCHAR(128),
          usuario_nombre      VARCHAR(150),
          nombre              VARCHAR(150) DEFAULT 'Sin nombre',
          raza                VARCHAR(100),
          color               VARCHAR(100),
          sexo                VARCHAR(20),
          lugar               VARCHAR(255),
          direccion_completa  VARCHAR(255),
          lat                 DECIMAL(10,7),
          lng                 DECIMAL(10,7),
          fecha               VARCHAR(20),
          hora_aproximada     VARCHAR(20),
          timestamp_registro  TIMESTAMP,
          telefono            VARCHAR(30),
          descripcion         TEXT,
          tipo                VARCHAR(30) DEFAULT 'perdido',
          estado              VARCHAR(30) DEFAULT 'activo',
          activo_para_todos   BOOLEAN DEFAULT true,
          dias_activo         INTEGER DEFAULT 0,
          created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      await client.query(`
        CREATE TABLE IF NOT EXISTS reporte_fotos (
          id          SERIAL PRIMARY KEY,
          reporte_id  INTEGER REFERENCES reportes(id) ON DELETE CASCADE,
          url         TEXT NOT NULL,
          orden       INTEGER DEFAULT 0
        )
      `)
      await client.query(`
        ALTER TABLE reportes
          ADD COLUMN IF NOT EXISTS firebase_uid       VARCHAR(128),
          ADD COLUMN IF NOT EXISTS usuario_nombre     VARCHAR(150),
          ADD COLUMN IF NOT EXISTS nombre             VARCHAR(150) DEFAULT 'Sin nombre',
          ADD COLUMN IF NOT EXISTS raza               VARCHAR(100),
          ADD COLUMN IF NOT EXISTS color              VARCHAR(100),
          ADD COLUMN IF NOT EXISTS sexo               VARCHAR(20),
          ADD COLUMN IF NOT EXISTS lugar              VARCHAR(255),
          ADD COLUMN IF NOT EXISTS direccion_completa VARCHAR(255),
          ADD COLUMN IF NOT EXISTS lat                DECIMAL(10,7),
          ADD COLUMN IF NOT EXISTS lng                DECIMAL(10,7),
          ADD COLUMN IF NOT EXISTS fecha              VARCHAR(20),
          ADD COLUMN IF NOT EXISTS hora_aproximada    VARCHAR(20),
          ADD COLUMN IF NOT EXISTS timestamp_registro TIMESTAMP,
          ADD COLUMN IF NOT EXISTS telefono           VARCHAR(30),
          ADD COLUMN IF NOT EXISTS descripcion        TEXT,
          ADD COLUMN IF NOT EXISTS tipo               VARCHAR(30) DEFAULT 'perdido',
          ADD COLUMN IF NOT EXISTS estado             VARCHAR(30) DEFAULT 'activo',
          ADD COLUMN IF NOT EXISTS activo_para_todos  BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS dias_activo        INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `)
      console.log('✅ Tablas de reportes verificadas/creadas')
    } catch (e) {
      console.error('⚠️ Error en migración de columnas:', e.message)
    }
    release()
  }
})

// ── Ruta raíz (migrada del backend Python) ──
app.get('/', (req, res) => {
  res.json({ mensaje: 'PAW FINDER API funcionando', version: '2.0' })
})

// ── Diagnóstico de email ──
// Verifica al arrancar (queda en los logs de Render) y expone un endpoint
// GET /api/email/verificar para comprobarlo manualmente cuando quieras,
// sin tener que crear una campaña de prueba cada vez.
const { verificarConexionEmail } = require('./services/email')
verificarConexionEmail().then(r => {
  if (r.ok) console.log('✅ Email:', r.motivo)
  else console.error('❌ Email mal configurado:', r.motivo, r.sugerencia || '')
})

app.get('/api/email/verificar', async (req, res) => {
  const resultado = await verificarConexionEmail()
  res.status(resultado.ok ? 200 : 500).json(resultado)
})

// ── Log del sistema (migrada del backend Python) ──
app.post('/log', async (req, res) => {
  const { action, detail } = req.body
  const fecha = new Date().toISOString()
  const linea = `[${fecha}] ${action}: ${detail}\n`
  
  const fs = require('fs')
  const path = require('path')
  const logPath = path.join(__dirname, '..', 'backend', 'logs', 'system_logs.txt')
  
  try {
    fs.appendFileSync(logPath, linea)
    res.json({ ok: true })
  } catch (e) {
    res.json({ ok: true, nota: 'log no guardado en archivo' })
  }
})

// ── Rutas ──
app.use('/api/auth', require('./routes/auth'))
app.use('/api/campanas', require('./routes/campanas'))
app.use('/api/veterinarias', require('./routes/veterinarias'))
app.use('/api/ruc', require('./routes/ruc'))
app.use('/api/adopciones', require('./routes/adopciones'))
app.use('/api/valoraciones', require('./routes/valoraciones'))
app.use('/api/reportes',    require('./routes/reportes'))
app.use('/api/notificaciones', require('./routes/notificaciones'))

const PORT = process.env.PORT || 3000
// Auto-crear tabla notificaciones si no existe
pool.query(`
  CREATE TABLE IF NOT EXISTS notificaciones (
    id               SERIAL PRIMARY KEY,
    usuario_id       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo             VARCHAR(30) DEFAULT 'similitud',
    mensaje          TEXT NOT NULL,
    similitud_pct    INTEGER DEFAULT 0,
    reporte_origen_id INTEGER REFERENCES reportes(id) ON DELETE SET NULL,
    reporte_destino_id INTEGER REFERENCES reportes(id) ON DELETE SET NULL,
    leida            BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => console.log('✅ Tabla notificaciones lista'))
  .catch(e => console.error('Error creando tabla notificaciones:', e.message))

app.listen(PORT, () => {
  console.log(`🐾 Servidor PAW FINDER corriendo en puerto ${PORT}`)
})