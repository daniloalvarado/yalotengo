import { Router } from 'express'
import { adminAuth } from '../../utils/adminAuth.js'
import { Microscopico } from './model.microscopico.js'
import { Translation } from './model.translation.js'
import { v4 as uuidv4 } from 'uuid'
import { uploadFile, deleteFile } from '../../services/storage.js'
import multer from 'multer'
import { Op } from 'sequelize'
import { User } from '../auth/model.user.js' // Added import for User model

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
      order: [['id', 'ASC']],
      include: [{ model: Translation, as: 'translations' }]
    })
    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener modelos' })
  }
})

// GET /admin/dashboard (Dashboard Analítico AR)
r.get('/admin/dashboard', adminAuth, async (req, res) => {
  try {
    // 1. Métricas de Usuarios AR (Leads)
    const totalLeads = await User.count({ where: { is_ar_user: true } })
    const recentLeads = await User.findAll({
      where: { is_ar_user: true },
      order: [['use_int_id', 'DESC']], // Asumiendo que IDs mayores son más recientes
      limit: 5,
      attributes: ['use_txt_nombres', 'use_txt_email', 'ar_name']
    })

    // 2. Métricas de Modelos
    const totalModels = await Microscopico.count()
    const activeModels = await Microscopico.count({ where: { estado: 'activo' } })

    res.json({
      totalLeads,
      recentLeads,
      totalModels,
      activeModels
    })
  } catch (error) {
    console.error('Error cargando AR Dashboard:', error)
    res.status(500).json({ error: 'Error del servidor al cargar Dashboard' })
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
    const { translations, ...modelData } = req.body
    const model = await Microscopico.create(modelData)

    if (translations && Array.isArray(translations)) {
      const transToCreate = translations.map(t => ({ ...t, microscopico_id: model.id }))
      await Translation.bulkCreate(transToCreate)
    }

    // Devolvemos el modelo con las traducciones
    const newModel = await Microscopico.findByPk(model.id, { include: [{ model: Translation, as: 'translations' }] })
    res.status(201).json(newModel)
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

    const { translations, ...modelData } = req.body

    // Si el usuario subió un nuevo .molde (y había uno antiguo), borrar el antiguo de MinIO
    if (modelData.assetBundleFileName && model.assetBundleFileName && modelData.assetBundleFileName !== model.assetBundleFileName) {
      await deleteFile('microscopicos', model.assetBundleFileName)
    }

    // Lo mismo para qr_image_url y qr_image_url2
    if (modelData.qr_image_url && model.qr_image_url && modelData.qr_image_url !== model.qr_image_url) {
      await deleteFile('microscopicos', model.qr_image_url)
    }
    if (modelData.qr_image_url2 && model.qr_image_url2 && modelData.qr_image_url2 !== model.qr_image_url2) {
      await deleteFile('microscopicos', model.qr_image_url2)
    }

    await model.update({ ...modelData, fecha_update: new Date() })

    // Manejar idiomas: Borrar existentes y crear nuevos
    if (translations && Array.isArray(translations)) {
      await Translation.destroy({ where: { microscopico_id: model.id } })
      const transToCreate = translations.map(t => ({ ...t, microscopico_id: model.id }))
      await Translation.bulkCreate(transToCreate)
    }

    const updatedModel = await Microscopico.findByPk(req.params.id, { include: [{ model: Translation, as: 'translations' }] })
    res.json(updatedModel)
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

    // Eliminar los archivos de almacenamiento físico en MinIO
    if (model.assetBundleFileName) {
      await deleteFile('microscopicos', model.assetBundleFileName)
    }
    if (model.qr_image_url) {
      await deleteFile('microscopicos', model.qr_image_url)
    }
    if (model.qr_image_url2) {
      await deleteFile('microscopicos', model.qr_image_url2)
    }

    await model.update({ estado: 'eliminado', fecha_delete: new Date() })
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar' })
  }
})

// POST Upload AssetBundle a MinIO
r.post('/admin/upload', adminAuth, upload.fields([{ name: 'assetBundleFile', maxCount: 1 }, { name: 'qrImageFile', maxCount: 1 }, { name: 'qrImageFile2', maxCount: 1 }]), async (req, res) => {
  try {
    if (!req.files || (!req.files.assetBundleFile && !req.files.qrImageFile && !req.files.qrImageFile2)) {
      return res.status(400).json({ error: 'No se enviaron archivos' })
    }

    const response = {}

    if (req.files.assetBundleFile) {
      const assetFile = req.files.assetBundleFile[0]
      if (req.body.oldFile) {
        await deleteFile('microscopicos', req.body.oldFile);
      }
      const filename = await uploadFile(
        assetFile.buffer,
        'microscopicos',
        assetFile.originalname,
        assetFile.mimetype || 'application/octet-stream'
      )
      response.assetBundleFileName = filename
    }

    if (req.files.qrImageFile) {
      const qrFile = req.files.qrImageFile[0]
      if (req.body.oldFile) {
        await deleteFile('microscopicos', req.body.oldFile);
      }
      const filename = await uploadFile(
        qrFile.buffer,
        'microscopicos',
        qrFile.originalname,
        qrFile.mimetype
      )
      response.qr_image_url = filename
    }

    if (req.files.qrImageFile2) {
      const qrFile2 = req.files.qrImageFile2[0]
      if (req.body.oldFile) {
        await deleteFile('microscopicos', req.body.oldFile);
      }
      const filename = await uploadFile(
        qrFile2.buffer,
        'microscopicos',
        qrFile2.originalname,
        qrFile2.mimetype
      )
      response.qr_image_url2 = filename
    }

    res.json(response)
  } catch (error) {
    console.error('Upload Error:', error)
    res.status(500).json({ error: 'Error subiendo archivo' })
  }
})

