import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'
import { Idioma } from './model.idioma.js'

export const UITranslation = sequelize.define('sys_ui_translations', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  language_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    references: {
      model: 'sys_languages',
      key: 'code'
    }
  },
  key: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Ej: btn_login, lbl_taxonomia'
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'sys_ui_translations',
  timestamps: true
})

// Relaciones
Idioma.hasMany(UITranslation, { foreignKey: 'language_code', as: 'ui_translations' })
UITranslation.belongsTo(Idioma, { foreignKey: 'language_code', as: 'language' })
