import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'

// Modelo de curso
const Course = sequelize.define('Course', {
    cou_int_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cou_txt_title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    cou_txt_desc: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    cou_txt_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Nombre de la imagen en frontend/public/cursos/'
    },
    cou_dec_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 99.90
    },
    cou_txt_duration: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Duración del curso (ej: 4 semanas)'
    },
    cou_bool_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1
    },
    cou_int_seats: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
    },
    cou_int_sold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'cou_course',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})

// Modelo de compra de curso
const CoursePurchase = sequelize.define('CoursePurchase', {
    cpu_int_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    use_int_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del usuario que compró'
    },
    cou_int_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del curso comprado'
    },
    cpu_txt_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'PENDING'
    },
    cpu_txt_payment_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'ID de transacción de MercadoPago'
    },
    cpu_dec_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    cpu_int_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'cpu_course_purchase',
    timestamps: true,
    createdAt: 'cpu_dt_created',
    updatedAt: 'cpu_dt_updated'
})

// Relaciones
Course.hasMany(CoursePurchase, { foreignKey: 'cou_int_id', as: 'purchases' })
CoursePurchase.belongsTo(Course, { foreignKey: 'cou_int_id', as: 'course' })

export { Course, CoursePurchase }
