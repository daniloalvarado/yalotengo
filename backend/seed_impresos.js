
import 'dotenv/config'
import { sequelize } from './config/db.js'
import { Model3D } from './modules/models3d/model.model3d.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function seedPrintedModels() {
    try {
        await sequelize.authenticate()
        console.log('Connected to DB')

        const impresosDir = path.join(__dirname, 'uploads', 'impresos')
        if (!fs.existsSync(impresosDir)) {
            console.log('No impresos directory found')
            return
        }

        const files = fs.readdirSync(impresosDir)
        const images = files.filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i))

        console.log(`Found ${images.length} images to process`)

        for (const img of images) {
            // Check if exists
            const exists = await Model3D.findOne({ where: { mod_txt_glb_filename: img } })
            if (exists) {
                console.log(`Skipping ${img}, already exists`)
                continue
            }

            const name = img.replace(/\.[^/.]+$/, "").replace(/_/g, " ")

            await Model3D.create({
                mod_txt_name: name,
                mod_txt_desc: 'Modelo impreso disponible para venta directa.',
                mod_txt_glb_filename: img,
                mod_dec_price: 49.90, // Default price
                mod_txt_category: 'IMPRESO',
                mod_bool_active: true
            })
            console.log(`Created product for ${img}`)
        }

        console.log('Done!')
        process.exit(0)
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

seedPrintedModels()
