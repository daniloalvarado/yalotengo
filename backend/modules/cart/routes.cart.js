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
            let courseRecord = null // Para verificar cupos si es curso

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
                    where: { cpu_int_id: item.id, use_int_id: req.user.use_int_id, cpu_txt_status: 'PENDING' },
                    include: [{ model: CoursePurchase.associations.course.target, as: 'course' }]
                })
                // Verificar Cupos si es Curso
                if (purchaseRecord && purchaseRecord.course) {
                    const qty = purchaseRecord.cpu_int_quantity || 1
                    if (purchaseRecord.course.cou_int_sold + qty > purchaseRecord.course.cou_int_seats) {
                        return res.status(400).json({
                            error: `El curso "${purchaseRecord.course.cou_txt_title}" no tiene suficientes cupos (${purchaseRecord.course.cou_int_seats - purchaseRecord.course.cou_int_sold} disponibles).`
                        })
                    }
                    courseRecord = purchaseRecord.course
                }
            }

            if (purchaseRecord) {
                // Precio base
                let price = 0
                let quantity = 1

                if (item.type === 'model') {
                    price = Number(purchaseRecord.pur_dec_amount)
                    quantity = purchaseRecord.pur_int_quantity || 1
                } else if (item.type === 'book') {
                    price = Number(purchaseRecord.bpu_dec_amount)
                } else if (item.type === 'course') {
                    price = Number(purchaseRecord.cpu_dec_amount)
                    quantity = purchaseRecord.cpu_int_quantity || 1
                }

                totalAmount += (price * quantity)
                purchasesToUpdate.push({ record: purchaseRecord, type: item.type, course: courseRecord, quantity })
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

            await Promise.all(purchasesToUpdate.map(async ({ record, type, course, quantity }) => {
                if (type === 'model') {
                    record.pur_txt_status = 'PAID'
                    record.pur_txt_payment_id = paymentId
                } else if (type === 'book') {
                    record.bpu_txt_status = 'PAID'
                } else if (type === 'course') {
                    record.cpu_txt_status = 'PAID'
                    record.cpu_txt_payment_id = paymentId
                    // Increment Course Sold Count
                    if (course) {
                        try {
                            // Check concurrency again? or just increment
                            // We rely on the initial check + optimistic 
                            course.cou_int_sold = (course.cou_int_sold || 0) + (quantity || 1)
                            await course.save()
                        } catch (err) { console.error('Error inc course sold', err) }
                    }
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
