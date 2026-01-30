// backend/utils/upload.js
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Models go to backend/uploads/models
const modelsPath = path.join(__dirname, '../uploads/models')
// Books and Courses stay in public for now (can be moved later)
const publicPath = path.join(__dirname, '../../frontend/public')

// Ensure directories exist
const ensureDir = (basePath, dir) => {
    const fullPath = path.join(basePath, dir)
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
    }
    return fullPath
}

// Storage for Models 3D (.glb files)
const modelsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Usa la ruta del backend para modelos
        const fullPath = ensureDir(path.join(__dirname, '../uploads'), 'models')
        cb(null, fullPath)
    },
    filename: (req, file, cb) => {
        // Use original name (sanitized) as requested by the user
        const uniqueName = file.originalname.replace(/\s+/g, '_')
        cb(null, uniqueName)
    }
})

// Storage for Books (.pdf in backend, images in public)
const booksStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'pdfFile') {
            // PDFs go to secure backend storage
            const fullPath = ensureDir(path.join(__dirname, '../storage'), 'books')
            cb(null, fullPath)
        } else {
            // Covers go to public/libros
            cb(null, ensureDir(publicPath, 'libros'))
        }
    },
    filename: (req, file, cb) => {
        // Use original name (sanitized)
        const uniqueName = file.originalname.replace(/\s+/g, '_')
        cb(null, uniqueName)
    }
})

// Storage for Courses (images)
const coursesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, ensureDir(publicPath, 'cursos'))
    },
    filename: (req, file, cb) => {
        // Use original name (sanitized)
        const uniqueName = file.originalname.replace(/\s+/g, '_')
        cb(null, uniqueName)
    }
})

// File filters
const glbFilter = (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.glb')) {
        cb(null, true)
    } else {
        cb(new Error('Solo se permiten archivos .glb'), false)
    }
}

const pdfFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ext === '.pdf') {
        cb(null, true)
    } else {
        cb(new Error('Solo se permiten archivos .pdf'), false)
    }
}

const imageFilter = (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedExts.includes(ext)) {
        cb(null, true)
    } else {
        cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'), false)
    }
}

// Export upload middlewares
export const uploadModel = multer({
    storage: modelsStorage,
    fileFilter: glbFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
}).single('glbFile')

export const uploadBookPdf = multer({
    storage: booksStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
}).single('pdfFile')

export const uploadBookCover = multer({
    storage: booksStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
}).single('coverImage')

export const uploadCourseImage = multer({
    storage: coursesStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
}).single('courseImage')

// Combined upload for books (pdf + cover)
export const uploadBookFiles = multer({
    storage: booksStorage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase()
        if (ext === '.pdf' || ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error('Solo se permiten archivos PDF e imágenes'), false)
        }
    },
    limits: { fileSize: 100 * 1024 * 1024 }
}).fields([
    { name: 'pdfFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
])