// ============================================
// PUBLIC ROUTES (Para que la app de Unity lea)
// ============================================

// GET todos los objetivos (marcadores QR) para la App Unity
r.get('/public/targets', async (req, res) => {
  try {
    const models = await Microscopico.findAll({
      where: { estado: 'activo' },
      attributes: ['id', 'qr_image_url', 'qr_image_url2', 'assetBundleFileName']
    })

    const baseUrl = process.env.APP_URL || 'http://108.181.191.82.sslip.io:8070'
    const targets = []

    models.forEach(m => {
      const modelUrl = m.assetBundleFileName ? `${baseUrl}/uploads/microscopicos/${m.assetBundleFileName}` : null
      
      // Usamos el ID como identificador único y seguro
      const targetIdentifier = m.id.toString()

      if (m.qr_image_url) {
        targets.push({
          name: targetIdentifier,
          url: `${baseUrl}/uploads/microscopicos/${m.qr_image_url}`,
          url_modelo: modelUrl
        })
      }
      if (m.qr_image_url2) {
        targets.push({
          name: targetIdentifier,
          url: `${baseUrl}/uploads/microscopicos/${m.qr_image_url2}`,
          url_modelo: modelUrl
        })
      }
    })

    res.json(targets)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener marcadores QR' })
  }
})

// GET modelo por ID para Unity
r.get('/public/:idAnimal', async (req, res) => {
  try {
    const idParam = req.params.idAnimal.replace(/\+/g, ' ')

    const finalModel = await Microscopico.findOne({
      where: {
        estado: 'activo',
        [Op.or]: [
          { id: isNaN(parseInt(idParam)) ? 0 : parseInt(idParam) },
          { scientificName: idParam },
          { vernacularName: { [Op.like]: `%${idParam}%` } }
        ]
      },
      include: [{ model: Translation, as: 'translations' }]
    })

    if (!finalModel) {
      return res.status(404).json({ error: 'Modelo no encontrado' })
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`

    // --- MEJORA: Taxonomía inteligente con limpieza de espacios ---
    const taxList = []
    if (finalModel.kingdom?.trim()) taxList.push(`Reino: ${finalModel.kingdom.trim()}`)
    if (finalModel.phylum?.trim()) taxList.push(`Filo: ${finalModel.phylum.trim()}`)
    if (finalModel.subphylum?.trim()) taxList.push(`Subfilo: ${finalModel.subphylum.trim()}`)
    if (finalModel.class?.trim()) taxList.push(`Clase: ${finalModel.class.trim()}`)
    if (finalModel.subclass?.trim()) taxList.push(`Subclase: ${finalModel.subclass.trim()}`)
    if (finalModel.order?.trim()) taxList.push(`Orden: ${finalModel.order.trim()}`)
    if (finalModel.family?.trim()) taxList.push(`Familia: ${finalModel.family.trim()}`)
    if (finalModel.genus?.trim()) taxList.push(`Género: ${finalModel.genus.trim()}`)
    if (finalModel.scientificName?.trim()) taxList.push(`Especie: ${finalModel.scientificName.trim()}`)

    // Si no hay campos biológicos reales, mandamos taxonomía vacía
    const taxHeader = taxList.length > 0 ? "Taxonomía\n" : ""
    const taxonomiaFinal = taxList.length > 0 ? `${taxHeader}${taxList.join('\n')}` : ""

    res.json({
      nombre: finalModel.vernacularName || finalModel.scientificName || "Sin nombre",
      nombre_cientifico: finalModel.scientificName || "",
      taxonomia: taxonomiaFinal,
      descripcion: finalModel.taxonRemarks,
      url_modelo: finalModel.assetBundleFileName
        ? `${baseUrl}/uploads/microscopicos/${finalModel.assetBundleFileName}`
        : null,
      traducciones: finalModel.translations || [],
      fuente: finalModel.fuente,
      tematica: finalModel.tematica,
      qr_image_url: finalModel.qr_image_url,
      qr_image_url2: finalModel.qr_image_url2,
      darwinCore: finalModel
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error interno del servidor Unity API' })
  }
})

export default r
