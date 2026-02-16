import { Router } from 'express'
import { adminAuth } from '../../utils/adminAuth.js'
import { Model3D, Model3DPurchase } from '../models3d/model.model3d.js'
import { uploadModel, uploadPrintedImage } from '../../utils/upload.js'
import { uploadFile, deleteFile } from '../../services/storage.js'

const r = Router()

// GET /admin/models3d - Listar todos
r.get('/', adminAuth, async (req, res) => {
    try {
        const models = await Model3D.findAll({
            order: [['mod_dt_created', 'DESC']]
            // paranoid: true (default) - hides soft deleted
        })
        res.json(models)
    } catch (err) {
        console.error('[Admin Models3D] list error:', err)
        res.status(500).json({ error: 'Error al listar modelos' })
    }
})

// POST /admin/models3d/upload - Subir archivo GLB
r.post('/upload', adminAuth, (req, res) => {
    uploadModel(req, res, async (err) => {
        if (err) {
            console.error('[Admin Models3D] upload error:', err)
            return res.status(400).json({ error: err.message || 'Error al subir archivo' })
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió archivo GLB' })
        }

        try {
            const filename = await uploadFile(req.file.buffer, 'models', req.file.originalname, req.file.mimetype)
            res.json({
                ok: true,
                filename: filename,
                originalName: req.file.originalname
            })
        } catch (uploadErr) {
            console.error('[Admin Models3D] MinIO upload error:', uploadErr)
            res.status(500).json({ error: 'Error al subir GLB a MinIO' })
        }
    })
})

// POST /admin/models3d/upload-image - Subir imagen (para impresos)
r.post('/upload-image', adminAuth, (req, res) => {
    uploadPrintedImage(req, res, async (err) => {
        if (err) {
            console.error('[Admin Models3D] image upload error:', err)
            return res.status(400).json({ error: err.message || 'Error al subir imagen' })
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió imagen' })
        }

        try {
            const filename = await uploadFile(req.file.buffer, 'impresos', req.file.originalname, req.file.mimetype)
            res.json({
                ok: true,
                filename: filename,
                originalName: req.file.originalname
            })
        } catch (uploadErr) {
            console.error('[Admin Models3D] MinIO upload error:', uploadErr)
            res.status(500).json({ error: 'Error al subir imagen a MinIO' })
        }
    })
})

// POST /admin/models3d - Crear
r.post('/', adminAuth, async (req, res) => {
    try {
        // category defaults to DIGITALIZADO if not provided
        const { name, desc, glbFilename, price, category = 'DIGITALIZADO', printedImage } = req.body

        // Validation based on category
        if (!name) {
            return res.status(400).json({ error: 'El nombre es obligatorio' })
        }

        if (category === 'DIGITALIZADO' && !glbFilename) {
            return res.status(400).json({ error: 'Para modelos digitales, el archivo GLB es requerido' })
        }

        if (category === 'IMPRESO' && !printedImage) {
            return res.status(400).json({ error: 'Para modelos impresos, la imagen es requerida' })
        }

        const model = await Model3D.create({
            mod_txt_name: name,
            mod_txt_desc: desc || null,
            // For printed models, store image in glb_filename field (reusing column for simplicity, or we should use pro_txt_image if mapped?)
            // Model3D map: mod_txt_glb_filename. 
            // Better to use mod_txt_glb_filename for the main file asset (GLB or Image for printed).
            // Or use mod_txt_image for the cover/printed image.
            // Let's check Model3D definition. It usually has mod_txt_glb_filename.
            // If category is IMPRESO, likely 'printedImage' is the main asset visually.
            // Let's store printedImage in mod_txt_glb_filename so download logic works? No, download logic expects GLB.
            // Printed models are physical, no download.
            // So we should store printedImage in a new field or reuse one.
            // Let's re-check Model3D definition.
            mod_txt_glb_filename: category === 'DIGITALIZADO' ? glbFilename : printedImage, // Only for digital
            mod_txt_category: category,
            mod_dec_price: price || 19.90,
            mod_bool_active: true,
            // Store the printed image in a way frontend understands. 
            // We'll reuse mod_txt_glb_filename to store the image filename IF we want to reuse the column, 
            // BUT that column is for "File to download". Printed models don't have download.
            // However, we need to show the image. 
            // The frontend usually shows a preview. Digital models don't have a separate image column in this route (they use the GLB or auto-thumb).
            // Let's USE mod_txt_glb_filename to store the "Main Asset". 
            // If digital -> GLB. If Printed -> Image.
            // Frontend will render accordingly based on category.
            mod_dt_created: new Date(),
            mod_dt_updated: new Date()
        })

        res.json({ ok: true, model })
    } catch (err) {
        console.error('[Admin Models3D] create error:', err)
        res.status(500).json({ error: 'Error al crear modelo' })
    }
})

