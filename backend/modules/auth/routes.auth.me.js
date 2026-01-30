import { Router } from 'express'
import { auth } from '../../utils/jwt.js'
import { User } from './model.user.js'

const r = Router()

// GET /auth/me  -> perfil del usuario
r.get('/me', auth, async (req,res)=>{
  const u = await User.findByPk(req.user.use_int_id, {
    attributes: [
        'use_int_id',
        'use_txt_email',
        'use_txt_nombres',
        'use_txt_apellidos',
        'use_txt_documento',
        'use_txt_role' // 👈 1. AGREGAMOS ESTO (Asumiendo que así se llama en tu BD)
    ]
  })
  if(!u) return res.sendStatus(404)

  // 👇 2. MAPEO PARA EL FRONTEND
  // Convertimos el objeto Sequelize a JSON puro y le agregamos la propiedad 'role'
  const userData = u.toJSON()
  userData.role = u.use_txt_role // El frontend espera user.role, no user.use_txt_role

  res.json({ user: userData })
})

// PATCH /auth/me -> actualizar nombres/apellidos/documento
r.patch('/me', auth, async (req,res)=>{
  const u = await User.findByPk(req.user.use_int_id)
  if(!u) return res.sendStatus(404)
  
  const { nombres, apellidos, documento } = req.body || {}
  
  if(nombres!==undefined) u.use_txt_nombres = String(nombres||'')
  if(apellidos!==undefined) u.use_txt_apellidos = String(apellidos||'')
  if(documento!==undefined) u.use_txt_documento = String(documento||'')
  
  await u.save()
  
  // Aquí también devolvemos el rol para mantener consistencia si actualizan perfil
  res.json({ user: {
    use_int_id: u.use_int_id,
    use_txt_email: u.use_txt_email,
    use_txt_nombres: u.use_txt_nombres,
    use_txt_apellidos: u.use_txt_apellidos,
    use_txt_documento: u.use_txt_documento,
    role: u.use_txt_role // 👈 Agregado también aquí
  }})
})

export default r