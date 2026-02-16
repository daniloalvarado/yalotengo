import { Router } from 'express'
import bcrypt from 'bcryptjs'
import passport from 'passport'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { User } from './model.user.js'
import { sign, verify } from '../../utils/jwt.js'
import { uploadAvatar } from '../../utils/upload.js'
import { uploadFile, deleteFile } from '../../services/storage.js'
import fs from 'fs'
import path from 'path'

const r = Router()

// --- ESTRATEGIA FACEBOOK ---
passport.use(new FacebookStrategy({
  clientID: process.env.FB_APP_ID || 'x',
  clientSecret: process.env.FB_APP_SECRET || 'x',
  callbackURL: process.env.FB_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name', 'photos'] // 👈 CAMBIO 1: Pedimos 'photos'
}, async (_at, _rt, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.toLowerCase() || `${profile.id}@facebook.local`
    const avatar = profile.photos?.[0]?.value || null // 👈 Capturamos foto

    let u = await User.findOne({ where: { use_txt_email: email } })
    if (!u) {
      u = await User.create({
        use_txt_email: email,
        use_txt_nombres: profile.name?.givenName || 'FB',
        use_txt_apellidos: profile.name?.familyName || 'User',
        use_txt_role: 'cliente',
        use_txt_fb_id: profile.id,
        use_txt_avatar: avatar // 👈 Guardamos foto
      })
    } else {
      // Si ya existe, actualizamos IDs y foto si no tiene
      let changed = false;
      if (!u.use_txt_fb_id) { u.use_txt_fb_id = profile.id; changed = true; }
      if (!u.use_txt_avatar && avatar) { u.use_txt_avatar = avatar; changed = true; }
      if (changed) await u.save();
    }
    done(null, u)
  } catch (e) { done(e) }
}))

// ... importaciones ...

// --- ESTRATEGIA GOOGLE MEJORADA ---
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
  scope: ['profile', 'email']
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.toLowerCase()
    if (!email) return done(new Error("No email from Google"))

    // Capturamos la foto
    const avatar = profile.photos?.[0]?.value || null

    // CHISMOSO: Mira tu terminal negra cuando te loguees para ver esto
    console.log('📸 [GOOGLE DEBUG] Foto recibida:', avatar);

    let u = await User.findOne({ where: { use_txt_email: email } })

    // CASO 1: USUARIO NUEVO
    if (!u) {
      console.log('✨ Creando usuario nuevo con foto...');
      u = await User.create({
        use_txt_email: email,
        use_txt_nombres: profile.name?.givenName || 'Google',
        use_txt_apellidos: profile.name?.familyName || 'User',
        use_txt_role: 'cliente',
        use_txt_google_id: profile.id,
        use_txt_avatar: avatar // <--- Guardamos foto
      })
    }
    // CASO 2: EL USUARIO YA EXISTÍA (TU CASO)
    else {
      console.log('🔄 Usuario existe, actualizando foto...');

      // FORZAMOS LA ACTUALIZACIÓN:
      // Si Google nos da foto, la guardamos en la BD sí o sí
      u.use_txt_google_id = profile.id;
      if (avatar && !u.use_txt_avatar) {
        u.use_txt_avatar = avatar;
      }
      await u.save();
    }
    done(null, u)
  } catch (e) { done(e) }
}))



// --- RUTAS NORMALES ---
r.post('/register', async (req, res) => {
  const { nombres, apellidos, documento, email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Faltan campos' })
  const exists = await User.findOne({ where: { use_txt_email: email.toLowerCase() } })
  if (exists) return res.status(409).json({ error: 'Email ya registrado' })
  const hash = await bcrypt.hash(password, 10)
  const u = await User.create({
    use_txt_nombres: nombres || '', use_txt_apellidos: apellidos || '',
    use_txt_documento: documento || '', use_txt_email: email.toLowerCase(),
    use_txt_passwordhash: hash
  })
  res.json({ token: sign({ use_int_id: u.use_int_id, email: u.use_txt_email, role: u.use_txt_role }), user: u })
})

r.post('/login', async (req, res) => {
  const { email, password } = req.body
  const u = await User.findOne({ where: { use_txt_email: (email || '').toLowerCase() } })
  if (!u || !u.use_txt_passwordhash) return res.status(401).json({ error: 'Credenciales inválidas' })
  const ok = await bcrypt.compare(password, u.use_txt_passwordhash)
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' })
  res.json({ token: sign({ use_int_id: u.use_int_id, email: u.use_txt_email, role: u.use_txt_role }), user: u })
})

// --- RUTAS OAUTH (Facebook & Google) ---
r.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }))
r.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/auth/fail' }),
  (req, res) => {
    const token = sign({ use_int_id: req.user.use_int_id, email: req.user.use_txt_email, role: req.user.use_txt_role })
    const redirectUrl = process.env.OAUTH_FRONT_REDIRECT || 'http://localhost:5173/auth';
    res.redirect(`${redirectUrl}?token=${token}`)
  }
)

