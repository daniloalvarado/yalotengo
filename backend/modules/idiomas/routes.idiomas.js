import express from 'express'
import { Idioma } from './model.idioma.js'
import { UITranslation } from './model.ui_translation.js'
import { Tematica } from '../microscopicos/model.tematica.js'
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
  "txtGaleriaVacia": "¡Aún no hay modelos descargados!",
  "txtGaleriaSinResultados": "No se encontraron modelos con esa búsqueda",
  "msgNombreComun": "Nombre Común",
  "msgNombreCientifico": "Nombre Científico",
  "msgTodos": "Todos",
    "txtArMenuBtn": "MENÚ",
    "txtArPlaceholder": "Escanea una imagen...",
    "txtEliminarTitulo": "¿Deseas eliminar este modelo?",
    "txtEliminarSi": "Sí, eliminar",
    "txtEliminarNo": "Cancelar",
    "txtExitoDescarga": "¡Descarga Exitosa!",
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
export async function autotranslate(text, sourceLang, targetLang) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
    const response = await fetch(url)
    const data = await response.json()
    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
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

    // Novedad: También traducimos todas las temáticas dinámicas!
    const tematicas = await Tematica.findAll()
    for (const tema of tematicas) {
      const translatedText = await autotranslate(tema.nombre, 'es', code)
      translationsToInsert.push({
        language_code: code,
        key: tema.key_name,
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

// ENDPOINT ESPECIAL: Sincronizar claves base faltantes y eliminar obsoletas
router.post('/sync-ui', async (req, res) => {
  try {
    const idiomas = await Idioma.findAll();
    let agregados = 0;
    let eliminados = 0;

    for (const idioma of idiomas) {
      // 1. Agregar claves nuevas
      for (const [key, esValue] of Object.entries(baseUIKeys)) {
        const existe = await UITranslation.findOne({ where: { language_code: idioma.code, key: key }});
        if (!existe) {
          console.log(`Autotraduciendo ${key} para ${idioma.code}...`);
          const val = await autotranslate(esValue, 'es', idioma.code);
          await UITranslation.create({ language_code: idioma.code, key: key, value: val });
          agregados++;
        }
      }

      // 1.5 Agregar temáticas
      const tematicas = await Tematica.findAll();
      for (const t of tematicas) {
        if (!t.key_name) continue; // Por seguridad
        const existe = await UITranslation.findOne({ where: { language_code: idioma.code, key: t.key_name }});
        if (!existe) {
          console.log(`Autotraduciendo temática ${t.key_name} para ${idioma.code}...`);
          const val = await autotranslate(t.nombre, 'es', idioma.code);
          await UITranslation.create({ language_code: idioma.code, key: t.key_name, value: val });
          agregados++;
        }
      }

      // 2. Eliminar claves obsoletas (protegiendo las temáticas dinámicas)
      const traduccionesActuales = await UITranslation.findAll({ where: { language_code: idioma.code }});
      for (const t of traduccionesActuales) {
        if (!(t.key in baseUIKeys) && !t.key.startsWith('tema_')) {
          console.log(`Eliminando clave obsoleta ${t.key} de ${idioma.code}...`);
          await t.destroy();
          eliminados++;
        }
      }
    }
    
    res.json({ message: `Sincronización completada. Se agregaron ${agregados} claves y se eliminaron ${eliminados} obsoletas.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
})

export default router
