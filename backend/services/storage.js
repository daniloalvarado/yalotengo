import { s3, BUCKET } from '../config/s3.js'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

/**
 * Subir un archivo a MinIO
 * @param {Buffer} buffer - El contenido del archivo
 * @param {string} folder - Carpeta destino (ej: 'books', 'courses')
 * @param {string} originalName - Nombre original del archivo
 * @param {string} mimetype - Tipo MIME (ej: 'image/jpeg')
 * @returns {Promise<string>} - Nombre del archivo guardado (key)
 */
const FOLDER_MAP = {
    'books': 'libros/portadas',
    'books/pdf': 'libros/pdf',
    'courses': 'cursos',
    'models': 'modelos',
    'impresos': 'impresos',
    'avatars': 'avatars'
}

/**
 * Helper to get mapped key
 */
function getMappedKey(folder, filename) {
    const mappedFolder = FOLDER_MAP[folder] || folder
    return `${mappedFolder}/${filename}`
}

/**
 * Subir un archivo a MinIO
 * @param {Buffer} buffer - El contenido del archivo
 * @param {string} folder - Carpeta destino (ej: 'books', 'courses')
 * @param {string} originalName - Nombre original del archivo
 * @param {string} mimetype - Tipo MIME (ej: 'image/jpeg')
 * @returns {Promise<string>} - Nombre del archivo guardado (key)
 */
export async function uploadFile(buffer, folder, originalName, mimetype) {
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)

    // Sanitize: remove special chars, spaces to underscores, keep alphanumeric
    const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 150)

    // Timestamp for uniqueness + safe name + extension
    const filename = `${Date.now()}_${safeName}${ext}`

    // Use helper to get full key with 'yalotengo' prefix and spanish folder
    const key = getMappedKey(folder, filename)

    await s3.putObject(BUCKET, key, buffer, {
        'Content-Type': mimetype
    })

    return filename
}

/**
 * Eliminar un archivo de MinIO
 * @param {string} folder - Carpeta (ej: 'books')
 * @param {string} filename - Nombre del archivo
 */
export async function deleteFile(folder, filename) {
    if (!filename) return
    const key = getMappedKey(folder, filename)
    try {
        await s3.removeObject(BUCKET, key)
    } catch (e) {
        console.error(`[Storage] Error deleting ${key}:`, e.message)
    }
}

/**
 * Generar URL firmada (opcional, si quisieras URLs temporales)
 * Pero por ahora usaremos un proxy público.
 */
export async function getSignedUrl(folder, filename) {
    const key = `${folder}/${filename}`
    return await s3.presignedGetObject(BUCKET, key, 24 * 60 * 60) // 24 horas
}

/**
 * Obtener metadata de un archivo (para Content-Type y Length)
 */
export async function getFileStats(key) {
    const parts = key.split('/')
    if (parts.length < 2) return await s3.statObject(BUCKET, key)

    const folder = parts[0]
    const filename = parts.slice(1).join('/')
    const mappedKey = getMappedKey(folder, filename)

    return await s3.statObject(BUCKET, mappedKey)
}

/**
 * Obtener stream de un archivo para servirlo
 * @param {string} key - Clave del archivo como viene del request (ej: 'books/cover.jpg')
 */
export async function getFileStream(key) {
    // Key comes as 'folder/filename' (e.g. 'books/123.jpg')
    const parts = key.split('/')
    if (parts.length < 2) return await s3.getObject(BUCKET, key) // Fallback

    const folder = parts[0]
    const filename = parts.slice(1).join('/')

    // Map internal folder (books) to storage folder (yalotengo/libros)
    const mappedKey = getMappedKey(folder, filename)
    return await s3.getObject(BUCKET, mappedKey)
}
