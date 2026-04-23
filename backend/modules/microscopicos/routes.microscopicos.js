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
      console.log(`[UPLOAD] Recibido archivo 3D: ${assetFile.originalname} (${assetFile.size} bytes)`);
      console.log(`[UPLOAD] Iniciando subida a MinIO en carpeta 'microscopicos'...`);
      
      const filename = await uploadFile(
          assetFile.buffer, 
          'microscopicos', 
          assetFile.originalname, 
          assetFile.mimetype || 'application/octet-stream'
      )
      
      console.log(`[UPLOAD] ¡Subida a MinIO completada! Nombre final: ${filename}`);
      response.assetBundleFileName = filename
    }

    if (req.files.qrImageFile) {
      const qrFile = req.files.qrImageFile[0]
      console.log(`[UPLOAD] Recibido Marcador AR: ${qrFile.originalname} (${qrFile.size} bytes)`);
      const filename = await uploadFile(
          qrFile.buffer, 
          'microscopicos', 
          qrFile.originalname, 
          qrFile.mimetype
      )
      console.log(`[UPLOAD] Marcador AR subido: ${filename}`);
      response.qr_image_url = filename
    }

    if (req.files.qrImageFile2) {
      const qrFile2 = req.files.qrImageFile2[0]
      console.log(`[UPLOAD] Recibido Marcador Secundario: ${qrFile2.originalname} (${qrFile2.size} bytes)`);
      const filename = await uploadFile(
          qrFile2.buffer, 
          'microscopicos', 
          qrFile2.originalname, 
          qrFile2.mimetype
      )
      console.log(`[UPLOAD] Marcador Secundario subido: ${filename}`);
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
      where: {
        estado: 'activo'
      },
      attributes: ['scientificName', 'qr_image_url', 'qr_image_url2', 'assetBundleFileName']
    })

    const baseUrl = process.env.APP_URL || 'http://108.181.191.82.sslip.io:8070'
    
    const targets = []
    
    models.forEach(m => {
      const modelUrl = m.assetBundleFileName ? `${baseUrl}/uploads/microscopicos/${m.assetBundleFileName}` : null
      
      if (m.qr_image_url) {
        targets.push({
          name: m.scientificName,
          url: `${baseUrl}/uploads/microscopicos/${m.qr_image_url}`,
          url_modelo: modelUrl
        })
      }
      if (m.qr_image_url2) {
        targets.push({
          name: m.scientificName,
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

// GET modelo por ID para Unity (o por scientificName si se prefiere)
// La app de Unity espera el JSON para leerlo, justo como lo hacía con Firebase
r.get('/public/:idAnimal', async (req, res) => {
  try {
    // Replace + with space because UnityWebRequest.EscapeURL uses + for spaces
    const idParam = req.params.idAnimal.replace(/\+/g, ' ')

    // Buscamos por nombre científico exacto, nombre común (parcial) o ID numérico
    const finalModel = await Microscopico.findOne({
      where: {
        estado: 'activo',
        [Op.or]: [
          { scientificName: idParam },
          { vernacularName: { [Op.like]: `%${idParam}%` } },
          { id: isNaN(parseInt(idParam)) ? 0 : parseInt(idParam) }
        ]
      },
      include: [{ model: Translation, as: 'translations' }]
    })

    if (!finalModel) {
      return res.status(404).json({ error: 'Modelo no encontrado' })
    }

    // Devolvemos el JSON compatible con (o mapeable fácilmente) en Unity
    // Creamos la URL absoluta del modelo 3D usando MinIO Proxy (ej: /uploads/microscopicos/file.bundle)
    const baseUrl = `${req.protocol}://${req.get('host')}`
    
    // Taxonomía estructurada con etiquetas y saltos de línea (\n) para mejor lectura en Unity
    const taxList = []
    if (finalModel.kingdom) taxList.push(`Reino: ${finalModel.kingdom}`)
    if (finalModel.phylum) taxList.push(`Filo: ${finalModel.phylum}`)
    if (finalModel.subphylum) taxList.push(`Subfilo: ${finalModel.subphylum}`)
    if (finalModel.class) taxList.push(`Clase: ${finalModel.class}`)
    if (finalModel.subclass) taxList.push(`Subclase: ${finalModel.subclass}`)
    if (finalModel.order) taxList.push(`Orden: ${finalModel.order}`)
    if (finalModel.family) taxList.push(`Familia: ${finalModel.family}`)
    if (finalModel.genus) taxList.push(`Género: ${finalModel.genus}`)
    if (finalModel.scientificName) taxList.push(`Especie: ${finalModel.scientificName}`)
    
    res.json({
        nombre: finalModel.vernacularName || finalModel.scientificName,
        nombre_cientifico: finalModel.scientificName,
        taxonomia: `Taxonomía\n${taxList.join('\n')}`,
        descripcion: finalModel.taxonRemarks,
        // Construimos la URL al archivo guardado en el storage
        url_modelo: finalModel.assetBundleFileName 
            ? `${baseUrl}/uploads/microscopicos/${finalModel.assetBundleFileName}` 
            : null,
        // Mandamos las traducciones dinámicas
        traducciones: finalModel.translations || [],
        fuente: finalModel.fuente,
        tematica: finalModel.tematica,
        qr_image_url: finalModel.qr_image_url,
        qr_image_url2: finalModel.qr_image_url2,
        
        // Mandar el resto de info Darwin Core por si la necesita
        darwinCore: finalModel
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error interno del servidor Unity API' })
  }
})

export default r
