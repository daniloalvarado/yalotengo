// backend/utils/upload.js
import multer from 'multer'
import path from 'path'

// Usamos memoria para poder subir a MinIO después
const storage = multer.memoryStorage()

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
    storage: storage,
    fileFilter: glbFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
}).single('glbFile')

export const uploadBookPdf = multer({
    storage: storage,
    fileFilter: pdfFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
}).single('pdfFile')

export const uploadBookCover = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
}).single('coverImage')

export const uploadCourseImage = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
}).single('courseImage')

// Combined upload for books (pdf + cover)
export const uploadBookFiles = multer({
    storage: storage,
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
    storage: storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
}).single('avatar')

// Storage for Printed Models (images)
export const uploadPrintedImage = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('printedImage')

