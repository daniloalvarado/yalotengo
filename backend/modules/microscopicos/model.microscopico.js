import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'

export const Microscopico = sequelize.define('microscopico', {
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
  
  assetBundleFileName: { type: DataTypes.STRING },
  
  estado: {
    type: DataTypes.ENUM('activo', 'desactivo', 'eliminado'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'microscopico',
  timestamps: true, // Esto creará createdAt y updatedAt
  createdAt: 'fecha_create',
  updatedAt: 'fecha_update',
  deletedAt: 'fecha_delete',
  paranoid: false // Si es true, usa deletedAt. Lo manejamos con 'estado' pero añadiremos fecha_delete manualmente si se elimina de forma suave.
})
