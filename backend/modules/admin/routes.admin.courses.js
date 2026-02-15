import { Router } from 'express'
import { adminAuth } from '../../utils/adminAuth.js'
import { Course, CoursePurchase } from '../courses/model.course.js'
import { uploadCourseImage } from '../../utils/upload.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const r = Router()

// GET /admin/courses - Listar todos
r.get('/', adminAuth, async (req, res) => {
    try {
        const courses = await Course.findAll({
            order: [['created_at', 'DESC']]
        })
        res.json(courses)
    } catch (err) {
        console.error('[Admin Courses] list error:', err)
        res.status(500).json({ error: 'Error al listar cursos' })
    }
})

// POST /admin/courses/upload - Subir imagen del curso
r.post('/upload', adminAuth, (req, res) => {
    uploadCourseImage(req, res, (err) => {
        if (err) {
            console.error('[Admin Courses] upload error:', err)
            return res.status(400).json({ error: err.message || 'Error al subir imagen' })
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió imagen' })
        }
        res.json({
            ok: true,
            filename: req.file.filename,
            originalName: req.file.originalname
        })
    })
})

// POST /admin/courses - Crear
r.post('/', adminAuth, async (req, res) => {
    try {
        const { title, desc, image, price, duration } = req.body

        if (!title) {
            return res.status(400).json({ error: 'Título es requerido' })
        }

        const course = await Course.create({
            cou_txt_title: title,
            cou_txt_desc: desc || null,
            cou_txt_image: image || null,
            cou_dec_price: price || 99.90,
            cou_txt_duration: duration || null,
            cou_bool_active: true,
            created_at: new Date(),
            updated_at: new Date()
        })

        res.json({ ok: true, course })
    } catch (err) {
        console.error('[Admin Courses] create error:', err)
        res.status(500).json({ error: 'Error al crear curso' })
    }
})

// PUT /admin/courses/:id - Editar
r.put('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params
        const { title, desc, image, price, duration } = req.body

        const course = await Course.findByPk(id)
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }

        if (title) course.cou_txt_title = title
        if (desc !== undefined) course.cou_txt_desc = desc
        if (image !== undefined) course.cou_txt_image = image
        if (price !== undefined) course.cou_dec_price = price
        if (duration !== undefined) course.cou_txt_duration = duration
        course.updated_at = new Date()

        await course.save()
        res.json({ ok: true, course })
    } catch (err) {
        console.error('[Admin Courses] update error:', err)
        res.status(500).json({ error: 'Error al actualizar curso' })
    }
})

// PATCH /admin/courses/:id/toggle - Activar/Desactivar
r.patch('/:id/toggle', adminAuth, async (req, res) => {
    try {
        const { id } = req.params
        const course = await Course.findByPk(id)
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }

        course.cou_bool_active = !course.cou_bool_active
        course.updated_at = new Date()
        await course.save()

        res.json({ ok: true, active: course.cou_bool_active })
    } catch (err) {
        console.error('[Admin Courses] toggle error:', err)
        res.status(500).json({ error: 'Error al cambiar estado' })
    }
})

// DELETE /admin/courses/:id - Eliminar
r.delete('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params
        const course = await Course.findByPk(id)
        if (!course) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }

        // 🛡️ SAFE DELETION CHECK
        const purchases = await CoursePurchase.findOne({
            where: {
                cou_int_id: id,
                cpu_txt_status: 'PAID'
            }
        })

        if (purchases) {
            return res.status(400).json({
                error: 'No se puede eliminar este curso porque ya ha sido comprado por usuarios. Por favor, desactívalo en su lugar.'
            })
        }

        // 🧹 CLEANUP: Delete pending/failed purchases (Cart items)
        await CoursePurchase.destroy({
            where: {
                cou_int_id: id,
                cpu_txt_status: ['PENDING', 'FAILED']
            }
        })

        // Eliminar imagen física (frontend/public/cursos)
        if (course.cou_txt_image) {
            const imagePath = path.join(__dirname, '../../../frontend/public/cursos', course.cou_txt_image)
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath)
                    console.log(`[Admin Courses] Deleted Image: ${imagePath}`)
                } catch (e) {
                    console.error(`[Admin Courses] Error deleting Image: ${e}`)
                }
            }
        }

        await course.destroy()
        res.json({ ok: true })
    } catch (err) {
        console.error('[Admin Courses] delete error:', err)
        res.status(500).json({ error: 'Error al eliminar curso' })
    }
})

export default r
