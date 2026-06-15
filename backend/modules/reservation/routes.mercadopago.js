import { Router } from 'express'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { auth } from '../../utils/jwt.js'
import { Reservation } from './model.reservation.js'
import { generateAndUploadQR, generateQRDataURL } from './qr.generator.js'
import { User } from '../auth/model.user.js'

const r = Router()

// Inicializar cliente de Mercado Pago
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
})
const payment = new Payment(mpClient)

import { SysConfig } from '../config/model.config.js'

// Métodos offline
const OFFLINE_METHODS = ['yape', 'plin', 'pagoefectivo_atm', 'rapipago', 'pagofacil']

// Reglas de precios desde la base de datos
const getDynamicPrice = async () => {
    const configs = await SysConfig.findAll()
    const configMap = {}
    configs.forEach(c => configMap[c.key] = c.value)
    
    return parseFloat(configMap['RESERVATION_PRICE_PEN'] || '5.00')
}

// ============================================
// POST /reservations/:id/mercadopago
// Procesar pago con Mercado Pago
// ============================================
r.post('/:id/mercadopago', auth, async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.use_int_id
        const {
            token,
            payment_method_id,
            issuer_id,
            installments = 1,
            payer
        } = req.body

        // Buscar la reserva
        const reservation = await Reservation.findByPk(id)
        if (!reservation || reservation.use_int_id !== userId) {
            return res.status(404).json({ error: 'Reserva no encontrada' })
        }

        if (reservation.res_txt_status !== 'PENDING') {
            return res.status(400).json({ error: 'La reserva ya expiró' })
        }

        // Determinar precio desde la base de datos
        const amount = await getDynamicPrice()
        const currency = 'PEN'

        // Multiplicar por número de guests
        const totalAmount = amount * reservation.res_int_guests

        console.log(`[MercadoPago] Processing payment: ${payment_method_id}, ${currency} ${totalAmount}`)

        // Usar el email del formulario de pago (el que el usuario ingresa en el Brick)
        // IMPORTANTE: No usar el email del vendedor/cuenta MP del integrador
        const payerEmail = payer?.email || 'comprador@ejemplo.com'

        // Crear pago en Mercado Pago
        // Nota: No incluir currency_id, MP lo detecta automáticamente por país
        const paymentData = {
            transaction_amount: totalAmount,
            token: token,
            description: `Entrada Museo - ${reservation.res_int_guests} persona(s)`,
            installments: parseInt(installments, 10),
            payment_method_id: payment_method_id,
            issuer_id: issuer_id ? parseInt(issuer_id, 10) : undefined,
            payer: {
                email: payerEmail,
                identification: payer?.identification
            },
            metadata: {
                reservation_id: reservation.res_int_id,
                guests: reservation.res_int_guests,
                price_currency: currency // Solo para referencia interna
            }
        }

        const crypto = await import('crypto')
        const requestOptions = { idempotencyKey: crypto.randomBytes(16).toString('hex') }
        const paymentResponse = await payment.create({ body: paymentData, requestOptions })

        // Safely convert paymentResponse.id (may be BigInt in MP SDK v2)
        const mpPaymentId = String(paymentResponse.id)

        console.log(`[MercadoPago] Payment response:`, paymentResponse.status, mpPaymentId)

        // Verificar estado del pago
        if (paymentResponse.status === 'approved') {
            // Generar y subir QR
            const qrKey = await generateAndUploadQR(
                reservation.res_txt_qr_code,
                reservation.res_int_id
            )

            // Actualizar reserva a PAID
            reservation.res_txt_status = 'PAID'
            reservation.res_txt_qr_key = qrKey
            reservation.res_dec_price = totalAmount
            reservation.res_txt_currency = currency // USD o PEN
            reservation.res_txt_payment_id = mpPaymentId
            await reservation.save()

            // Generar QR como data URL
            const qrDataUrl = await generateQRDataURL(
                reservation.res_txt_qr_code,
                reservation.res_int_id
            )

            const user = await User.findByPk(userId)

            // Enviar correo de notificación al administrador
            import('../../services/email.service.js').then(({ notifyAdminReservation }) => {
                notifyAdminReservation({
                    id: reservation.res_int_id,
                    customerName: `${user.use_txt_nombres} ${user.use_txt_apellidos}`,
                    date: reservation.res_dt_date,
                    timeslot: reservation.res_txt_timeslot,
                    guests: reservation.res_int_guests,
                    total: totalAmount,
                    type: 'Pago Online'
                });
            }).catch(err => console.error('Error cargando email.service', err));

            return res.json({
                ok: true,
                status: 'approved',
                payment_id: mpPaymentId,
                reservation: {
                    id: reservation.res_int_id,
                    date: reservation.res_dt_date,
                    timeslot: reservation.res_txt_timeslot,
                    guests: reservation.res_int_guests,
                    status: reservation.res_txt_status,
                    price: reservation.res_dec_price,
                    currency: currency,
                    qrCode: reservation.res_txt_qr_code,
                    qrImage: qrDataUrl,
                    userName: `${user.use_txt_nombres} ${user.use_txt_apellidos}`
                }
            })
        } else if (paymentResponse.status === 'pending' || paymentResponse.status === 'in_process') {
            // Pago pendiente (común en métodos offline)
            reservation.res_txt_payment_id = mpPaymentId
            await reservation.save()

            return res.json({
                ok: true,
                status: paymentResponse.status,
                status_detail: paymentResponse.status_detail,
                payment_id: mpPaymentId,
                message: 'Pago pendiente de confirmación'
            })
        } else {
            // Pago rechazado
            return res.status(400).json({
                ok: false,
                status: paymentResponse.status,
                status_detail: paymentResponse.status_detail,
                error: 'El pago fue rechazado'
            })
        }

    } catch (err) {
        console.error('[MercadoPago] Payment error:', err?.message, 'status:', err?.status)

        // Manejar errores específicos de MP
        if (err.cause && Array.isArray(err.cause) && err.cause.length > 0) {
            return res.status(400).json({
                error: 'Error en el pago',
                details: err.cause
            })
        }

        // NEVER forward MP's 5xx — it's a payment processing issue, not our server crash
        const errorMsg = err?.message || 'Error al procesar el pago'
        res.status(400).json({ error: errorMsg })
    }
})

// ============================================
// GET /reservations/pricing
// Obtener precios dinámicos
// ============================================
r.get('/pricing', async (req, res) => {
    try {
        const amount = await getDynamicPrice()
        res.json({
            offline: { amount: amount, currency: 'PEN', label: `S/ ${amount.toFixed(2)}` },
            card: { amount: amount, currency: 'PEN', label: `S/ ${amount.toFixed(2)}` },
            methods: {
                offline: OFFLINE_METHODS,
                description: 'Todos los pagos usan PEN.'
            }
        })
    } catch(err) {
        res.status(500).json({ error: 'Error getting pricing' })
    }
})

export default r
