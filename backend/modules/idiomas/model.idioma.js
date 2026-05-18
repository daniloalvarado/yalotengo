import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'

export const Idioma = sequelize.define('sys_languages', {
  code: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'sys_languages',
  timestamps: true
})
