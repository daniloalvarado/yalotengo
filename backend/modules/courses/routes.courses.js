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
// POST /courses/cart - Añadir al carrito (crear PENDING sin pago)
r.post('/cart', auth, async (req, res) => {
    const { courseId } = req.body

    try {
        const course = await Course.findByPk(courseId)
        if (!course || !course.cou_bool_active) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }

        // Validación de Cupos (Solo informativo, la reserva real es al pagar)
        if (course.cou_int_sold >= course.cou_int_seats) {
            return res.status(400).json({ error: 'Lo sentimos, este curso ya no tiene cupos disponibles.' })
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
            const newQuantity = (existing.cpu_int_quantity || 1) + 1
            // Check availability for NEW total quantity
            if (course.cou_int_sold + newQuantity > course.cou_int_seats) {
                return res.status(400).json({ error: `Solo quedan ${course.cou_int_seats - course.cou_int_sold} cupos disponibles.` })
            }
            existing.cpu_int_quantity = newQuantity
            await existing.save()

            return res.json({
                success: true,
                message: 'Cantidad actualizada',
                cartItem: {
                    id: existing.cpu_int_id,
                    courseId: courseId,
                    name: course.cou_txt_title,
                    price: course.cou_dec_price,
                    quantity: existing.cpu_int_quantity
                }
            })
        }

        // Check availability for quantity 1
        if (course.cou_int_sold + 1 > course.cou_int_seats) {
            return res.status(400).json({ error: 'Lo sentimos, este curso ya no tiene cupos disponibles.' })
        }

        // Crear registro PENDING
        const purchase = await CoursePurchase.create({
            use_int_id: req.user.use_int_id,
            cou_int_id: courseId,
            cpu_txt_status: 'PENDING',
            cpu_dec_amount: course.cou_dec_price,
            cpu_int_quantity: 1
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

// PUT /courses/:id - Actualizar curso (incluyendo cupos)
r.put('/:id', auth, async (req, res) => {
    // Verificar rol de administrador (asumiendo que auth middleware añade req.user)
    // TODO: Implementar middleware de rol si es necesario. Por ahora confiamos en auth.

    try {
        const course = await Course.findByPk(req.params.id)
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }

        const { cou_int_seats } = req.body
        if (cou_int_seats !== undefined) {
            course.cou_int_seats = cou_int_seats
        }

        // Actualizar otros campos si es necesario (el endpoint original no existía, lo añado para admin)
        // ...

        await course.save()
        res.json({ success: true, message: 'Curso actualizado', course })
    } catch (e) {
        console.error('[Courses] Update error:', e)
        res.status(500).json({ error: 'Error al actualizar curso' })
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

// PUT /courses/cart/:id - Actualizar cantidad
r.put('/cart/:id', auth, async (req, res) => {
    const { quantity } = req.body
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'Cantidad inválida' })

    try {
        const purchase = await CoursePurchase.findOne({
            where: {
                cpu_int_id: req.params.id,
                use_int_id: req.user.use_int_id,
                cpu_txt_status: 'PENDING'
            },
            include: [{ model: Course, as: 'course' }]
        })

        if (!purchase) return res.status(404).json({ error: 'Item no encontrado' })

        // Check availability
        if (purchase.course.cou_int_sold + quantity > purchase.course.cou_int_seats) {
            return res.status(400).json({ error: `Solo quedan ${purchase.course.cou_int_seats - purchase.course.cou_int_sold} cupos disponibles.` })
        }

        purchase.cpu_int_quantity = quantity
        await purchase.save()

        res.json({ success: true, message: 'Cantidad actualizada', quantity })
    } catch (e) {
        console.error('[Courses] Cart update error:', e)
        res.status(500).json({ error: 'Error al actualizar cantidad' })
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
// POST /courses/purchase - Comprar curso con MercadoPago
r.post('/purchase', auth, async (req, res) => {
    const { courseId, token, payment_method_id, issuer_id, installments = 1, payer, quantity = 1 } = req.body

    try {
        const course = await Course.findByPk(courseId)
        if (!course || !course.cou_bool_active) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }

        // --- CRITICAL SEAT CHECK ---
        // Verificar disponibilidad JUSTO ANTES de procesar
        if (course.cou_int_sold + quantity > course.cou_int_seats) {
            return res.status(400).json({ error: 'Lo sentimos, no hay suficientes cupos disponibles para completar tu compra.' })
        }
        // ---------------------------

        const price = Number(course.cou_dec_price) * quantity

        // Crear registro de compra pendiente
        const purchase = await CoursePurchase.create({
            use_int_id: req.user.use_int_id,
            cou_int_id: courseId,
            cpu_txt_status: 'PENDING',
            cpu_dec_amount: price,
            cpu_int_quantity: quantity
        })

        // Email del comprador
        const payerEmail = payer?.email || req.user.use_txt_email || 'comprador@ejemplo.com'

        // Datos del pago
        const paymentData = {
            transaction_amount: price,
            token: token,
            description: `Curso: ${course.cou_txt_title} (x${quantity})`,
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

            // --- INCREMENT SOLD COUNT ---
            try {
                // Read fresh to ensure accuracy
                const freshCourse = await Course.findByPk(courseId)
                if (freshCourse) {
                    freshCourse.cou_int_sold = (freshCourse.cou_int_sold || 0) + quantity
                    await freshCourse.save()
                }
            } catch (incError) {
                console.error('[Courses] Error incrementing sold count:', incError)
                // Payment was successful, so we don't fail the request, but log critical error
            }
            // -----------------------------

            // Enviar notificación al administrador
            import('../../services/email.service.js').then(({ notifyAdminPurchase }) => {
                const user = req.user;
                notifyAdminPurchase({
                    category: 'Cursos',
                    customerName: user ? `${user.use_txt_nombres} ${user.use_txt_apellidos}` : 'Usuario Registrado',
                    items: [{ name: course.cou_txt_title, quantity: quantity, price: course.cou_dec_price }],
                    total: price,
                    transactionId: result.id
                });
            }).catch(err => console.error('Error cargando email.service', err));

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
