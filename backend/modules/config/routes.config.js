import express from 'express'
import { SysConfig } from './model.config.js'

const router = express.Router()

// GET /api/config - Obtener todas las configuraciones
router.get('/', async (req, res) => {
  try {
    const configs = await SysConfig.findAll()
    // Transformar a un objeto simple para más facilidad en frontend
    const configObj = {}
    configs.forEach(c => {
      configObj[c.key] = c.value
    })
    res.json(configObj)
  } catch (error) {
    console.error('[Config] Error fetching config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/config/:key - Actualizar una configuración específica
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body
    
    if (value === undefined) {
      return res.status(400).json({ error: 'value is required' })
    }

    const config = await SysConfig.findByPk(key)
    if (!config) {
      return res.status(404).json({ error: 'Configuration key not found' })
    }

    config.value = String(value)
    await config.save()

    res.json(config)
  } catch (error) {
    console.error('[Config] Error updating config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
