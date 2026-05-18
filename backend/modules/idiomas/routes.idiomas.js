import express from 'express'
import { Idioma } from './model.idioma.js'
import { UITranslation } from './model.ui_translation.js'
// import { protect } from '../../utils/middleware.js' // asumiendo middleware de auth

const router = express.Router()

// DICCIONARIO BASE EN ESPAÑOL (Para la app AR)
const baseUIKeys = {
  "txtLoginTitulo": "INICIAR SESIÓN",
  "txtLoginBtnGoogle": "Entrar con Google",
  "txtLoginPlaceholderNombre": "Ingresa tu nombre...",
  "txtLoginPlaceholderCorreo": "Ingresa tu correo...",
  "txtLoginBtnIniciar": "Iniciar Sesión",
  "txtBienvTitulo": "BIENVENIDA",
  "txtBienvBtnMuseo": "Amazonía Mágica",
  "txtBienvBtnIdioma": "Seleccionar Idioma",
  "txtTemasTitulo": "TEMÁTICAS",
  "txtTemasBtnBiodiversidad": "Biodiversidad",
  "txtTemasBtnGaleria": "Galería",
  "txtTemasBtnAjustes": "Ajustes",
  "txtGaleriaPlaceholderBuscador": "Buscar...",
  "msgNombreComun": "Nombre Común",
  "msgNombreCientifico": "Nombre Científico",
  "msgTodos": "Todos",
  "txtArPlaceholder": "Escanea un animal...",
  "txtAjustesTitulo": "AJUSTES",
  "txtAjustesLabelIdioma": "Idioma",
  "msgCargandoTitulo": "Identificando...",
  "msgCargandoTaxo": "Escaneando 3D...",
  "msgCargandoDesc": "Por favor, mantenga la imagen centrada...",
  "msgErrNoInternet": "Sin conexión a Internet",
  "msgErrServidor": "Error de servidor",
  "msgErrDetalleRed": "Revisa tu Wi-Fi o Datos móviles",
  "msgErrDetalleServidor": "Reintenta más tarde",
  // Taxonomía
  "lbl_reino": "Reino:",
  "lbl_filo": "Filo:",
  "lbl_clase": "Clase:",
  "lbl_orden": "Orden:",
  "lbl_familia": "Familia:",
  "lbl_genero": "Género:",
  "lbl_especie": "Especie:",
  "lbl_fuente": "Fuente:"
}

/**
 * Servicio interno para traducir usando MyMemory (API gratuita)
 */
async function autotranslate(text, sourceLang, targetLang) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    const response = await fetch(url)
    const data = await response.json()
    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText
    }
    return text // fallback a original
  } catch (error) {
    console.error("Error en auto-traducción:", error)
    return text
  }
}

// ----------------------------------------------------
// 1. ENDPOINT PÚBLICO (Para la app de Unity AR)
// ----------------------------------------------------
router.get('/public/ui-dict', async (req, res) => {
  try {
    const idiomas = await Idioma.findAll({
      where: { is_active: true },
      include: [{ model: UITranslation, as: 'ui_translations' }]
    })

    const idiomasArray = []
    
    // Fallback español garantizado
    const esTextos = Object.keys(baseUIKeys).map(k => ({ key: k, value: baseUIKeys[k] }))
    idiomasArray.push({ code: 'es', name: 'Español', textos: esTextos })

    idiomas.forEach(idioma => {
      const textos = idioma.ui_translations.map(t => ({ key: t.key, value: t.value }))
      idiomasArray.push({ code: idioma.code, name: idioma.name, textos })
    })

    res.json({ idiomas: idiomasArray })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error interno obteniendo el diccionario UI' })
  }
})

// ----------------------------------------------------
// 2. ENDPOINTS PRIVADOS (Para el Panel Admin React)
// ----------------------------------------------------

// GET Todos los idiomas
router.get('/', async (req, res) => {
  try {
    const idiomas = await Idioma.findAll({
      include: [{ model: UITranslation, as: 'ui_translations' }],
      order: [['createdAt', 'ASC']]
    })
    res.json(idiomas)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST Crear nuevo idioma + Auto-Traducción "al vuelo"
router.post('/', async (req, res) => {
  const { code, name } = req.body
  
  if (!code || !name) {
    return res.status(400).json({ error: 'Código y nombre son requeridos (ej. code: en, name: English)' })
  }

  try {
    const exists = await Idioma.findByPk(code)
    if (exists) return res.status(400).json({ error: 'El idioma ya existe' })

    const nuevoIdioma = await Idioma.create({ code, name, is_active: true })

    // Magia de Auto-traducción: Recorremos las keys de UI base y las traducimos de 'es' al nuevo 'code'
    const translationsToInsert = []
    
    // Promesas en paralelo para acelerar la traducción (cuidado con limites de rate limit)
    // Para APIs gratuitas, mejor hacer un retraso o traducir en bloque si la API lo permite, 
    // pero MyMemory suele aguantar ráfagas cortas.
    const keys = Object.keys(baseUIKeys)
    for (const key of keys) {
      const originalText = baseUIKeys[key]
      const translatedText = await autotranslate(originalText, 'es', code)
      
      translationsToInsert.push({
        language_code: code,
        key: key,
        value: translatedText
      })
    }

    await UITranslation.bulkCreate(translationsToInsert)

    res.status(201).json({ message: 'Idioma creado y auto-traducido', idioma: nuevoIdioma })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// PUT Actualizar estado de idioma
router.put('/:code', async (req, res) => {
  try {
    const { is_active, name } = req.body
    const idioma = await Idioma.findByPk(req.params.code)
    if (!idioma) return res.status(404).json({ error: 'Idioma no encontrado' })

    if (is_active !== undefined) idioma.is_active = is_active
    if (name !== undefined) idioma.name = name

    await idioma.save()
    res.json(idioma)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT Actualizar una traducción UI específica
router.put('/:code/ui/:key', async (req, res) => {
  try {
    const { value } = req.body
    const trans = await UITranslation.findOne({
      where: { language_code: req.params.code, key: req.params.key }
    })
    
    if (trans) {
      trans.value = value
      await trans.save()
    } else {
      await UITranslation.create({ language_code: req.params.code, key: req.params.key, value })
    }
    
    res.json({ message: 'Traducción actualizada' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ENDPOINT ESPECIAL: Traducir texto al vuelo (Usado por AdminUnityModels.jsx)
router.post('/autotranslate', async (req, res) => {
  const { text, target_lang } = req.body
  try {
    const translated = await autotranslate(text, 'es', target_lang)
    res.json({ translatedText: translated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
