import { Router } from 'express'
import { adminAuth } from '../../utils/adminAuth.js'
import { Model3D } from '../models3d/model.model3d.js'
import { uploadModel } from '../../utils/upload.js'
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
            return res.status(400).json({ error: 'No se recibió archivo' })
        }
        // Return the filename to be used when creating/updating the model
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
        const { name, desc, glbFilename, price } = req.body

        if (!name || !glbFilename) {
            return res.status(400).json({ error: 'Nombre y archivo GLB son requeridos' })
        }

        const model = await Model3D.create({
            mod_txt_name: name,
            mod_txt_desc: desc || null,
            mod_txt_glb_filename: glbFilename,
            mod_dec_price: price || 19.90,
            mod_txt_category: 'DIGITALIZADO', // Always DIGITALIZADO
            mod_bool_active: true,
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
        const { name, desc, glbFilename, price } = req.body

        const model = await Model3D.findByPk(id)
        if (!model) {
            return res.status(404).json({ error: 'Modelo no encontrado' })
        }

        if (name) model.mod_txt_name = name
        if (desc !== undefined) model.mod_txt_desc = desc
        if (glbFilename) model.mod_txt_glb_filename = glbFilename
        if (price !== undefined) model.mod_dec_price = price
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

        // Eliminar archivo físico
        if (model.mod_txt_glb_filename) {
            const filePath = path.join(__dirname, '../../../uploads/models', model.mod_txt_glb_filename)
            // Nota: Ajustamos la ruta relativa. Como estamos en modules/admin, subir 3 niveles:
            // modules/admin -> modules -> backend -> uploads
            // Wait, __dirname is backend/modules/admin
            // So ../../uploads/models is correct?
            // backend/modules/admin/../../uploads/models -> backend/uploads/models. Correct.
            // Let's verify path construction.
            // My previous thought said ../../uploads/models. Let's re-verify.
            // backend/modules/admin -> backend/modules -> backend -> uploads. That is 2 levels up if uploads is in backend/uploads?
            // Directory structure in Step 2030:
            // backend/uploads exists.
            // backend/modules/admin (Step 2050) exists.
            // So path is backend/modules/admin.
            // ../ -> backend/modules
            // ../../ -> backend
            // ../../uploads/models -> backend/uploads/models.
            // YES. using ../../uploads/models
        }

        // Logic implementation:
        if (model.mod_txt_glb_filename) {
            const filePath = path.join(__dirname, '../../uploads/models', model.mod_txt_glb_filename)
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath)
                    console.log(`[Admin Models3D] Deleted file: ${filePath}`)
                } catch (err) {
                    console.error(`[Admin Models3D] Error deleting file: ${err}`)
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

export default r
