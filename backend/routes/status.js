// backend/routes/status.js
import { Router } from 'express'
import { sequelize } from '../config/db.js'
import { redis, QUEUE_PREP } from '../config/redis.js'
import { s3, BUCKET } from '../config/s3.js'
import fs from 'fs/promises'

const r = Router()

async function pkgInfo() {
  try {
    const pkgPath = new URL('../package.json', import.meta.url)
    const raw = await fs.readFile(pkgPath)
    const pkg = JSON.parse(raw.toString())
    return { name: pkg.name, version: pkg.version }
  } catch {
    return { name: 'tienda_2025_backend', version: '0.0.0' }
  }
}

async function checkDB() {
  const t0 = Date.now()
  try {
    await sequelize.query('SELECT 1')
    return { ok: true, latency_ms: Date.now() - t0 }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

async function checkRedis() {
  const t0 = Date.now()
  try {
    const pong = await redis.ping()
    return { ok: pong === 'PONG', latency_ms: Date.now() - t0 }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

async function checkMinio() {
  try {
    const exists = await new Promise((resolve, reject)=>{
      s3.bucketExists(BUCKET, (err, ok)=> err ? reject(err) : resolve(ok))
    })
    return { ok: !!exists, bucket: BUCKET }
  } catch (e) {
    return { ok: false, error: e.message, bucket: BUCKET }
  }
}

// Liveness
r.get('/health/live', (_req,res)=> res.json({ status: 'ok', pid: process.pid, uptime_s: Math.round(process.uptime()) }))

// Readiness
r.get('/health/ready', async (_req,res)=> {
  const [db, redisC] = await Promise.all([checkDB(), checkRedis()])
  const ready = db.ok && redisC.ok
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'degraded', checks: { db, redis: redisC } })
})

// Status detallado
r.get('/status', async (req,res)=> {
  const deep = ['1','true','yes'].includes(String(req.query.deep||'').toLowerCase())
  const [meta, db, redisC] = await Promise.all([pkgInfo(), checkDB(), checkRedis()])
  const result = {
    status: (db.ok && redisC.ok) ? 'ok' : 'degraded',
    service: meta.name,
    version: meta.version,
    env: {
      node: process.version,
      port: process.env.PORT || 3000
    },
    now: new Date().toISOString(),
    uptime_s: Math.round(process.uptime()),
    checks: { db, redis: redisC }
  }
  if (deep) result.checks.minio = await checkMinio()
  res.status(result.status === 'ok' ? 200 : 503).json(result)
})




// GET /status/queue?n=10  -> tamaño y primeros N elementos de la cola
r.get('/status/queue', async (req, res) => {
  const len = await redis.llen(QUEUE_PREP)
  const n = Math.min(Number(req.query.n || 10), 50)
  const raw = len > 0 ? await redis.lrange(QUEUE_PREP, 0, n - 1) : []
  const head = raw.map(s => { try { return JSON.parse(s) } catch { return s } })
  res.json({ key: QUEUE_PREP, length: len, head })
})

// GET /status/queue/contains/:oriId  -> ¿está este item en cola?
r.get('/status/queue/contains/:oriId', async (req, res) => {
  const len = await redis.llen(QUEUE_PREP)
  // Escanear hasta 2000 elementos desde la cabeza (ajusta si necesitas)
  const scan = Math.min(len - 1, 2000)
  const raw = scan >= 0 ? await redis.lrange(QUEUE_PREP, 0, scan) : []
  const found = raw.some(s => {
    try { const j = JSON.parse(s); return String(j.ori_int_id) === String(req.params.oriId) }
    catch { return false }
  })
  res.json({ key: QUEUE_PREP, length: len, contains: found, scanned: scan + 1 })
})

export default r
