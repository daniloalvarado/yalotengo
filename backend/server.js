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
import { initMinio } from './config/s3.js'
import { initDefaultConfig } from './modules/config/model.config.js'

import { Tematica } from './modules/microscopicos/model.tematica.js'
import { Microscopico } from './modules/microscopicos/model.microscopico.js'
import { Idioma } from './modules/idiomas/model.idioma.js'
import { UITranslation } from './modules/idiomas/model.ui_translation.js'
import { autotranslate } from './modules/idiomas/routes.idiomas.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.set('trust proxy', 1) // Necesario para Render/Heroku (para que detecte https)

// --- DEBUG LOGGER ---
const errorLogs = [];
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
console.error = function(...args) {
  const msg = args.map(a => typeof a === 'object' ? (a instanceof Error ? a.stack || a.message : JSON.stringify(a, Object.getOwnPropertyNames(a))) : String(a)).join(' ');
  errorLogs.unshift(`[ERROR][${new Date().toISOString()}] ${msg}`);
  if (errorLogs.length > 200) errorLogs.length = 200;
  originalConsoleError.apply(console, args);
};
console.log = function(...args) {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  if (msg.includes('[Models3D]') || msg.includes('[Books]') || msg.includes('[Courses]')) {
    errorLogs.unshift(`[LOG][${new Date().toISOString()}] ${msg}`);
    if (errorLogs.length > 200) errorLogs.length = 200;
  }
  originalConsoleLog.apply(console, args);
};
app.get('/debug-logs', (req, res) => res.json(errorLogs));
// --------------------

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

import { getFileStream, getFileStats } from './services/storage.js'

// Proxy para servir archivos desde MinIO
app.get('/uploads/*', async (req, res) => {
  const key = req.params[0]
  try {
    // 1. Obtener metadata para saber el Content-Type
    const stats = await getFileStats(key)

    if (stats.metaData && stats.metaData['content-type']) {
      res.setHeader('Content-Type', stats.metaData['content-type'])
    } else {
      // Fallback simple
      if (key.endsWith('.glb')) res.setHeader('Content-Type', 'model/gltf-binary')
      if (key.endsWith('.jpg') || key.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg')
      if (key.endsWith('.png')) res.setHeader('Content-Type', 'image/png')
      if (key.endsWith('.pdf')) res.setHeader('Content-Type', 'application/pdf')
    }

    if (stats.size) {
      res.setHeader('Content-Length', stats.size)
    }

    // 2. Obtener y pipear el stream
    const stream = await getFileStream(key)
    stream.pipe(res)

  } catch (err) {
    if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
      console.warn(`[Proxy 404] File not found: ${key}`)
      return res.status(404).json({ error: 'File not found' })
    }
    console.error(`[Proxy Error] Serving ${key}:`, err.message)
    res.status(500).json({ error: 'Error serving file' })
  }
})

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/', routes)

const PORT = process.env.PORT || 3000

async function ensureSchema() {
  const qi = sequelize.getQueryInterface()
  try {
    const tableInfo = await qi.describeTable('mm_darwin_data')
    if (!tableInfo.fuente) {
      await qi.addColumn('mm_darwin_data', 'fuente', {
        type: DataTypes.TEXT,
        allowNull: true
      })
      console.log('[Schema] Columna fuente creada como TEXT')
    } else if (tableInfo.fuente.type === 'VARCHAR(255)' || tableInfo.fuente.type === 'CHARACTER VARYING(255)') {
      // Migrar de VARCHAR(255) a TEXT para soportar fuentes largas
      await qi.changeColumn('mm_darwin_data', 'fuente', {
        type: DataTypes.TEXT,
        allowNull: true
      })
      console.log('[Schema] Columna fuente migrada de VARCHAR(255) a TEXT')
    }
    if (tableInfo.panel) {
      try {
        await qi.renameColumn('mm_darwin_data', 'panel', 'tematica')
        console.log('[Schema] Columna panel renombrada a tematica')
      } catch (e) {
        console.warn('Nota: Ignorar si dice que no existe la columna durante renombrado múltiple.')
      }
    } else if (!tableInfo.tematica) {
      await qi.addColumn('mm_darwin_data', 'tematica', {
        type: DataTypes.STRING(255),
        allowNull: true
      })
      console.log('[Schema] Columna tematica creada')
    }
    
  } catch (e) {
    console.error('Error verificando esquema:', e.message)
  }
}

async function ensureTematicaId() {
  const qi = sequelize.getQueryInterface()
  try {
    const tableInfo = await qi.describeTable('mm_darwin_data')
    if (!tableInfo.tematica_id) {
      await qi.addColumn('mm_darwin_data', 'tematica_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'cat_tematica',
          key: 'id'
        }
      })
      console.log('[Schema] Columna tematica_id creada (después del sync)')
    }
  } catch (e) {
    console.error('Error verificando tematica_id:', e.message)
  }
}

async function migrateTematicas() {
  try {
    // 1. Obtener todos los modelos con temática de texto que no tienen tematica_id
    const modelos = await Microscopico.findAll({
      where: { tematica_id: null },
      attributes: ['id', 'tematica']
    })

    if (modelos.length === 0) return // Ya está migrado o no hay datos

    console.log(`[Migración] Encontrados ${modelos.length} modelos sin tematica_id.`)

    // 2. Extraer temáticas únicas, descartar vacías
    const tematicasUnicas = [...new Set(modelos.map(m => m.tematica).filter(t => t))]

    // 3. Crear temáticas y traducciones en la BD
    const idiomasActivos = await Idioma.findAll({ where: { is_active: true } })

    const cacheTematicas = {} // nombre -> id

    for (const nombreTematica of tematicasUnicas) {
      // Normalizar nombre (quitar acentos, espacios -> _, todo a minúsculas) para la key
      let keySlug = nombreTematica.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
        .replace(/[^a-z0-9]/g, '_') // caracteres no alfanuméricos por guión bajo
      
      const keyName = `tema_${keySlug}`

      // Buscar o crear la Tematica
      const [tematicaObj] = await Tematica.findOrCreate({
        where: { key_name: keyName },
        defaults: { nombre: nombreTematica.trim() }
      })
      cacheTematicas[nombreTematica] = tematicaObj.id

      // Auto-traducir para los idiomas activos
      for (const idioma of idiomasActivos) {
        // Verificar si ya existe la traducción UI
        const transExists = await UITranslation.findOne({
          where: { language_code: idioma.code, key: keyName }
        })

        if (!transExists) {
          let translatedText = nombreTematica
          if (idioma.code !== 'es') {
            translatedText = await autotranslate(nombreTematica, 'es', idioma.code)
          }
          await UITranslation.create({
            language_code: idioma.code,
            key: keyName,
            value: translatedText
          })
        }
      }
    }

    // 4. Actualizar modelos
    for (const model of modelos) {
      if (model.tematica && cacheTematicas[model.tematica]) {
        await model.update({ tematica_id: cacheTematicas[model.tematica] })
      }
    }

    console.log(`[Migración] Migración de temáticas completada con éxito.`)
  } catch (error) {
    console.error(`[Migración] Error al migrar temáticas:`, error)
  }
}




async function start() {
  try {
    await initMinio()
    await sequelize.authenticate()
    await sequelize.query("SET time_zone = '+00:00'")
    await ensureSchema()
    await sequelize.sync()
    await ensureTematicaId()
    await migrateTematicas()
    await initDefaultConfig()
    app.listen(PORT, () => console.log('Backend on :' + PORT))
  } catch (err) {
    console.error('[Error] No se pudo conectar a la base de datos.')
    process.exit(1)
  }
}
start()