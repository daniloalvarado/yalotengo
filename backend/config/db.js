import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: false,
  timezone: '+00:00',
  // Configuración para conexiones más estables
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 2, // Dinámico: 2 para Render/Clever, 50 para VPS
    min: 0,
    acquire: 10000, // 10s: falla rápido en vez de colgar 90s
    idle: 5000 
  },
  dialectOptions: {
    connectTimeout: 5000  // 5s: si MySQL no responde en 5s, error inmediato
  },
  retry: {
    max: 3  // Reintentar hasta 3 veces
  }
})
