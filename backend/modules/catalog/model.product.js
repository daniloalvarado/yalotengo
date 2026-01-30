import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'
export const Product = sequelize.define('inv_product', {
  pro_int_id: { type: DataTypes.INTEGER, autoIncrement:true, primaryKey:true },
  pro_txt_name: DataTypes.STRING(200),
  pro_txt_slug: { type: DataTypes.STRING(200), unique:true },
  pro_txt_desc: DataTypes.TEXT,
  pro_dec_price: DataTypes.DECIMAL(12,2),
  pro_bol_virtual: DataTypes.BOOLEAN,
  pro_txt_filekey: DataTypes.STRING(255),
  pro_int_stock: DataTypes.INTEGER,
  pro_txt_kind: { type: DataTypes.STRING(20), allowNull:false, defaultValue:'ARTICULO' },// 'ARTICULO' | 'LIBRO'
  pro_int_stock_min: DataTypes.INTEGER,
  cat_int_id: DataTypes.INTEGER,
  pro_txt_image: DataTypes.STRING(200),
  pro_bol_active: { type: DataTypes.BOOLEAN, defaultValue:true }
},{ tableName:'inv_product', timestamps:false })
