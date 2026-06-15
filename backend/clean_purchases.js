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
        
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        await sequelize.query('DELETE FROM mod_purchase');
        console.log(`- Model3DPurchases eliminados`);
        
        await sequelize.query('DELETE FROM res_reservation');
        console.log(`- Reservations eliminadas`);
        
        await sequelize.query('DELETE FROM bpu_book_purchase');
        console.log(`- BookPurchases eliminados`);
        
        await sequelize.query('DELETE FROM cpu_course_purchase');
        console.log(`- CoursePurchases eliminados`);

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('Limpieza finalizada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la limpieza:', error);
        process.exit(1);
    }
}

clean();
