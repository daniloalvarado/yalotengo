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

// Storage for Books (.pdf in backend, images in backend/uploads/books)
const booksStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'pdfFile') {
            // PDFs go to secure backend storage (not public)
            const fullPath = ensureDir(path.join(__dirname, '../storage'), 'books')
            cb(null, fullPath)
        } else {
            // Covers go to backend/uploads/books (public via /uploads)
            const fullPath = ensureDir(path.join(__dirname, '../uploads'), 'books')
            cb(null, fullPath)
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = file.originalname.replace(/\s+/g, '_')
        cb(null, uniqueName)
    }
})

// Storage for Courses (images in backend/uploads/courses)
const coursesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fullPath = ensureDir(path.join(__dirname, '../uploads'), 'courses')
        cb(null, fullPath)
    },
    filename: (req, file, cb) => {
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

export const uploadAvatar = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            // Save to backend/uploads/avatars (accessible via /uploads/avatars)
            cb(null, ensureDir(path.join(__dirname, '../uploads'), 'avatars'))
        },
        filename: (req, file, cb) => {
            const uniqueName = `avatar_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`
            cb(null, uniqueName)
        }
    }),
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
}).single('avatar')

// Storage for Printed Models (images)
export const uploadPrintedImage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            // backend/uploads/impresos
            cb(null, ensureDir(path.join(__dirname, '../uploads'), 'impresos'))
        },
        filename: (req, file, cb) => {
            const uniqueName = `printed_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`
            cb(null, uniqueName)
        }
    }),
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('printedImage')
