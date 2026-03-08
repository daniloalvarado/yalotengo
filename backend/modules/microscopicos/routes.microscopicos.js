import { Router } from 'express'
import { adminAuth } from '../../utils/adminAuth.js'
import { Microscopico } from './model.microscopico.js'
import { v4 as uuidv4 } from 'uuid'
import { uploadFile } from '../../services/storage.js'
import multer from 'multer'
import { Op } from 'sequelize'

const r = Router()
const upload = multer({ storage: multer.memoryStorage() })

// ============================================
// ADMIN ROUTES (Gestión del CRUD y Subida)
// ============================================

// GET todos (incluye inactivos pero no eliminados para el admin)
r.get('/admin', adminAuth, async (req, res) => {
  try {
    const data = await Microscopico.findAll({
      where: { estado: ['activo', 'desactivo'] },
      order: [['id', 'DESC']]
    })
    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener modelos' })
  }
})

// GET uno
r.get('/admin/:id', adminAuth, async (req, res) => {
  try {
    const model = await Microscopico.findByPk(req.params.id)
    if (!model) return res.status(404).json({ error: 'No encontrado' })
    res.json(model)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener modelo' })
  }
})

// POST crear
r.post('/admin', adminAuth, async (req, res) => {
  try {
    const model = await Microscopico.create(req.body)
    res.status(201).json(model)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al guardar el modelo' })
  }
})

// PUT editar
r.put('/admin/:id', adminAuth, async (req, res) => {
  try {
    const model = await Microscopico.findByPk(req.params.id)
    if (!model) return res.status(404).json({ error: 'No encontrado' })
    await model.update({ ...req.body, fecha_update: new Date() })
    res.json(model)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar' })
  }
})

// DELETE (Soft delete)
r.delete('/admin/:id', adminAuth, async (req, res) => {
  try {
    const model = await Microscopico.findByPk(req.params.id)
    if (!model) return res.status(404).json({ error: 'No encontrado' })
    await model.update({ estado: 'eliminado', fecha_delete: new Date() })
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar' })
  }
})

// POST Upload AssetBundle a MinIO
r.post('/admin/upload', adminAuth, upload.single('assetBundleFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se envió archivo' })
    
    const filename = await uploadFile(
        req.file.buffer, 
        'microscopicos', 
        req.file.originalname, 
        req.file.mimetype || 'application/octet-stream'
    )
    res.json({ filename })
  } catch (error) {
    console.error('Upload Error:', error)
    res.status(500).json({ error: 'Error subiendo archivo' })
  }
})

// ============================================
// PUBLIC ROUTES (Para que la app de Unity lea)
// ============================================

// GET modelo por ID para Unity (o por scientificName si se prefiere)
// La app de Unity espera el JSON para leerlo, justo como lo hacía con Firebase
r.get('/public/:idAnimal', async (req, res) => {
  try {
    const idParam = req.params.idAnimal

    // Buscamos por nombre científico exacto, nombre común (parcial) o ID numérico
    const finalModel = await Microscopico.findOne({
      where: {
        estado: 'activo',
        [Op.or]: [
          { scientificName: idParam },
          { vernacularName: { [Op.like]: `%${idParam}%` } },
          { id: isNaN(parseInt(idParam)) ? 0 : parseInt(idParam) }
        ]
      }
    })

    if (!finalModel) {
      return res.status(404).json({ error: 'Modelo no encontrado' })
    }

    // Devolvemos el JSON compatible con (o mapeable fácilmente) en Unity
    // Creamos la URL absoluta del modelo 3D usando MinIO Proxy (ej: /uploads/microscopicos/file.bundle)
    const baseUrl = `${req.protocol}://${req.get('host')}`
    
    // Taxonomía dinámica: concatenamos solo los campos que existan
    const taxFields = [
      finalModel.kingdom, finalModel.phylum, finalModel.subphylum, 
      finalModel.class, finalModel.subclass, finalModel.order, 
      finalModel.family, finalModel.genus, finalModel.specificEpithet
    ].filter(Boolean)
    
    res.json({
        nombre: finalModel.scientificName,
        taxonomia: taxFields.join(' > '),
        descripcion: finalModel.taxonRemarks,
        // Construimos la URL al archivo guardado en el storage
        url_modelo: finalModel.assetBundleFileName 
            ? `${baseUrl}/uploads/microscopicos/${finalModel.assetBundleFileName}` 
            : null,
        // Mandar el resto de info Darwin Core por si la necesita
        darwinCore: finalModel
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error interno del servidor Unity API' })
  }
})

export default r
