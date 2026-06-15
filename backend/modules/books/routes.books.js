import { Router } from 'express'
import { Book, BookPurchase } from './model.book.js'
import { auth } from '../../utils/jwt.js'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getFileStream } from '../../services/storage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const r = Router()

// Inicializar MercadoPago
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
const paymentClient = new Payment(mp)

// GET /books - Lista todos los libros activos
r.get('/', async (req, res) => {
    try {
        const books = await Book.findAll({
            where: { boo_bool_active: true },
            order: [['created_at', 'DESC']]
        })
        res.json(books)
    } catch (e) {
        console.error('[Books] Error listing:', e)
        res.status(500).json({ error: 'Error al obtener libros' })
    }
})

// ========== CARRITO (PENDING) ==========
// IMPORTANTE: Estas rutas deben estar ANTES de /:id

// POST /books/cart - Añadir al carrito (crear PENDING sin pago)
r.post('/cart', auth, async (req, res) => {
    const { bookId } = req.body

    try {
        const book = await Book.findByPk(bookId)
        if (!book || !book.boo_bool_active) {
            return res.status(404).json({ error: 'Libro no encontrado' })
        }

        // Verificar si ya existe en el carrito (PENDING)
        const existing = await BookPurchase.findOne({
            where: {
                use_int_id: req.user.use_int_id,
                boo_int_id: bookId,
                bpu_txt_status: 'PENDING'
            }
        })

        if (existing) {
            return res.status(400).json({ error: 'Este libro ya está en tu carrito' })
        }

        // Verificar si ya lo compró (PAID)
        const purchased = await BookPurchase.findOne({
            where: {
                use_int_id: req.user.use_int_id,
                boo_int_id: bookId,
                bpu_txt_status: 'PAID'
            }
        })

        if (purchased) {
            return res.status(400).json({ error: 'Ya has comprado este libro anteriormente.' })
        }

        // Crear registro PENDING
        const purchase = await BookPurchase.create({
            use_int_id: req.user.use_int_id,
            boo_int_id: bookId,
            bpu_txt_status: 'PENDING',
            bpu_dec_amount: book.boo_dec_price
        })

        res.json({
            success: true,
            message: 'Libro añadido al carrito',
            cartItem: {
                id: purchase.bpu_int_id,
                bookId: bookId,
                name: book.boo_txt_title,
                price: book.boo_dec_price
            }
        })
    } catch (e) {
        console.error('[Books] Cart add error:', e)
        res.status(500).json({ error: 'Error al añadir al carrito' })
    }
})

// GET /books/cart - Listar productos PENDING del usuario
r.get('/cart', auth, async (req, res) => {
    try {
        const cartItems = await BookPurchase.findAll({
            where: {
                use_int_id: req.user.use_int_id,
                bpu_txt_status: 'PENDING'
            },
            include: [{ model: Book, as: 'book' }],
            order: [['bpu_dt_created', 'DESC']]
        })
        res.json(cartItems)
    } catch (e) {
        console.error('[Books] Cart list error:', e)
        res.status(500).json({ error: 'Error al obtener carrito' })
    }
})

// DELETE /books/cart/:id - Eliminar del carrito
r.delete('/cart/:id', auth, async (req, res) => {
    try {
        const purchase = await BookPurchase.findOne({
            where: {
                bpu_int_id: req.params.id,
                use_int_id: req.user.use_int_id,
                bpu_txt_status: 'PENDING'
            }
        })

        if (!purchase) {
            return res.status(404).json({ error: 'Item no encontrado en el carrito' })
        }

        await purchase.destroy()
        res.json({ success: true, message: 'Eliminado del carrito' })
    } catch (e) {
        console.error('[Books] Cart delete error:', e)
        res.status(500).json({ error: 'Error al eliminar del carrito' })
    }
})

// ========== FIN CARRITO ==========

// GET /books/:id - Detalle de un libro
r.get('/:id', async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id)
        if (!book || !book.boo_bool_active) {
            return res.status(404).json({ error: 'Libro no encontrado' })
        }
        res.json(book)
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener libro' })
    }
})

