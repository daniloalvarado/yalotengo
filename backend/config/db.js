import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
  timezone: '+00:00',
  // Configuración para conexiones más estables
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,  // 60 segundos para adquirir conexión
    idle: 10000
  },
  dialectOptions: {
    connectTimeout: 60000  // 60 segundos timeout de conexión
  },
  retry: {
    max: 3  // Reintentar hasta 3 veces
  }
})
