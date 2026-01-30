import { Router } from 'express'
import { auth } from '../../utils/jwt.js'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Model3DPurchase } from '../models3d/model.model3d.js'
import { BookPurchase } from '../books/model.book.js'
import { CoursePurchase } from '../courses/model.course.js'

const r = Router()

// Inicializar MercadoPago
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
const paymentClient = new Payment(mp)

// POST /cart/purchase - Procesar pago unificado de productos digitales
r.post('/purchase', auth, async (req, res) => {
    const { items, token, payment_method_id, issuer_id, installments = 1, payer } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No hay items para procesar' })
    }

    try {
        let totalAmount = 0
        const purchasesToUpdate = []

        // 1. Validar y recolectar items (deben ser PENDING y pertenecer al usuario)
        for (const item of items) {
            let purchaseRecord = null

            if (item.type === 'model') {
                purchaseRecord = await Model3DPurchase.findOne({
                    where: { pur_int_id: item.id, use_int_id: req.user.use_int_id, pur_txt_status: 'PENDING' }
                })
            } else if (item.type === 'book') {
                purchaseRecord = await BookPurchase.findOne({
                    where: { bpu_int_id: item.id, use_int_id: req.user.use_int_id, bpu_txt_status: 'PENDING' }
                })
            } else if (item.type === 'course') {
                purchaseRecord = await CoursePurchase.findOne({
                    where: { cpu_int_id: item.id, use_int_id: req.user.use_int_id, cpu_txt_status: 'PENDING' }
                })
            }

            if (purchaseRecord) {
                // Usamos el precio guardado en la tabla de compra
                const price = item.type === 'model' ? Number(purchaseRecord.pur_dec_amount)
                    : item.type === 'book' ? Number(purchaseRecord.bpu_dec_amount)
                        : Number(purchaseRecord.cpu_dec_amount)

                totalAmount += price
                purchasesToUpdate.push({ record: purchaseRecord, type: item.type })
            }
        }

        if (purchasesToUpdate.length === 0) {
            return res.status(400).json({ error: 'No se encontraron items válidos o pendientes de pago' })
        }

        // 2. Preparar datos de pago MercadoPago
        const payerEmail = payer?.email || req.user.use_txt_email || 'comprador@ejemplo.com'
        const description = `Compra digital: ${purchasesToUpdate.length} productos`

        const paymentData = {
            transaction_amount: totalAmount,
            token: token,
            description: description,
            installments: parseInt(installments, 10),
            payment_method_id: payment_method_id,
            issuer_id: issuer_id ? parseInt(issuer_id, 10) : undefined,
            payer: {
                email: payerEmail,
                identification: payer?.identification
            },
            metadata: {
                num_items: purchasesToUpdate.length,
                user_id: req.user.use_int_id
            }
        }

        console.log('[Cart] Processing unified payment:', totalAmount)

        // 3. Procesar pago
        const result = await paymentClient.create({ body: paymentData })

        if (result.status === 'approved') {
            // 4. Actualizar estado de todos los items
            const paymentId = String(result.id)

            await Promise.all(purchasesToUpdate.map(async ({ record, type }) => {
                if (type === 'model') {
                    record.pur_txt_status = 'PAID'
                    record.pur_txt_payment_id = paymentId
                } else if (type === 'book') {
                    record.bpu_txt_status = 'PAID'
                    // BookPurchase podría no tener campo payment_id explícito en el modelo, verifiquemos si existe o lo agregamos después
                    // Asumiendo que existe o ignorando si no (el status es lo importante)
                } else if (type === 'course') {
                    record.cpu_txt_status = 'PAID'
                }
                return record.save()
            }))

            return res.json({
                success: true,
                paymentId: result.id,
                status: 'approved',
                message: 'Pago realizado con éxito'
            })
        } else {
            // Marcar como fallidos (opcional, o dejarlos pending para reintentar)
            /* 
            await Promise.all(purchasesToUpdate.map(async ({ record, type }) => {
               // Update status to FAILED if desired
            })) 
            */
            return res.status(400).json({
                error: 'El pago no fue aprobado',
                status: result.status
            })
        }

    } catch (e) {
        console.error('[Cart] Payment error:', e)
        res.status(500).json({ error: 'Error al procesar el pago' })
    }
})

export default r
