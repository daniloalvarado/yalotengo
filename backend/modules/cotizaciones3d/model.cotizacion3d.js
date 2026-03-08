import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'
import { User } from '../auth/model.user.js'

export const Cotizacion3D = sequelize.define('cotizacion3d', {
  cot_int_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  use_int_id: { type: DataTypes.INTEGER, allowNull: false },
  cot_txt_description: { type: DataTypes.TEXT, allowNull: false },
  cot_jso_images: { type: DataTypes.JSON, allowNull: false }, // [{url, filename}]
  cot_txt_phone: { type: DataTypes.STRING(20), allowNull: true },
  cot_bool_notify_whatsapp: { type: DataTypes.TINYINT, defaultValue: 0 },
  cot_bool_notify_email: { type: DataTypes.TINYINT, defaultValue: 0 },
  cot_txt_status: { 
    type: DataTypes.ENUM('Pendiente', 'Cotizado', 'Comprado', 'Rechazado'), 
    defaultValue: 'Pendiente' 
  },
  cot_txt_admin_response: { type: DataTypes.TEXT, allowNull: true },
  cot_dat_created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'cotizacion3d',
  timestamps: false
})

Cotizacion3D.belongsTo(User, { foreignKey: 'use_int_id', as: 'user' })
User.hasMany(Cotizacion3D, { foreignKey: 'use_int_id', as: 'cotizaciones' })
