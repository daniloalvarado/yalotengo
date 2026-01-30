import { Router } from 'express'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import { User } from './model.user.js' // ajusta el path si difiere

const r = Router()
const FRONT_REDIRECT = process.env.OAUTH_FRONT_REDIRECT || 'http://localhost:5173/auth'

async function findOrCreateUser({ email, first, last, name }) {
  let user = await User.findOne({ where: { use_txt_email: email } })
  if (!user) {
    user = await User.create({
      use_txt_email: email,
      use_txt_nombres: first || (name || '').split(' ')[0] || 'Usuario',
      use_txt_apellidos: last || (name || '').split(' ').slice(1).join(' ') || '',
      use_txt_documento: null,
      use_txt_password: null
    })
  }
  return user
}

function issueToken(user) {
  const payload = {
    use_int_id: user.use_int_id,
    email: user.use_txt_email,
    nombres: user.use_txt_nombres,
    apellidos: user.use_txt_apellidos,
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// --- GOOGLE callback público: /oauth/google/callback ---
r.get('/oauth/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, profile) => {
    try {
      if (err || !profile) throw new Error('OAuth failed')
      const user = await findOrCreateUser(profile)
      const token = issueToken(user)
      const state = req.query.state ? JSON.parse(Buffer.from(req.query.state, 'base64').toString()) : {}
      const redirect = state.redirect || FRONT_REDIRECT
      return res.redirect(`${redirect}?token=${encodeURIComponent(token)}`)
    } catch (e) {
      const redirect = FRONT_REDIRECT + `?error=${encodeURIComponent(e.message)}`
      return res.redirect(redirect)
    }
  })(req, res, next)
})

// --- FACEBOOK callback público: /oauth/facebook/callback ---
r.get('/oauth/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', { session: false }, async (err, profile) => {
    try {
      if (err || !profile) throw new Error('OAuth failed')
      const user = await findOrCreateUser(profile)
      const token = issueToken(user)
      const state = req.query.state ? JSON.parse(Buffer.from(req.query.state, 'base64').toString()) : {}
      const redirect = state.redirect || FRONT_REDIRECT
      return res.redirect(`${redirect}?token=${encodeURIComponent(token)}`)
    } catch (e) {
      const redirect = FRONT_REDIRECT + `?error=${encodeURIComponent(e.message)}`
      return res.redirect(redirect)
    }
  })(req, res, next)
})

export default r
