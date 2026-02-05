import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import passport from 'passport'
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
}

async function start() {
  try {
    await sequelize.authenticate()
    await sequelize.query("SET time_zone = '+00:00'")
    await ensureSchema()
    await sequelize.sync()
    app.listen(PORT, () => console.log('Backend on :' + PORT))
  } catch (err) {
    console.error('[Error] No se pudo conectar a la base de datos:', err.message)
    process.exit(1)
  }
}
start()