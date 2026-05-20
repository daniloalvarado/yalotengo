import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'

export const SysConfig = sequelize.define('sys_config', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'sys_config',
  timestamps: true
})

// Función helper para inicializar valores por defecto
export const initDefaultConfig = async () => {
  const defaults = [
    { key: 'RESERVATION_OPEN_TIME', value: '09:00' },
    { key: 'RESERVATION_CLOSE_TIME', value: '20:00' },
    { key: 'RESERVATION_SLOT_DURATION', value: '30' },
    { key: 'RESERVATION_MAX_CAPACITY', value: '10' },
    { key: 'RESERVATION_CLOSED_DAYS', value: '' }, // Fechas bloqueadas separadas por coma
    { key: 'RESERVATION_CLOSED_WEEKDAYS', value: '' } // Días de la semana bloqueados: 0=Dom, 1=Lun...
  ]

  for (const item of defaults) {
    const [config, created] = await SysConfig.findOrCreate({
      where: { key: item.key },
      defaults: { value: item.value }
    })
    // Si ya existía, no lo sobreescribimos para respetar los cambios que haya hecho el admin en la DB
  }
}
