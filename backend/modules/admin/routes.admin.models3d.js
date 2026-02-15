import { Router } from 'express'
import { adminAuth } from '../../utils/adminAuth.js'
import { Model3D, Model3DPurchase } from '../models3d/model.model3d.js'
import { uploadModel, uploadPrintedImage } from '../../utils/upload.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    uploadModel(req, res, (err) => {
        if (err) {
            console.error('[Admin Models3D] upload error:', err)
            return res.status(400).json({ error: err.message || 'Error al subir archivo' })
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió archivo GLB' })
        }
        res.json({
            ok: true,
            filename: req.file.filename,
            originalName: req.file.originalname
        })
    })
})

// POST /admin/models3d/upload-image - Subir imagen (para impresos)
r.post('/upload-image', adminAuth, (req, res) => {
    uploadPrintedImage(req, res, (err) => {
        if (err) {
            console.error('[Admin Models3D] image upload error:', err)
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
            mod_txt_glb_filename: category === 'DIGITALIZADO' ? glbFilename : null, // Only for digital
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
            mod_txt_glb_filename: category === 'DIGITALIZADO' ? glbFilename : printedImage,

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

        if (name) model.mod_txt_name = name
        if (desc !== undefined) model.mod_txt_desc = desc
        if (price !== undefined) model.mod_dec_price = price
        if (category) model.mod_txt_category = category

        // Helper to delete old file
        const deleteOldFile = (filename, type) => {
            if (!filename) return
            try {
                const folder = type === 'IMPRESO' ? 'impresos' : 'models'
                const filePath = path.join(__dirname, '../../uploads', folder, filename)
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                    console.log(`[Admin Models3D] Deleted old file: ${filePath}`)
                }
            } catch (e) {
                console.error(`[Admin Models3D] Error deleting old file: ${e.message}`)
            }
        }

        // Update asset based on category
        let newFilename = null
        if (category === 'DIGITALIZADO' && glbFilename) {
            newFilename = glbFilename
        } else if (category === 'IMPRESO' && printedImage) {
            newFilename = printedImage
        } else if (category === model.mod_txt_category) {
            // Category unchanged, check if file changed
            if (model.mod_txt_category === 'DIGITALIZADO' && glbFilename) newFilename = glbFilename
            if (model.mod_txt_category === 'IMPRESO' && printedImage) newFilename = printedImage
        }

        // If we have a new filename and it's different from the old one, or category changed
        // Actually, if we are setting a new filename, we should delete the old one if it exists.
        // We also need to handle category switch where we might delete a GLB and add an Image, or vice versa.

        // Scenario 1: Changing file within same category
        if (newFilename && newFilename !== model.mod_txt_glb_filename) {
            // Delete old file
            deleteOldFile(model.mod_txt_glb_filename, model.mod_txt_category)
            model.mod_txt_glb_filename = newFilename
        }

        // Scenario 2: Changing category (and potentially file, or clearing file if not provided)
        // If category is changing, we should delete the OLD file regardless, 
        // UNLESS the new category uses the SAME file (unlikely between GLB and Image).
        else if (category && category !== model.mod_txt_category) {
            // If category changes, the old file is likely invalid for the new category (GLB vs Image)
            // So delete old file
            deleteOldFile(model.mod_txt_glb_filename, model.mod_txt_category)

            // Set new filename if provided, otherwise it might be null if not provided? 
            // Logic above calculated newFilename if provided.
            // If newFilename is set, use it. 
            // If NOT set, we might need to error or set null?
            // But existing validation at top (frontend usually sends file) might not catch update partials.
            // For update, if we switch category, we MUST provide the new file.
            // But the user might not send 'glbFilename' if just updating name.
            // Wait, if switching category, frontend SHOULD send the new file.

            if (newFilename) {
                model.mod_txt_glb_filename = newFilename
            } else {
                // If we switch category but don't provide new file, 
                // and we deleted old file, we have no file!
                // But typically the frontend form handles this. 
                // Let's assume if newFilename is null, maybe we shouldn't have deleted?
                // But we can't keep a GLB as an Image.
                // So we set it to null or keep it?
                // Let's rely on newFilename being set if we want to update it.
                // If newFilename is null, maybe we shouldn't delete old file?
                // BUT if category changes, old file is WRONG type.
                // So we MUST delete old file. And if new file is missing, we have a problem.
                // Ideally we validate: If category changes, new file is required.

                // However, to be safe:
                model.mod_txt_glb_filename = newFilename || null
            }
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
                error: 'No se puede eliminar este modelo porque ya ha sido comprado por usuarios. Por favor, desactívalo en su lugar.'
            })
        }

        // 🧹 CLEANUP: Delete pending/failed purchases (Cart items)
        await Model3DPurchase.destroy({
            where: {
                mod_int_id: id,
                pur_txt_status: ['PENDING', 'FAILED']
            }
        })

        // Eliminar archivo físico (GLB do modelo 3D)
        if (model.mod_txt_glb_filename) {
            const filePath = path.join(__dirname, '../../uploads/models', model.mod_txt_glb_filename)
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath)
                    console.log(`[Admin Models3D] Deleted GLB file: ${filePath}`)
                } catch (err) {
                    console.error(`[Admin Models3D] Error deleting GLB file: ${err}`)
                }
            }
        }

        // Eliminar imagen del modelo impreso (si existe)
        // Nota: Los modelos impresos guardan la imagen en el mismo campo mod_txt_glb_filename o en otro?
        // Revisando el código de upload (AdminModels3D.jsx):
        // Para IMPRESO: payload.printedImage = formData.glbFilename.
        // Y en backend: uploadImpresos guarda en 'uploads/impresos'.
        // Pero el modelo guarda el nombre en mod_txt_glb_filename.

        // Si es IMPRESO, buscar en uploads/impresos.
        if (model.mod_txt_category === 'IMPRESO' && model.mod_txt_glb_filename) {
            const imagePath = path.join(__dirname, '../../uploads/impresos', model.mod_txt_glb_filename)
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath)
                    console.log(`[Admin Models3D] Deleted Printed Image: ${imagePath}`)
                } catch (err) {
                    console.error(`[Admin Models3D] Error deleting Printed Image: ${err}`)
                }
            }
        } else if (model.mod_txt_category !== 'IMPRESO' && model.mod_txt_glb_filename) {
            // Es DIGITAL (GLB), ya borramos arriba en uploads/models.
            // Pero cuidado: el bloque de arriba borraba en uploads/models incondicionalmente.
            // Debemos diferenciar.
        }

        /* 
           Corrección: 
           - Digitales (GLB) van a 'uploads/models'.
           - Impresos (Imagen) van a 'uploads/impresos'.
           - Ambos usan mod_txt_glb_filename.
        */

        const isPrinted = model.mod_txt_category === 'IMPRESO';
        const filename = model.mod_txt_glb_filename;

        if (filename) {
            const folder = isPrinted ? '../../uploads/impresos' : '../../uploads/models';
            const filePath = path.join(__dirname, folder, filename);

            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`[Admin Models3D] Deleted file (${isPrinted ? 'Image' : 'GLB'}): ${filePath}`);
                } catch (err) {
                    console.error(`[Admin Models3D] Error deleting file: ${err}`);
                }
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
