import { Router } from 'express'

const r = Router()

function checkInternal(req, res, next) {
  const s = req.headers['x-internal-secret'] || ''
  if (s !== process.env.INTERNAL_SECRET) return res.sendStatus(401)
  next()
}

// NOTA: Este módulo manejaba rutas internas para órdenes de compra.
// El módulo de órdenes fue eliminado ya que no estaba integrado con MercadoPago.

r.post('/internal/orders/:id/mark-ready', checkInternal, async (req, res) => {
  res.status(501).json({
    error: 'Funcionalidad no disponible',
    message: 'El sistema de órdenes está siendo migrado a MercadoPago'
  })
})

export default r
