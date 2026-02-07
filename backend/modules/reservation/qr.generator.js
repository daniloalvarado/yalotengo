import QRCode from 'qrcode'
import { s3, BUCKET } from '../../config/s3.js'

/**
 * Genera un código QR para una reserva y lo sube a MinIO
 * @param {string} qrCode - Código único de la reserva
 * @param {number} reservationId - ID de la reserva
 * @returns {Promise<string>} - Key del archivo en MinIO
 */
export async function generateAndUploadQR(qrCode, reservationId) {
    // Datos que contendrá el QR
    const qrData = JSON.stringify({
        code: qrCode,
        id: reservationId,
        type: 'MUSEO_TICKET',
        generated: new Date().toISOString()
    })

    // Generar QR como buffer PNG
    const qrBuffer = await QRCode.toBuffer(qrData, {
        type: 'png',
        width: 400,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // Alta corrección de errores
    })

    // Subir a MinIO / S3
    // Envolvemos en try/catch para que si falla (ej: localmente sin minio) no rompa la compra
    let key = null
    try {
        key = `qr-tickets/${reservationId}.png`
        await s3.putObject(BUCKET, key, qrBuffer, {
            'Content-Type': 'image/png'
        })
    } catch (e) {
        // Solo advertimos, no bloqueamos el flujo
        console.warn('[QR] No se pudo subir el QR a MinIO/S3 (esto es normal en local sin MinIO corriendo):', e.message)
    }

    return key
}

/**
 * Genera QR como Data URL (para mostrar directamente en frontend)
 * @param {string} qrCode - Código único de la reserva
 * @param {number} reservationId - ID de la reserva
 * @returns {Promise<string>} - Data URL del QR
 */
export async function generateQRDataURL(qrCode, reservationId) {
    const qrData = JSON.stringify({
        code: qrCode,
        id: reservationId,
        type: 'MUSEO_TICKET'
    })

    return await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H'
    })
}
