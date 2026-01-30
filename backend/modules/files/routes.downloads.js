import { Router } from 'express'

const r = Router()

// NOTA: Este módulo manejaba descargas de archivos de órdenes de compra.
// El módulo de órdenes fue eliminado ya que no estaba integrado con MercadoPago.
// Si necesitas descargas de archivos en el futuro, reimplementa con MercadoPago.

r.get('/download-stream/:oriId', (req, res) => {
  res.status(501).json({
    error: 'Funcionalidad de descargas no disponible',
    message: 'El sistema de órdenes está siendo migrado a MercadoPago'
  })
})

export default r
