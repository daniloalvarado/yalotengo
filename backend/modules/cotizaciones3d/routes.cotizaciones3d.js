import { Router } from 'express'
import { auth } from '../../utils/jwt.js'
import { adminAuth } from '../../utils/adminAuth.js'
import { uploadQuoteImages } from '../../utils/upload.js'
import { uploadFile, deleteFile } from '../../services/storage.js'
import { Cotizacion3D } from './model.cotizacion3d.js'

const r = Router()

// POST /cotizaciones3d - Crear una nueva cotización
r.post('/', auth, (req, res) => {
    uploadQuoteImages(req, res, async (err) => {
        if (err) {
            console.error('[Cotizaciones3D] upload error:', err)
            return res.status(400).json({ error: err.message || 'Error al subir imágenes' })
        }

        try {
            const { description, phone, notifyWhatsapp, notifyEmail } = req.body
            
            if (!description) {
                return res.status(400).json({ error: 'La descripción es obligatoria' })
            }

            const uploadedImages = []

            // Si hay imágenes, subirlas a MinIO
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const filename = await uploadFile(file.buffer, 'cotizaciones', file.originalname, file.mimetype)
                    uploadedImages.push({
                        filename: filename,
                        originalName: file.originalname
                    })
                }
            }

            const cotizacion = await Cotizacion3D.create({
                use_int_id: req.user.use_int_id,
                cot_txt_description: description,
                cot_jso_images: uploadedImages,
                cot_txt_phone: phone || null,
                cot_bool_notify_whatsapp: notifyWhatsapp === 'true' || notifyWhatsapp === true ? 1 : 0,
                cot_bool_notify_email: notifyEmail === 'true' || notifyEmail === true ? 1 : 0,
                cot_txt_status: 'Pendiente'
            })

            res.json({ ok: true, cotizacion })
        } catch (e) {
            console.error('[Cotizaciones3D] create error:', e)
            res.status(500).json({ error: 'Error al crear la cotización' })
        }
    })
})

// GET /cotizaciones3d/me - Ver mis cotizaciones
r.get('/me', auth, async (req, res) => {
    try {
        const cotizaciones = await Cotizacion3D.findAll({
            where: { use_int_id: req.user.use_int_id },
            order: [['cot_dat_created', 'DESC']]
        })
        res.json(cotizaciones)
    } catch (e) {
        console.error('[Cotizaciones3D] get me error:', e)
        res.status(500).json({ error: 'Error al obtener tus cotizaciones' })
    }
})

// PUT /cotizaciones3d/:id - Editar una cotización (Solo si está pendiente)
r.put('/:id', auth, (req, res) => {
    uploadQuoteImages(req, res, async (err) => {
        if (err) {
            console.error('[Cotizaciones3D] upload error (edit):', err)
            return res.status(400).json({ error: err.message || 'Error al subir imágenes' })
        }

        try {
            const { description, phone, notifyWhatsapp, notifyEmail, retainedImages } = req.body
            const cotizacion = await Cotizacion3D.findOne({
                where: {
                    cot_int_id: req.params.id,
                    use_int_id: req.user.use_int_id
                }
            })

            if (!cotizacion) {
                return res.status(404).json({ error: 'Cotización no encontrada' })
            }

            if (cotizacion.cot_txt_status !== 'Pendiente') {
                return res.status(400).json({ error: 'No puedes editar una cotización que ya ha sido procesada' })
            }

            // Manejo de imágenes (Retenidas + Nuevas)
            let parsedRetained = []
            if (retainedImages) {
                try {
                    parsedRetained = JSON.parse(retainedImages)
                } catch (e) {
                    console.error('Error parseando retainedImages:', e)
                }
            }

            const newUploadedImages = []
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const filename = await uploadFile(file.buffer, 'cotizaciones', file.originalname, file.mimetype)
                    newUploadedImages.push({
                        filename: filename,
                        originalName: file.originalname
                    })
                }
            }

            const finalImages = [...parsedRetained, ...newUploadedImages]

            if (finalImages.length === 0) {
                return res.status(400).json({ error: 'Debes incluir al menos 1 imagen referencial' })
            }

            if (finalImages.length > 5) {
                return res.status(400).json({ error: 'No puedes tener más de 5 imágenes en total' })
            }

            const oldImagesStr = typeof cotizacion.cot_jso_images === 'string' 
                ? JSON.parse(cotizacion.cot_jso_images) 
                : cotizacion.cot_jso_images || []
                
            const oldImages = Array.isArray(oldImagesStr) ? oldImagesStr : []

            const retainedFilenames = parsedRetained.map(i => i.filename)

            // Eliminar de MinIO las imágenes que ya no están retenidas
            for (const oldImg of oldImages) {
                if (!retainedFilenames.includes(oldImg.filename)) {
                    await deleteFile('cotizaciones', oldImg.filename)
                }
            }

            if (description) cotizacion.cot_txt_description = description
            if (phone !== undefined) cotizacion.cot_txt_phone = phone
            
            // Multipart envia 'true' o 'false' como string
            if (notifyWhatsapp !== undefined) cotizacion.cot_bool_notify_whatsapp = notifyWhatsapp === 'true' || notifyWhatsapp === true ? 1 : 0
            if (notifyEmail !== undefined) cotizacion.cot_bool_notify_email = notifyEmail === 'true' || notifyEmail === true ? 1 : 0
            
            cotizacion.cot_jso_images = finalImages
            await cotizacion.save()
            
            res.json({ ok: true, cotizacion })
        } catch (e) {
            console.error('[Cotizaciones3D] update error:', e)
            res.status(500).json({ error: 'Error al editar la cotización' })
        }
    })
})

