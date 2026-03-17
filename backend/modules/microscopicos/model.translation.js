import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'

export const Translation = sequelize.define('mm_darwin_translations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  microscopico_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255)
  },
  taxonomia: {
    type: DataTypes.TEXT
  },
  descripcion: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'mm_darwin_translations',
  timestamps: false
})
