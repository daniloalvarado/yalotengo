import { redis, QUEUE_PREP } from '../../config/redis.js'
export async function enqueuePrepJob(job){
  await redis.lpush(QUEUE_PREP, JSON.stringify(job))
  console.log('[QUEUE] LPUSH', { ori_int_id: job.ori_int_id })
  return true
}
