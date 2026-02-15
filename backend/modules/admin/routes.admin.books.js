import { Router } from 'express'
import { adminAuth } from '../../utils/adminAuth.js'
import { Book, BookPurchase } from '../books/model.book.js'
import { uploadBookFiles } from '../../utils/upload.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    uploadBookFiles(req, res, (err) => {
        if (err) {
            console.error('[Admin Books] upload error:', err)
            return res.status(400).json({ error: err.message || 'Error al subir archivos' })
        }

        const result = { ok: true }

        if (req.files?.pdfFile?.[0]) {
            result.pdfFilename = req.files.pdfFile[0].filename
            result.pdfOriginalName = req.files.pdfFile[0].originalname
        }

        if (req.files?.coverImage?.[0]) {
            result.coverFilename = req.files.coverImage[0].filename
            result.coverOriginalName = req.files.coverImage[0].originalname
        }

        if (!result.pdfFilename && !result.coverFilename) {
            return res.status(400).json({ error: 'No se recibieron archivos' })
        }

        res.json(result)
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

        // Eliminar archivos físicos
        // 1. Eliminar PDF (backend/storage/books)
        if (book.boo_txt_pdf_filename) {
            const pdfPath = path.join(__dirname, '../../storage/books', book.boo_txt_pdf_filename)
            if (fs.existsSync(pdfPath)) {
                try {
                    fs.unlinkSync(pdfPath)
                    console.log(`[Admin Books] Deleted PDF: ${pdfPath}`)
                } catch (e) {
                    console.error(`[Admin Books] Error deleting PDF: ${e}`)
                }
            }
        }

        // 2. Eliminar Portada (frontend/public/libros)
        if (book.boo_txt_cover_image) {
            const coverPath = path.join(__dirname, '../../../frontend/public/libros', book.boo_txt_cover_image)
            if (fs.existsSync(coverPath)) {
                try {
                    fs.unlinkSync(coverPath)
                    console.log(`[Admin Books] Deleted Cover: ${coverPath}`)
                } catch (e) {
                    // Try without 'libros' prefix if needed, but usually filename is just name
                    console.error(`[Admin Books] Error deleting Cover: ${e}`)
                }
            }
        }

        await book.destroy()
        res.json({ ok: true })
    } catch (err) {
        console.error('[Admin Books] delete error:', err)
        res.status(500).json({ error: 'Error al eliminar libro' })
    }
})

export default r