// PUT /admin/models3d/:id - Editar
r.put('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params
        const { name, desc, glbFilename, price, category, printedImage } = req.body

        const model = await Model3D.findByPk(id)
        if (!model) {
            return res.status(404).json({ error: 'Modelo no encontrado' })
        }

        // Delete old file if changing
        const oldFile = model.mod_txt_glb_filename
        const oldCategory = model.mod_txt_category

        if (name) model.mod_txt_name = name
        if (desc !== undefined) model.mod_txt_desc = desc
        if (price !== undefined) model.mod_dec_price = price
        if (category) model.mod_txt_category = category

        let newFilename = null
        if (category === 'DIGITALIZADO' && glbFilename) newFilename = glbFilename
        else if (category === 'IMPRESO' && printedImage) newFilename = printedImage
        else if (category === oldCategory) {
            if (category === 'DIGITALIZADO' && glbFilename) newFilename = glbFilename
            if (category === 'IMPRESO' && printedImage) newFilename = printedImage
        }

        if (newFilename && newFilename !== oldFile) {
            const folder = oldCategory === 'IMPRESO' ? 'impresos' : 'models'
            if (oldFile) { // Only try to delete if there was an old file
                await deleteFile(folder, oldFile)
            }
            model.mod_txt_glb_filename = newFilename
        } else if (category && category !== oldCategory) {
            // Category changed, old file invalid
            const folder = oldCategory === 'IMPRESO' ? 'impresos' : 'models'
            if (oldFile) { // Only try to delete if there was an old file
                await deleteFile(folder, oldFile)
            }
            model.mod_txt_glb_filename = newFilename || null
        }

        model.mod_dt_updated = new Date()

        await model.save()
        res.json({ ok: true, model })
    } catch (err) {
        console.error('[Admin Models3D] update error:', err)
        res.status(500).json({ error: 'Error al actualizar modelo' })
    }
})

// PATCH /admin/models3d/:id/toggle - Activar/Desactivar
r.patch('/:id/toggle', adminAuth, async (req, res) => {
    try {
        const { id } = req.params
        const model = await Model3D.findByPk(id)
        if (!model) {
            return res.status(404).json({ error: 'Modelo no encontrado' })
        }

        model.mod_bool_active = !model.mod_bool_active
        model.mod_dt_updated = new Date()
        await model.save()

        res.json({ ok: true, active: model.mod_bool_active })
    } catch (err) {
        console.error('[Admin Models3D] toggle error:', err)
        res.status(500).json({ error: 'Error al cambiar estado' })
    }
})

// DELETE /admin/models3d/:id - Eliminar
r.delete('/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params
        const model = await Model3D.findByPk(id)
        if (!model) {
            return res.status(404).json({ error: 'Modelo no encontrado' })
        }

        // 🛡️ SAFE DELETION CHECK
        const purchases = await Model3DPurchase.findOne({
            where: {
                mod_int_id: id,
                pur_txt_status: 'PAID'
            }
        })

        if (purchases) {
            return res.status(400).json({
                error: 'No se puede eliminar este modelo porque ya ha sido comprado. Desactívalo.'
            })
        }

        // 🧹 CLEANUP: Delete pending/failed purchases (Cart items)
        await Model3DPurchase.destroy({
            where: {
                mod_int_id: id,
                pur_txt_status: ['PENDING', 'FAILED']
            }
        })

        if (model.mod_txt_glb_filename) {
            const folder = model.mod_txt_category === 'IMPRESO' ? 'impresos' : 'models'
            try {
                await deleteFile(folder, model.mod_txt_glb_filename)
                console.log(`[Admin Models3D] Deleted file from storage: ${folder}/${model.mod_txt_glb_filename}`)
            } catch (err) {
                console.error(`[Admin Models3D] Error deleting file from storage: ${err}`)
            }
        }

        await model.destroy()
        res.json({ ok: true })
    } catch (err) {
        console.error('[Admin Models3D] delete error:', err)
        res.status(500).json({ error: 'Error al eliminar modelo' })
    }
})

// PUT /admin/models3d/purchase/:id/status - Actualizar estado y estimación
r.put('/purchase/:id/status', adminAuth, async (req, res) => {
    const { status, estimate } = req.body
    try {
        const purchase = await Model3DPurchase.findByPk(req.params.id)
        if (!purchase) {
            return res.status(404).json({ error: 'Compra no encontrada' })
        }

        if (status) purchase.pur_txt_delivery_status = status
        if (estimate) purchase.pur_txt_delivery_estimate = estimate

        await purchase.save()

        res.json({
            success: true,
            status: purchase.pur_txt_delivery_status,
            estimate: purchase.pur_txt_delivery_estimate
        })
    } catch (e) {
        console.error('[Admin Models3D] Status update error:', e)
        res.status(500).json({ error: 'Error al actualizar estado' })
    }
})

export default r