r.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
r.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/fail' }),
  (req, res) => {
    const token = sign({
      use_int_id: req.user.use_int_id,
      email: req.user.use_txt_email,
      role: req.user.use_txt_role
    })
    const redirectUrl = process.env.OAUTH_FRONT_REDIRECT || 'http://localhost:5173/auth';
    res.redirect(`${redirectUrl}?token=${token}`)
  }
)

// --- CAMBIO 3: ENDPOINT /me PARA EL FRONTEND ---
r.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'No token provided' })

    const token = authHeader.split(' ')[1]
    // Verificamos el token (asegúrate de tener 'verify' en tu jwt.js)
    const decoded = verify(token)

    const user = await User.findByPk(decoded.use_int_id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    res.json({ user })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// --- PUT /me: UPDATE PROFILE ---
r.put('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'No token' })
    const token = authHeader.split(' ')[1]
    const decoded = verify(token)

    const u = await User.findByPk(decoded.use_int_id)
    if (!u) return res.status(404).json({ error: 'User not found' })

    const { nombres, apellidos, documento, address, phone } = req.body

    // Update fields
    if (nombres !== undefined) u.use_txt_nombres = nombres
    if (apellidos !== undefined) u.use_txt_apellidos = apellidos
    if (documento !== undefined) u.use_txt_documento = documento
    if (address !== undefined) u.use_txt_address = address
    if (phone !== undefined) u.use_txt_phone = phone

    await u.save()
    res.json({ ok: true, user: u })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error updating profile' })
  }
})

// --- POST /avatar: UPLOAD PROFILE PICTURE ---
r.post('/avatar', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })

  // Wrapper for multer to handle errors
  uploadAvatar(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })

    try {
      const token = authHeader.split(' ')[1]
      const decoded = verify(token)
      const u = await User.findByPk(decoded.use_int_id)
      if (!u) return res.status(404).json({ error: 'User not found' })

      if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

      // OPTIONAL: Delete old avatar if not external (starts with http)
      if (u.use_txt_avatar && !u.use_txt_avatar.startsWith('http')) {
        await deleteFile('avatars', u.use_txt_avatar)
      }

      const filename = await uploadFile(req.file.buffer, 'avatars', req.file.originalname, req.file.mimetype)
      u.use_txt_avatar = filename
      await u.save()

      res.json({ ok: true, avatar: u.use_txt_avatar })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Error processing avatar' })
    }
  })
})

// --- PUT /change-password: CHANGE PASSWORD ---
r.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'No token' })
    const token = authHeader.split(' ')[1]
    const decoded = verify(token)

    const u = await User.findByPk(decoded.use_int_id)
    if (!u) return res.status(404).json({ error: 'User not found' })

    // 1. Check if user has a password (local user)
    if (!u.use_txt_passwordhash) {
      return res.status(400).json({ error: 'Google users cannot change password here.' })
    }

    // 2. Verify current password
    const ok = await bcrypt.compare(currentPassword, u.use_txt_passwordhash)
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' })

    // 3. Update password
    if (newPassword.length < 8) return res.status(400).json({ error: 'Min 8 chars' })

    u.use_txt_passwordhash = await bcrypt.hash(newPassword, 10)
    await u.save()

    res.json({ ok: true, message: 'Password updated' })
  } catch (e) {
    console.error('[Auth] Error changing password.')
    res.status(500).json({ error: 'Server error' })
  }
})

r.get('/fail', (_req, res) => res.status(401).send('Login failed'))

export default r