import { DataTypes } from 'sequelize'
import { sequelize } from '../../config/db.js'

// Modelo de libro
const Book = sequelize.define('Book', {
    boo_int_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    boo_txt_title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    boo_txt_author: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    boo_txt_desc: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    boo_txt_pdf_filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Nombre del archivo PDF en backend/storage/books/'
    },
    boo_txt_cover_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Nombre de la imagen de portada en frontend/public/'
    },
    boo_dec_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 19.90
    },
    boo_bool_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'boo_book',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})

// Modelo de compra de libro
const BookPurchase = sequelize.define('BookPurchase', {
    bpu_int_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    use_int_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del usuario que compró'
    },
    boo_int_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del libro comprado'
    },
    bpu_txt_status: {
        type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED'),
        defaultValue: 'PENDING'
    },
    bpu_txt_payment_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'ID de transacción de MercadoPago'
    },
    bpu_dec_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: 'bpu_book_purchase',
    timestamps: true,
    createdAt: 'bpu_dt_created',
    updatedAt: 'bpu_dt_updated'
})

// Relaciones
Book.hasMany(BookPurchase, { foreignKey: 'boo_int_id', as: 'purchases' })
BookPurchase.belongsTo(Book, { foreignKey: 'boo_int_id', as: 'book' })

// Sincronizar tablas
const syncBookModels = async () => {
    try {
        await Book.sync({ alter: true })
        await BookPurchase.sync({ alter: true })
        console.log('[Books] Tablas sincronizadas')
    } catch (e) {
        console.error('[Books] Error sincronizando tablas:', e.message)
    }
}

export { Book, BookPurchase, syncBookModels }
