import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'
import { Translation } from './model.translation.js'

export const Microscopico = sequelize.define('mm_darwin_data', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  scientificName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  kingdom: { type: DataTypes.STRING },
  phylum: { type: DataTypes.STRING },
  subphylum: { type: DataTypes.STRING },
  class: { type: DataTypes.STRING },
  subclass: { type: DataTypes.STRING },
  order: { type: DataTypes.STRING },
  family: { type: DataTypes.STRING },
  genus: { type: DataTypes.STRING },
  specificEpithet: { type: DataTypes.STRING },
  
  vernacularName: { type: DataTypes.STRING },
  taxonRemarks: { type: DataTypes.TEXT },
  fuente: { type: DataTypes.TEXT },
  panel: { type: DataTypes.STRING },
  
  assetBundleFileName: { type: DataTypes.STRING },
  qr_image_url: { type: DataTypes.STRING },
  qr_image_url2: { type: DataTypes.STRING },
  
  estado: {
    type: DataTypes.ENUM('activo', 'desactivo', 'eliminado'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'mm_darwin_data',
  timestamps: true, // Esto creará createdAt y updatedAt
  createdAt: 'fecha_create',
  updatedAt: 'fecha_update',
  deletedAt: 'fecha_delete',
})

// Asociaciones de Idiomas
Microscopico.hasMany(Translation, {
  foreignKey: 'microscopico_id',
  as: 'translations'
})

Translation.belongsTo(Microscopico, {
  foreignKey: 'microscopico_id'
})
