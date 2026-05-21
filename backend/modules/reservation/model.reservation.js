import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'
import crypto from 'crypto'
import { SysConfig } from '../config/model.config.js'

// Modelo de Reserva de Ticket para Museo
export const Reservation = sequelize.define('res_reservation', {
  res_int_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  use_int_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK al usuario que hace la reserva'
  },
  res_dt_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Fecha de la visita (YYYY-MM-DD)'
  },
  res_txt_timeslot: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'Hora de inicio del slot (ej: "10:00")'
  },
  res_txt_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'PENDING',
    comment: 'PENDING | PAID | USED | EXPIRED | CANCELLED'
  },
  res_txt_qr_code: {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true,
    comment: 'Código único para el QR de entrada'
  },
  res_txt_qr_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Ruta del archivo QR en MinIO'
  },
  res_dec_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Precio pagado por la entrada'
  },
  res_int_guests: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Número de personas en esta reserva'
  },
  res_dt_created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  res_dt_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha/hora cuando se usó el ticket'
  },
  res_txt_payment_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'ID de transacción de Mercado Pago'
  },
  res_txt_currency: {
    type: DataTypes.STRING(3),
    allowNull: true,
    defaultValue: 'PEN',
    comment: 'Moneda del pago: PEN o USD'
  }
}, {
  tableName: 'res_reservation',
  timestamps: false,
  hooks: {
    beforeCreate: (reservation) => {
      // Generar código QR único automáticamente
      if (!reservation.res_txt_qr_code) {
        reservation.res_txt_qr_code = crypto.randomBytes(24).toString('hex')
      }
    }
  }
})

// Función helper para generar slots del día (Ahora Asíncrona consultando BD)
export async function generateTimeSlots() {
  const configs = await SysConfig.findAll()
  const configMap = {}
  configs.forEach(c => configMap[c.key] = c.value)

  const openTime = configMap['RESERVATION_OPEN_TIME'] || '09:00'
  const closeTime = configMap['RESERVATION_CLOSE_TIME'] || '20:00'
  const slotDuration = parseInt(configMap['RESERVATION_SLOT_DURATION'] || '30', 10)

  const slots = []
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)

  let currentMinutes = openHour * 60 + openMin
  const closeMinutes = closeHour * 60 + closeMin

  // El último slot debe TERMINAR a más tardar en la hora de cierre
  while (currentMinutes + slotDuration <= closeMinutes) {
    const hour = Math.floor(currentMinutes / 60)
    const min = currentMinutes % 60
    const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
    slots.push(timeStr)
    currentMinutes += slotDuration
  }

  return { slots, openTime, closeTime }
}

// Función para obtener capacidad máxima
export async function getMaxCapacity() {
  const capConfig = await SysConfig.findByPk('RESERVATION_MAX_CAPACITY')
  return parseInt(capConfig ? capConfig.value : '10', 10)
}
