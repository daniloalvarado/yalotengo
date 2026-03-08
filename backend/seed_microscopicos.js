import { sequelize } from './config/db.js'
import { Microscopico } from './modules/microscopicos/model.microscopico.js'

const seedData = [
  {
    scientificName: 'Neotrombicula autumnalis',
    kingdom: 'Animalia',
    phylum: 'Arthropoda',
    class: 'Arachnida',
    subclass: 'Acari',
    order: 'Trombidiformes',
    family: 'Trombiculidae',
    genus: 'Neotrombicula',
    specificEpithet: 'autumnalis',
    vernacularName: 'Isango / Eutrombicula batatas',
    taxonRemarks: 'El isango es un ácaro microscópico de color rojizo, frecuente en pastizales y vegetación baja de zonas rurales y de la Amazonía. En su fase larvaria puede adherirse a la piel humana y producir una irritación intensa, con ronchas y picazón marcada, sobre todo en piernas y zonas de pliegues. Para reducir el riesgo, se recomienda usar repelente, cubrir las piernas al caminar entre hierba, evitar sentarse directamente sobre pasto seco y realizar higiene de la piel y la ropa después de la exposición.',
    estado: 'activo'
  },
  {
    scientificName: 'Armadillidium vulgare',
    kingdom: 'Animalia',
    phylum: 'Arthropoda',
    subphylum: 'Crustacea',
    class: 'Malacostraca',
    subclass: 'Eumalacostraca',
    order: 'Isopoda',
    family: 'Armadillidiidae',
    genus: 'Armadillidium',
    specificEpithet: 'vulgare',
    vernacularName: 'Bicho bolita o Cochinilla de la humedad',
    taxonRemarks: 'Crustáceo terrestre ampliamente distribuido en Europa y otras regiones del mundo. Posee un exoesqueleto segmentado y siete pares de patas. Su característica más notable es la capacidad de enrollarse completamente formando una esfera (conglobación) como mecanismo de defensa frente a depredadores. Respira mediante estructuras similares a branquias adaptadas a ambientes húmedos, por lo que depende de la humedad para sobrevivir. Se alimenta de hojas y materia orgánica en descomposición, cumpliendo un rol ecológico importante en el reciclaje de nutrientes del suelo. No es peligroso para el ser humano.',
    estado: 'activo'
  },
  {
    scientificName: 'Aceria anthocoptes',
    kingdom: 'Animalia',
    phylum: 'Arthropoda',
    class: 'Arachnida',
    subclass: 'Acari',
    order: 'Trombidiformes',
    family: 'Eriophyidae',
    genus: 'Aceria',
    specificEpithet: 'anthocoptes',
    vernacularName: 'Ácaro del cardo',
    taxonRemarks: 'Ácaro microscópico fitófago, de cuerpo alargado y vermiforme, con solo dos pares de patas (a diferencia de otros ácaros que poseen cuatro). Vive sobre tejidos vegetales, principalmente en cardos, donde succiona el contenido celular. Produce deformaciones, enrollamientos y manchas en hojas y tallos, afectando el crecimiento de la planta. Debido a su especificidad hacia ciertas especies vegetales, se ha utilizado como agente de control biológico contra cardos invasores. No representa riesgo directo para humanos ni animales domésticos.',
    estado: 'activo'
  },
  {
    scientificName: 'Hypsibius dujardini',
    kingdom: 'Animalia',
    phylum: 'Tardigrada',
    class: 'Eutardigrada',
    subclass: 'Parachela', // Omitido por darwin core si es order, lo mapeamos así o lo dejamos vacío
    order: 'Parachela',
    family: 'Hypsibiidae',
    genus: 'Hypsibius',
    specificEpithet: 'dujardini',
    vernacularName: 'Oso de agua',
    taxonRemarks: 'Microanimal acuático conocido como "oso de agua" por su forma robusta y movimientos lentos. Presenta ocho patas cortas terminadas en garras, y un aparato bucal adaptado para perforar células vegetales o alimentarse de microorganismos. Es célebre por su capacidad de entrar en un estado de criptobiosis, reduciendo su metabolismo casi a cero cuando enfrenta desecación, temperaturas extremas, falta de oxígeno o radiación intensa. En ese estado puede sobrevivir durante años. Es inofensivo para humanos y constituye un modelo clave en estudios de biología molecular y resistencia celular.',
    estado: 'activo'
  },
  {
    scientificName: 'Sarcoptes scabiei',
    kingdom: 'Animalia',
    phylum: 'Arthropoda',
    class: 'Arachnida',
    subclass: 'Acari',
    order: 'Sarcoptiformes',
    family: 'Sarcoptidae',
    genus: 'Sarcoptes',
    specificEpithet: 'scabiei',
    vernacularName: 'Ácaro de la sarna',
    taxonRemarks: 'Ácaro parásito microscópico responsable de la sarna en humanos y otros mamíferos. La hembra excava túneles en la capa superficial de la piel (estrato córneo), donde deposita sus huevos. La reacción del sistema inmunológico frente al ácaro y sus productos metabólicos provoca picazón intensa, enrojecimiento y lesiones cutáneas, que suelen intensificarse durante la noche. Se transmite principalmente por contacto directo y prolongado entre personas. Requiere tratamiento médico específico para su eliminación y medidas de higiene para evitar reinfecciones.',
    estado: 'activo'
  }
]

async function seed() {
  try {
    await sequelize.authenticate()
    console.log('Conectado a la base de datos.')

    await Microscopico.sync({ alter: true }) // asegura que exista la tabla
    console.log('Tabla microscopico sincronizada.')
    
    // Contar cuántos hay
    const count = await Microscopico.count()
    if (count > 0) {
      console.log('Ya existen registros en la tabla microscopico. Abortando seed para no duplicar.')
      process.exit(0)
    }

    await Microscopico.bulkCreate(seedData)
    console.log('✅ Base de datos sembrada con 5 animales microscópicos exitosamente.')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error al insertar datos semilla:', error)
    process.exit(1)
  }
}

seed()
