import jwt from 'jsonwebtoken'
import { User } from '../modules/auth/model.user.js'

/**
 * Middleware para verificar que el usuario es admin
 * Requiere que el middleware auth haya sido ejecutado antes o verifica el token
 */
export async function adminAuth(req, res, next) {
    // Primero verificar el token
    let token = null

    const h = req.headers.authorization || ''
    if (h.startsWith('Bearer ')) token = h.slice(7)
    if (!token && req.query?.token) token = req.query.token
    if (!token && req.headers['x-access-token']) token = req.headers['x-access-token']

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded

        // Verificar rol de admin en la base de datos
        const user = await User.findByPk(decoded.use_int_id)
        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' })
        }

        if (user.use_txt_role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' })
        }

        req.user.role = user.use_txt_role
        return next()
    } catch (e) {
        return res.status(401).json({ error: 'Token inválido' })
    }
}

/**
 * Middleware simple para endpoints que ya tienen auth
 * Solo verifica el rol en req.user
 */
export function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' })
    }

    // El rol debe estar en el token o haberse cargado previamente
    if (req.user.role !== 'admin' && req.user.use_txt_role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' })
    }

    return next()
}
