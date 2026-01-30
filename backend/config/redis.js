import IORedis from 'ioredis'
export const redis = new IORedis(process.env.REDIS_URL)
export const QUEUE_PREP = 'prep_jobs'
export const PUB_EVENTS = 'prep_events'
