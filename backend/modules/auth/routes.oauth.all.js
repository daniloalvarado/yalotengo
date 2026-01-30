import { Router } from 'express'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import { User } from './model.user.js'

const r = Router()
const FRONT_REDIRECT = process.env.OAUTH_FRONT_REDIRECT || 'http://localhost:5173/auth'
const ALLOWED = (process.env.ALLOWED_REDIRECTS || FRONT_REDIRECT).split(',').map(s=>s.trim())

const safeRedirect = (u)=> ALLOWED.includes(u) ? u : ALLOWED[0]

async function findOrCreateUser({ email, first, last, name }) {
  let user = await User.findOne({ where: { use_txt_email: email } })
  if (!user) {
    user = await User.create({
      use_txt_email: email,
      use_txt_nombres: first || (name||'').split(' ')[0] || 'Usuario',
      use_txt_apellidos: last || (name||'').split(' ').slice(1).join(' ') || '',
      use_txt_documento: null,
      use_txt_password: null
    })
  }
  return user
}
const issueToken = (user)=> jwt.sign({
  use_int_id: user.use_int_id,
  email: user.use_txt_email,
  nombres: user.use_txt_nombres,
  apellidos: user.use_txt_apellidos
}, process.env.JWT_SECRET, { expiresIn: '7d' })

// ---------- INICIO (frontend llama a /auth/...) ----------
r.get('/auth/google', (req,res,next)=>{
  const redirect = req.query.redirect || FRONT_REDIRECT
  const state = Buffer.from(JSON.stringify({ redirect })).toString('base64')
  passport.authenticate('google', { scope:['profile','email'], state, session:false })(req,res,next)
})
r.get('/auth/facebook', (req,res,next)=>{
  const redirect = req.query.redirect || FRONT_REDIRECT
  const state = Buffer.from(JSON.stringify({ redirect })).toString('base64')
  passport.authenticate('facebook', { scope:['public_profile','email'], state, session:false })(req,res,next)
})

// ---------- CALLBACKS PÚBLICOS /oauth/* ----------
function handleCallback(provider){
  return (req,res,next)=>{
    passport.authenticate(provider, { session:false }, async (err, profile)=>{
      try{
        if (err || !profile) throw new Error('OAuth failed')
        const user = await findOrCreateUser(profile)
        const token = issueToken(user)
        const state = req.query.state ? JSON.parse(Buffer.from(req.query.state,'base64').toString()) : {}
        const redirect = safeRedirect(state.redirect || FRONT_REDIRECT)
        return res.redirect(`${redirect}?token=${encodeURIComponent(token)}`)
      }catch(e){
        const redirect = safeRedirect(FRONT_REDIRECT) + `?error=${encodeURIComponent(e.message)}`
        return res.redirect(redirect)
      }
    })(req,res,next)
  }
}
r.get('/oauth/google/callback', handleCallback('google'))
r.get('/oauth/facebook/callback', handleCallback('facebook'))

export default r
