import { Client } from 'minio'

const u = new URL(process.env.S3_ENDPOINT) // ej: http://minio:9000
export const s3 = new Client({
  endPoint: u.hostname,
  port: Number(u.port || (u.protocol === 'https:' ? 443 : 80)),
  useSSL: u.protocol === 'https:',
  accessKey: process.env.S3_ACCESS,
  secretKey: process.env.S3_SECRET
})
export const BUCKET = process.env.S3_BUCKET
