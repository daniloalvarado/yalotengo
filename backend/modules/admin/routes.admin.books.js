import { Router } from 'express'
import { adminAuth } from '../../utils/adminAuth.js'
import { Book, BookPurchase } from '../books/model.book.js'
import { uploadBookFiles } from '../../utils/upload.js'
import { uploadFile, deleteFile } from '../../services/storage.js'

const r = Router()

// GET /admin/books - Listar todos
r.get('/', adminAuth, async (req, res) => {
    try {
        const books = await Book.findAll({
            order: [['created_at', 'DESC']]
        })
        res.json(books)
    } catch (err) {
        console.error('[Admin Books] list error:', err)
        res.status(500).json({ error: 'Error al listar libros' })
    }
})

// POST /admin/books/upload - Subir archivos (PDF y/o imagen)
r.post('/upload', adminAuth, (req, res) => {
    uploadBookFiles(req, res, async (err) => {
        if (err) {
            console.error('[Admin Books] upload error:', err)
            return res.status(400).json({ error: err.message || 'Error al subir archivos' })
        }

        try {
            const result = { ok: true }

            if (req.files?.pdfFile?.[0]) {
                const file = req.files.pdfFile[0]
                const filename = await uploadFile(file.buffer, 'books/pdf', file.originalname, file.mimetype)
                result.pdfFilename = filename
                result.pdfOriginalName = file.originalname
            }

            if (req.files?.coverImage?.[0]) {
                const file = req.files.coverImage[0]
                const filename = await uploadFile(file.buffer, 'books', file.originalname, file.mimetype)
                result.coverFilename = filename
                result.coverOriginalName = file.originalname
            }

            if (!result.pdfFilename && !result.coverFilename) {
                return res.status(400).json({ error: 'No se recibieron archivos' })
            }

            res.json(result)
        } catch (uploadErr) {
            console.error('[Admin Books] MinIO upload error:', uploadErr)
            res.status(500).json({ error: 'Error al guardar archivos en MinIO' })
        }
    })
})

// POST /admin/books - Crear
r.post('/', adminAuth, async (req, res) => {
    try {
        const { title, author, desc, pdfFilename, coverImage, price } = req.body

        if (!title) {
            return res.status(400).json({ error: 'Título es requerido' })
        }

        const book = await Book.create({
            boo_txt_title: title,
            boo_txt_author: author || null,
            boo_txt_desc: desc || null,
            boo_txt_pdf_filename: pdfFilename || null,
            boo_txt_cover_image: coverImage || null,
            boo_dec_price: price || 19.90,
            boo_bool_active: true
        })

        res.json({ ok: true, book })
    } catch (err) {
        console.error('[Admin Books] create error:', err)
        res.status(500).json({ error: 'Error al crear libro' })
    }
})

// PUT /admin/books/:id - Editar
r.put('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params
        const { title, author, desc, pdfFilename, coverImage, price } = req.body

        const book = await Book.findByPk(id)
        if (!book) {
            return res.status(404).json({ error: 'Libro no encontrado' })
        }

        // Si se sube nuevo PDF, borrar el anterior
        if (pdfFilename && book.boo_txt_pdf_filename && pdfFilename !== book.boo_txt_pdf_filename) {
            await deleteFile('books/pdf', book.boo_txt_pdf_filename)
        }

        // Si se sube nueva portada, borrar la anterior
        if (coverImage && book.boo_txt_cover_image && coverImage !== book.boo_txt_cover_image) {
            await deleteFile('books', book.boo_txt_cover_image)
        }

        if (title) book.boo_txt_title = title
        if (author !== undefined) book.boo_txt_author = author
        if (desc !== undefined) book.boo_txt_desc = desc
        if (pdfFilename !== undefined) book.boo_txt_pdf_filename = pdfFilename
        if (coverImage !== undefined) book.boo_txt_cover_image = coverImage
        if (price !== undefined) book.boo_dec_price = price

        await book.save()
        res.json({ ok: true, book })
    } catch (err) {
        console.error('[Admin Books] update error:', err)
        res.status(500).json({ error: 'Error al actualizar libro' })
    }
})

// PATCH /admin/books/:id/toggle - Activar/Desactivar
r.patch('/:id/toggle', adminAuth, async (req, res) => {
    try {
        const { id } = req.params
        const book = await Book.findByPk(id)
        if (!book) {
            return res.status(404).json({ error: 'Libro no encontrado' })
        }

        book.boo_bool_active = !book.boo_bool_active
        await book.save()

        res.json({ ok: true, active: book.boo_bool_active })
    } catch (err) {
        console.error('[Admin Books] toggle error:', err)
        res.status(500).json({ error: 'Error al cambiar estado' })
    }
})

// DELETE /admin/books/:id - Eliminar
r.delete('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params
        const book = await Book.findByPk(id)
        if (!book) {
            return res.status(404).json({ error: 'Libro no encontrado' })
        }

        // 🛡️ SAFE DELETION CHECK
        const purchases = await BookPurchase.findOne({
            where: {
                boo_int_id: id,
                bpu_txt_status: 'PAID'
            }
        })

        if (purchases) {
            return res.status(400).json({
                error: 'No se puede eliminar este libro porque ya ha sido comprado por usuarios. Por favor, desactívalo en su lugar.'
            })
        }

        // 🧹 CLEANUP: Delete pending/failed purchases (Cart items)
        await BookPurchase.destroy({
            where: {
                boo_int_id: id,
                bpu_txt_status: ['PENDING', 'FAILED']
            }
        })

        // Eliminar archivos físicos de MinIO
        if (book.boo_txt_pdf_filename) {
            await deleteFile('books/pdf', book.boo_txt_pdf_filename)
        }

        if (book.boo_txt_cover_image) {
            await deleteFile('books', book.boo_txt_cover_image)
        }

        await book.destroy()
        res.json({ ok: true })
    } catch (err) {
        console.error('[Admin Books] delete error:', err)
        res.status(500).json({ error: 'Error al eliminar libro' })
    }
})

export default r
