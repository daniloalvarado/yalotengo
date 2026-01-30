import { Router } from 'express'
import { Course, CoursePurchase } from './model.course.js'
import { auth } from '../../utils/jwt.js'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const r = Router()

// Inicializar MercadoPago
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
const paymentClient = new Payment(mp)

// GET /courses - Lista todos los cursos activos
r.get('/', async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { cou_bool_active: true },
            order: [['created_at', 'DESC']]
        })
        res.json(courses)
    } catch (e) {
        console.error('[Courses] Error listing:', e)
        res.status(500).json({ error: 'Error al obtener cursos' })
    }
})

// ========== CARRITO (PENDING) ==========
// IMPORTANTE: Estas rutas deben estar ANTES de /:id

// POST /courses/cart - Añadir al carrito (crear PENDING sin pago)
r.post('/cart', auth, async (req, res) => {
    const { courseId } = req.body

    try {
        const course = await Course.findByPk(courseId)
        if (!course || !course.cou_bool_active) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }

        // Verificar si ya existe en el carrito (PENDING)
        const existing = await CoursePurchase.findOne({
            where: {
                use_int_id: req.user.use_int_id,
                cou_int_id: courseId,
                cpu_txt_status: 'PENDING'
            }
        })

        if (existing) {
            return res.status(400).json({ error: 'Este curso ya está en tu carrito' })
        }

        // Crear registro PENDING
        const purchase = await CoursePurchase.create({
            use_int_id: req.user.use_int_id,
            cou_int_id: courseId,
            cpu_txt_status: 'PENDING',
            cpu_dec_amount: course.cou_dec_price
        })

        res.json({
            success: true,
            message: 'Curso añadido al carrito',
            cartItem: {
                id: purchase.cpu_int_id,
                courseId: courseId,
                name: course.cou_txt_title,
                price: course.cou_dec_price
            }
        })
    } catch (e) {
        console.error('[Courses] Cart add error:', e)
        res.status(500).json({ error: 'Error al añadir al carrito' })
    }
})

// GET /courses/cart - Listar productos PENDING del usuario
r.get('/cart', auth, async (req, res) => {
    try {
        const cartItems = await CoursePurchase.findAll({
            where: {
                use_int_id: req.user.use_int_id,
                cpu_txt_status: 'PENDING'
            },
            include: [{ model: Course, as: 'course' }],
            order: [['cpu_dt_created', 'DESC']]
        })
        res.json(cartItems)
    } catch (e) {
        console.error('[Courses] Cart list error:', e)
        res.status(500).json({ error: 'Error al obtener carrito' })
    }
})

// DELETE /courses/cart/:id - Eliminar del carrito
r.delete('/cart/:id', auth, async (req, res) => {
    try {
        const purchase = await CoursePurchase.findOne({
            where: {
                cpu_int_id: req.params.id,
                use_int_id: req.user.use_int_id,
                cpu_txt_status: 'PENDING'
            }
        })

        if (!purchase) {
            return res.status(404).json({ error: 'Item no encontrado en el carrito' })
        }

        await purchase.destroy()
        res.json({ success: true, message: 'Eliminado del carrito' })
    } catch (e) {
        console.error('[Courses] Cart delete error:', e)
        res.status(500).json({ error: 'Error al eliminar del carrito' })
    }
})

// ========== FIN CARRITO ==========

// GET /courses/:id - Detalle de un curso
r.get('/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id)
        if (!course || !course.cou_bool_active) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }
        res.json(course)
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener curso' })
    }
})

// POST /courses/purchase - Comprar curso con MercadoPago
r.post('/purchase', auth, async (req, res) => {
    const { courseId, token, payment_method_id, issuer_id, installments = 1, payer } = req.body

    try {
        const course = await Course.findByPk(courseId)
        if (!course || !course.cou_bool_active) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }

        const price = Number(course.cou_dec_price)

        // Crear registro de compra pendiente
        const purchase = await CoursePurchase.create({
            use_int_id: req.user.use_int_id,
            cou_int_id: courseId,
            cpu_txt_status: 'PENDING',
            cpu_dec_amount: price
        })

        // Email del comprador
        const payerEmail = payer?.email || req.user.use_txt_email || 'comprador@ejemplo.com'

        // Datos del pago
        const paymentData = {
            transaction_amount: price,
            token: token,
            description: `Curso: ${course.cou_txt_title}`,
            installments: parseInt(installments, 10),
            payment_method_id: payment_method_id,
            issuer_id: issuer_id ? parseInt(issuer_id, 10) : undefined,
            payer: {
                email: payerEmail,
                identification: payer?.identification
            },
            metadata: {
                purchaseId: purchase.cpu_int_id,
                courseId: courseId
            }
        }

        console.log('[Courses] Processing payment:', payment_method_id, price)

        // Procesar pago
        const result = await paymentClient.create({ body: paymentData })

        console.log('[Courses] Payment response:', result.status, result.id)

        if (result.status === 'approved') {
            purchase.cpu_txt_status = 'PAID'
            purchase.cpu_txt_payment_id = String(result.id)
            await purchase.save()

            return res.json({
                success: true,
                purchaseId: purchase.cpu_int_id,
                paymentId: result.id,
                status: 'approved'
            })
        } else {
            purchase.cpu_txt_status = 'FAILED'
            await purchase.save()
            return res.status(400).json({
                success: false,
                status: result.status,
                statusDetail: result.status_detail
            })
        }
    } catch (e) {
        console.error('[Courses] Payment error:', e)
        return res.status(500).json({
            error: 'Error procesando pago',
            detail: e.message
        })
    }
})

// GET /courses/my/purchases - Mis compras de cursos
r.get('/my/purchases', auth, async (req, res) => {
    try {
        const purchases = await CoursePurchase.findAll({
            where: {
                use_int_id: req.user.use_int_id,
                cpu_txt_status: 'PAID'
            },
            include: [{ model: Course, as: 'course' }],
            order: [['cpu_dt_created', 'DESC']]
        })
        res.json(purchases)
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener compras' })
    }
})

export default r
