import jwt from 'jsonwebtoken'

// 1. Firmar token (Crear)
export const sign = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })

// 2. Verificar token (Leer) <--- ¡ESTO ES LO QUE TE FALTABA!
export const verify = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET)
}

// 3. Middleware para proteger rutas (Express)
export function auth(req, res, next) {
  let token = null

  const h = req.headers.authorization || ''
  if (h.startsWith('Bearer ')) token = h.slice(7)

  if (!token && req.query?.token) token = req.query.token 
  if (!token && req.headers['x-access-token']) token = req.headers['x-access-token']

  if (!token) return res.status(401).json({ error: 'Token requerido' })
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}