import { Router } from 'express'
const r = Router()
r.post('/email', async (req,res)=>{
  console.log('EMAIL STUB =>', req.body)
  res.json({ ok:true })
})
export default r
