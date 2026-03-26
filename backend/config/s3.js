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

export async function initMinio() {
    try {
        const exists = await s3.bucketExists(BUCKET)
        if (!exists) {
            await s3.makeBucket(BUCKET, 'us-east-1')
            console.log(`[MinIO] Bucket '${BUCKET}' creado exitosamente.`)
            
            const policy = {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: ["s3:GetObject"],
                        Effect: "Allow",
                        Principal: "*",
                        Resource: [`arn:aws:s3:::${BUCKET}/*`]
                    }
                ]
            }
            await s3.setBucketPolicy(BUCKET, JSON.stringify(policy))
            console.log(`[MinIO] Política pública configurada para el bucket '${BUCKET}'.`)
        } else {
            console.log(`[MinIO] Bucket '${BUCKET}' listo.`)
        }
    } catch (err) {
        console.error(`[MinIO] Error inicializando bucket en ${process.env.S3_ENDPOINT}:`, err.message)
    }
}
