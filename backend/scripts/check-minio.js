import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env relative to this script or CWD
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const { s3, BUCKET } = await import('../config/s3.js')

async function listFiles() {
    console.log(`\n🔍 Verificando bucket: ${BUCKET}...`)
    console.log('-----------------------------------')

    try {
        const stream = s3.listObjects(BUCKET, '', true)

        console.log('📂 Archivos encontrados:')
        let count = 0

        stream.on('data', (obj) => {
            count++
            console.log(` - [${obj.lastModified.toISOString()}] ${obj.name} (${(obj.size / 1024).toFixed(2)} KB)`)
        })

        stream.on('error', (err) => {
            console.error('❌ Error listando objetos:', err)
        })

        stream.on('end', () => {
            console.log('-----------------------------------')
            console.log(`✅ Total archivos: ${count}\n`)
        })

    } catch (err) {
        console.error('❌ Error conectando a MinIO:', err)
    }
}

listFiles()
