import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'
export const Category = sequelize.define('inv_category', {
  cat_int_id: { type: DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  cat_txt_name: DataTypes.STRING(120),
  cat_txt_slug: DataTypes.STRING(120),
  cat_bol_active: { type: DataTypes.BOOLEAN, defaultValue:true }
},{ tableName:'inv_category', timestamps:false })
