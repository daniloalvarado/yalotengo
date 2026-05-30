import 'dotenv/config'
import { sequelize } from './config/db.js'

import { Reservation } from './modules/reservation/model.reservation.js'
import { Model3DPurchase } from './modules/models3d/model.model3d.js'
import { BookPurchase } from './modules/books/model.book.js'
import { CoursePurchase } from './modules/courses/model.course.js'

async function clean() {
    try {
        console.log('Iniciando limpieza de tablas de compras/reservas...');
        
        await sequelize.authenticate();
        
        const resModels = await Model3DPurchase.destroy({ where: {} });
        console.log(`- Model3DPurchases eliminados: ${resModels}`);
        
        const resReservations = await Reservation.destroy({ where: {} });
        console.log(`- Reservations eliminadas: ${resReservations}`);
        
        const resBooks = await BookPurchase.destroy({ where: {} });
        console.log(`- BookPurchases eliminados: ${resBooks}`);
        
        const resCourses = await CoursePurchase.destroy({ where: {} });
        console.log(`- CoursePurchases eliminados: ${resCourses}`);
        
        console.log('Limpieza finalizada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la limpieza:', error);
        process.exit(1);
    }
}

clean();
