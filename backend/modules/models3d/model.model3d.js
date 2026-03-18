import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'

export const Model3D = sequelize.define('mod_model3d', {
    mod_int_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mod_txt_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    mod_txt_desc: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    mod_txt_glb_filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Nombre del archivo .glb en /public/models/'
    },
    mod_dec_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 19.90
    },
    mod_txt_category: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'DIGITALIZADO'
    },
    mod_txt_subcategory: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Sin Categoría'
    },
    mod_bool_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'mod_model3d',
    timestamps: true,
    createdAt: 'mod_dt_created',
    updatedAt: 'mod_dt_updated',
    paranoid: true, // Soft delete
    deletedAt: 'mod_dt_deleted'
})

// Modelo para compras de modelos 3D
export const Model3DPurchase = sequelize.define('mod_purchase', {
    pur_int_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    use_int_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    mod_int_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pur_txt_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING'
    },
    pur_txt_payment_id: {
        type: DataTypes.STRING(64),
        allowNull: true
    },
    pur_dec_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    pur_txt_delivery_status: {
        type: DataTypes.ENUM('ACCEPTED', 'IN_PROGRESS', 'DELIVERED'),
        allowNull: false,
        defaultValue: 'ACCEPTED'
    },
    pur_txt_delivery_estimate: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '1 día'
    },
    pur_int_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'mod_purchase',
    timestamps: true,
    createdAt: 'pur_dt_created',
    updatedAt: 'pur_dt_updated'
})

Model3DPurchase.belongsTo(Model3D, { foreignKey: 'mod_int_id', as: 'model' })
