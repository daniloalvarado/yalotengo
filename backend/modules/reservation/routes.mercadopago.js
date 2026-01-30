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

// Métodos offline que usan PEN
const OFFLINE_METHODS = ['yape', 'plin', 'pagoefectivo_atm', 'rapipago', 'pagofacil']

// Reglas de precios por método de pago
const getPriceByMethod = (paymentMethodId) => {
    const isOffline = OFFLINE_METHODS.some(m =>
        paymentMethodId?.toLowerCase().includes(m.toLowerCase())
    )
    return isOffline
        ? { amount: 5.00, currency: 'PEN' }
        : { amount: 2.00, currency: 'USD' }
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

        // Determinar precio según método de pago
        const { amount, currency } = getPriceByMethod(payment_method_id)

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

        const paymentResponse = await payment.create({ body: paymentData })

        console.log(`[MercadoPago] Payment response:`, paymentResponse.status, paymentResponse.id)

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
            reservation.res_txt_payment_id = String(paymentResponse.id)
            await reservation.save()

            // Generar QR como data URL
            const qrDataUrl = await generateQRDataURL(
                reservation.res_txt_qr_code,
                reservation.res_int_id
            )

            const user = await User.findByPk(userId)

            return res.json({
                ok: true,
                status: 'approved',
                payment_id: paymentResponse.id,
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
            reservation.res_txt_payment_id = String(paymentResponse.id)
            await reservation.save()

            return res.json({
                ok: true,
                status: paymentResponse.status,
                status_detail: paymentResponse.status_detail,
                payment_id: paymentResponse.id,
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
        console.error('[MercadoPago] Payment error:', err)

        // Manejar errores específicos de MP
        if (err.cause) {
            return res.status(400).json({
                error: 'Error en el pago',
                details: err.cause
            })
        }

        res.status(500).json({ error: 'Error al procesar el pago' })
    }
})

// ============================================
// GET /reservations/pricing
// Obtener precios según método de pago
// ============================================
r.get('/pricing', (req, res) => {
    res.json({
        offline: { amount: 5.00, currency: 'PEN', label: 'S/ 5.00' },
        card: { amount: 2.00, currency: 'USD', label: '$ 2.00' },
        methods: {
            offline: OFFLINE_METHODS,
            description: 'Yape, Plin, PagoEfectivo usan PEN. Tarjetas usan USD.'
        }
    })
})

export default r