// POST /books/purchase - Comprar libro con MercadoPago
r.post('/purchase', auth, async (req, res) => {
    const { bookId, token, payment_method_id, issuer_id, installments = 1, payer } = req.body

    try {
        const book = await Book.findByPk(bookId)
        if (!book || !book.boo_bool_active) {
            return res.status(404).json({ error: 'Libro no encontrado' })
        }

        // Verificar si ya lo compró
        const existing = await BookPurchase.findOne({
            where: {
                use_int_id: req.user.use_int_id,
                boo_int_id: bookId,
                bpu_txt_status: 'PAID'
            }
        })

        if (existing) {
            return res.status(400).json({ error: 'Ya has comprado este libro anteriormente.' })
        }

        const price = Number(book.boo_dec_price)

        // Crear registro de compra pendiente
        const purchase = await BookPurchase.create({
            use_int_id: req.user.use_int_id,
            boo_int_id: bookId,
            bpu_txt_status: 'PENDING',
            bpu_dec_amount: price
        })

        // Email del comprador
        const payerEmail = payer?.email || req.user.use_txt_email || 'comprador@ejemplo.com'

        // Datos del pago
        const paymentData = {
            transaction_amount: price,
            token: token,
            description: `Libro: ${book.boo_txt_title}`,
            installments: installments ? parseInt(installments, 10) : 1,
            payment_method_id: payment_method_id,
            issuer_id: issuer_id ? parseInt(issuer_id, 10) : undefined,
            payer: {
                email: payerEmail,
                identification: payer?.identification
            },
            metadata: {
                purchase_id: purchase.bpu_int_id,
                book_id: bookId
            }
        }

        console.log('[Books] Processing payment:', payment_method_id, price)

        // Procesar pago
        const requestOptions = { idempotencyKey: crypto.randomUUID() }
        const result = await paymentClient.create({ body: paymentData, requestOptions })

        console.log('[Books] Payment response:', result.status, result.id)

        if (result.status === 'approved') {
            purchase.bpu_txt_status = 'PAID'
            purchase.bpu_txt_payment_id = String(result.id)
            await purchase.save()

            // Enviar notificación al administrador
            import('../../services/email.service.js').then(({ notifyAdminPurchase }) => {
                const user = req.user;
                notifyAdminPurchase({
                    category: 'Libros',
                    customerName: user ? `${user.use_txt_nombres} ${user.use_txt_apellidos}` : 'Usuario Registrado',
                    items: [{ name: book.boo_txt_title, quantity: 1, price: price }],
                    total: price,
                    transactionId: result.id
                });
            }).catch(err => console.error('Error cargando email.service', err));

            return res.json({
                success: true,
                purchaseId: purchase.bpu_int_id,
                paymentId: result.id,
                status: 'approved'
            })
        } else {
            purchase.bpu_txt_status = 'FAILED'
            await purchase.save()
            return res.status(400).json({
                success: false,
                status: result.status,
                statusDetail: result.status_detail
            })
        }
    } catch (e) {
        console.error('[Books] Payment error:', e)
        const errorDetail = e.cause && e.cause.length > 0 ? e.cause : e.message
        let safeErrorDetail = String(errorDetail)
        try { safeErrorDetail = JSON.stringify(errorDetail) } catch (err) {}
        return res.status(e.status || 500).json({
            error: `MP Error: ${safeErrorDetail}`,
            detail: errorDetail
        })
    }
})

// GET /books/download/:purchaseId - Descargar libro (solo si pagó)
r.get('/download/:purchaseId', auth, async (req, res) => {
    try {
        const purchase = await BookPurchase.findByPk(req.params.purchaseId, {
            include: [{ model: Book, as: 'book' }]
        })

        if (!purchase) {
            return res.status(404).json({ error: 'Compra no encontrada' })
        }

        if (purchase.use_int_id !== req.user.use_int_id) {
            return res.status(403).json({ error: 'No autorizado' })
        }

        if (purchase.bpu_txt_status !== 'PAID') {
            return res.status(402).json({ error: 'Pago no completado' })
        }

        const filename = purchase.book.boo_txt_pdf_filename
        // Construct the key for MinIO (folder + filename)
        // FOLDER_MAP['books/pdf'] -> 'libros/pdf'
        const key = `books/pdf/${filename}`

        // Construir nombre amigable para la descarga (usando el título del libro)
        // Ejemplo: "Física Cuántica.pdf" en lugar de "177123_fisica.pdf"
        const friendlyName = `${purchase.book.boo_txt_title}.pdf`.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ \.\-_]/g, '')

        try {
            const stream = await getFileStream(key)
            // Encode filename for UTF-8 support (modern browsers)
            const encodedName = encodeURIComponent(friendlyName)
            res.setHeader('Content-Disposition', `attachment; filename="${friendlyName}"; filename*=UTF-8''${encodedName}`)
            res.setHeader('Content-Type', 'application/pdf')
            stream.pipe(res)
        } catch (err) {
            console.error('[Books] S3 Error:', err)
            if (err.code === 'NoSuchKey') {
                return res.status(404).json({ error: 'Archivo no encontrado en el servidor' })
            }
            throw err
        }
    } catch (e) {
        console.error('[Books] Download error:', e)
        res.status(500).json({ error: 'Error al descargar' })
    }
})

// GET /books/my/purchases - Mis compras de libros
r.get('/my/purchases', auth, async (req, res) => {
    try {
        const purchases = await BookPurchase.findAll({
            where: {
                use_int_id: req.user.use_int_id,
                bpu_txt_status: 'PAID'
            },
            include: [{ model: Book, as: 'book' }],
            order: [['bpu_dt_created', 'DESC']]
        })
        res.json(purchases)
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener compras' })
    }
})

export default r
