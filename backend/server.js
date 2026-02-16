import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import passport from 'passport'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import routes from './routes/index.js'
import { sequelize } from './config/db.js'
import { DataTypes } from 'sequelize'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.set('trust proxy', 1) // Necesario para Render/Heroku (para que detecte https)

// CORS
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim())
app.use(cors({
  origin: origins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], maxAge: 86400
}))
app.options('*', cors())

app.use(express.json())
app.use(helmet({
  crossOriginResourcePolicy: false,
}))
app.use(morgan('dev'))
app.use(passport.initialize())

// Rate Limiting Global (Para DoS - "Freno de emergencia")
// Permite muchas peticiones (1000) para que el usuario navegue tranquilo
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas peticiones generales. Calma un poco.'
})
app.use(globalLimiter)

// Rate Limiting Estricto (Para Fuerza Bruta en Login/Registro)
// Aquí es donde "intentan las millones de peticiones" para adivinar passwords
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Solo 20 intentos de login/registro cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos de inicio de sesión. Espere 15 min.'
})
// Aplicar SOLO a login y register, NO a /auth/me (que se llama en cada recarga)
app.use('/auth/login', authLimiter)
app.use('/auth/register', authLimiter)

import { getFileStream } from './services/storage.js'

// Proxy para servir archivos desde MinIO
app.get('/uploads/*', async (req, res) => {
  try {
    const key = req.params[0]
    const stream = await getFileStream(key)
    stream.pipe(res)
  } catch (err) {
    if (err.code === 'NoSuchKey') {
      return res.status(404).json({ error: 'File not found' })
    }
    console.error('[Proxy] Error serving file:', err.message)
    res.status(500).json({ error: 'Error serving file' })
  }
})

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/', routes)

const PORT = process.env.PORT || 3000

async function ensureSchema() {
  const qi = sequelize.getQueryInterface()
}



async function start() {
  try {
    await sequelize.authenticate()
    await sequelize.query("SET time_zone = '+00:00'")
    await ensureSchema()
    await sequelize.sync()
    app.listen(PORT, () => console.log('Backend on :' + PORT))
  } catch (err) {
    console.error('[Error] No se pudo conectar a la base de datos.')
    process.exit(1)
  }
}
start()