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
app.use('/auth', authLimiter) // Aplica SOLO a rutas que empiezan con /auth

// Servir archivos estáticos (modelos 3D, PDFs, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/', routes)

const PORT = process.env.PORT || 3000

async function ensureSchema() {
  const qi = sequelize.getQueryInterface()

  // inv_product.pro_txt_kind
  try {
    const desc = await qi.describeTable('inv_product')
    if (!('pro_txt_kind' in desc)) {
      await qi.addColumn('inv_product', 'pro_txt_kind', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'ARTICULO'
      })
    }
  } catch (e) { /* tabla puede no existir */ }

  // res_reservation campos para MercadoPago
  try {
    const desc = await qi.describeTable('res_reservation')
    if (!('res_txt_currency' in desc)) {
      await qi.addColumn('res_reservation', 'res_txt_currency', {
        type: DataTypes.STRING(3),
        allowNull: true,
        defaultValue: 'PEN'
      })
    }
    if (!('res_txt_payment_id' in desc)) {
      await qi.addColumn('res_reservation', 'res_txt_payment_id', {
        type: DataTypes.STRING(64),
        allowNull: true
      })
    }
  } catch (e) { /* tabla puede no existir */ }

  // mod_purchase campos para Impresiones 3D
  try {
    const desc = await qi.describeTable('mod_purchase')

    // Columna de estado (update definition)
    // Note: Changing ENUM in existing column via Sequelize is tricky/not supported directly in sync.
    // We rely on the user running the SQL or catch the mismatch. 
    // Ideally we check if column exists, if so we assume user ran SQL or we try to alter.
    // For simplicity/safety, we just check existence to not crash.
    if (!('pur_txt_delivery_status' in desc)) {
      await qi.addColumn('mod_purchase', 'pur_txt_delivery_status', {
        type: DataTypes.ENUM('ACCEPTED', 'IN_PROGRESS', 'DELIVERED'),
        allowNull: false,
        defaultValue: 'ACCEPTED'
      })
    }

    // Columna de estimación
    if (!('pur_txt_delivery_estimate' in desc)) {
      await qi.addColumn('mod_purchase', 'pur_txt_delivery_estimate', {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '1 día'
      })
    }
  } catch (e) { /* tabla puede no existir */ }

  // mod_purchase campos para Impresiones 3D (Cantidad)
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('mod_purchase')
    if (!('pur_int_quantity' in desc)) {
      await qi.addColumn('mod_purchase', 'pur_int_quantity', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      })
    }
  } catch (e) { /* tabla puede no existir */ }

  // cou_course campos para Cupos
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('cou_course')
    if (!('cou_int_seats' in desc)) {
      await qi.addColumn('cou_course', 'cou_int_seats', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
      })
    }
    if (!('cou_int_sold' in desc)) {
      await qi.addColumn('cou_course', 'cou_int_sold', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      })
    }
  } catch (e) { /* tabla puede no existir */ }

  // cpu_course_purchase campos (Cantidad)
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('cpu_course_purchase')
    if (!('cpu_int_quantity' in desc)) {
      await qi.addColumn('cpu_course_purchase', 'cpu_int_quantity', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      })
    }
  } catch (e) { /* tabla puede no existir */ }

  // mod_model3d para Soft Delete
  try {
    const qi = sequelize.getQueryInterface()
    const desc = await qi.describeTable('mod_model3d')
    if (!('mod_dt_deleted' in desc)) {
      await qi.addColumn('mod_model3d', 'mod_dt_deleted', {
        type: DataTypes.DATE,
        allowNull: true
      })
    }
  } catch (e) { /* tabla puede no existir */ }
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