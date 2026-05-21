import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'

export const Tematica = sequelize.define('cat_tematica', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'cat_tematica',
  timestamps: true
})