// DELETE /cotizaciones3d/:id - Eliminar una cotización
r.delete('/:id', auth, async (req, res) => {
    try {
        const cotizacion = await Cotizacion3D.findOne({
            where: {
                cot_int_id: req.params.id,
                use_int_id: req.user.use_int_id
            }
        })

        if (!cotizacion) {
            return res.status(404).json({ error: 'Cotización no encontrada' })
        }

        if (cotizacion.cot_txt_status !== 'Pendiente') {
            return res.status(400).json({ error: 'No puedes eliminar una cotización que ya ha sido procesada' })
        }

        await cotizacion.destroy()
        res.json({ ok: true, message: 'Cotización eliminada correctamente' })
    } catch (e) {
        console.error('[Cotizaciones3D] delete error:', e)
        res.status(500).json({ error: 'Error al eliminar la cotización' })
    }
})


// ================== ZONA ADMINISTRADOR ==================

// GET /cotizaciones3d/admin - Listar todas (incluyendo datos de usuario)
r.get('/admin/all', adminAuth, async (req, res) => {
    try {
        // Necesitamos importar el modelo User para el include (Lo importamos en model.cotizacion3d.js, pero podemos usar asociaciones)
        const { User } = await import('../auth/model.user.js')
        
        const cotizaciones = await Cotizacion3D.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['use_txt_email', 'use_txt_nombres', 'use_txt_apellidos', 'use_txt_documento']
            }],
            order: [['cot_dat_created', 'DESC']]
        })
        res.json(cotizaciones)
    } catch (e) {
        console.error('[Cotizaciones3D Admin] get all error:', e)
        res.status(500).json({ error: 'Error al listar las cotizaciones' })
    }
})

// PATCH /cotizaciones3d/admin/:id - Cambiar estado y responder
r.patch('/admin/:id', adminAuth, async (req, res) => {
    try {
        const { status, adminResponse } = req.body
        const cotizacion = await Cotizacion3D.findByPk(req.params.id)

        if (!cotizacion) {
            return res.status(404).json({ error: 'Cotización no encontrada' })
        }

        if (status) {
            const validStatuses = ['Pendiente', 'Cotizado', 'Comprado', 'Rechazado']
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Estado inválido' })
            }
            cotizacion.cot_txt_status = status
        }

        if (adminResponse !== undefined) {
            cotizacion.cot_txt_admin_response = adminResponse
            // Si el admin envía una respuesta y el estado era Pendiente, pasarlo automáticamente a Cotizado
            if (cotizacion.cot_txt_status === 'Pendiente' && adminResponse.trim() !== '') {
                cotizacion.cot_txt_status = 'Cotizado'
            }
        }

        await cotizacion.save()
        res.json({ ok: true, cotizacion })
    } catch (e) {
        console.error('[Cotizaciones3D Admin] patch error:', e)
        res.status(500).json({ error: 'Error al actualizar la cotización' })
    }
})

export default r
