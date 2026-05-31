import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js' // Asegúrate que esta ruta sea correcta en tu proyecto

export const User = sequelize.define('core_user', {
  use_int_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  use_txt_nombres: DataTypes.STRING(120),
  use_txt_apellidos: DataTypes.STRING(120),
  use_txt_documento: DataTypes.STRING(20),
  use_txt_email: { type: DataTypes.STRING(160), unique: true },
  use_txt_passwordhash: DataTypes.STRING(120),
  use_txt_role: { type: DataTypes.STRING(20), defaultValue: 'cliente' },


  // --- AGREGA ESTAS DOS LÍNEAS ---
  use_txt_google_id: DataTypes.STRING(64), // Para guardar el ID de Google
  use_txt_avatar: DataTypes.TEXT,          // Para guardar la URL de la foto atual (MinIO o Provider)
  use_txt_provider_avatar: DataTypes.TEXT, // Backup: URL original de Google/FB
  use_txt_address: DataTypes.STRING(255),  // Dirección
  use_txt_phone: DataTypes.STRING(20),      // Teléfono

  // --- NUEVAS COLUMNAS PARA UNITY AR ---
  is_ar_user: { type: DataTypes.BOOLEAN, defaultValue: false },
  ar_name: DataTypes.STRING(120)
  // -------------------------------

}, { tableName: 'core_user', timestamps: false })