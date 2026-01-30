import { Router } from 'express'
import { adminAuth } from '../../utils/adminAuth.js'
import { Reservation } from '../reservation/model.reservation.js'
import { Model3D, Model3DPurchase } from '../models3d/model.model3d.js'
import { Book, BookPurchase } from '../books/model.book.js'
import { Course, CoursePurchase } from '../courses/model.course.js'
import { User } from '../auth/model.user.js'
import { Op } from 'sequelize'

const r = Router()

// GET /admin/stats - Estadísticas generales del dashboard
r.get('/', adminAuth, async (req, res) => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // ===== RESERVAS =====
        const allReservations = await Reservation.findAll({
            where: { res_txt_status: { [Op.in]: ['PAID', 'USED'] } }
        })
        const reservationsToday = allReservations.filter(r => {
            const createdAt = new Date(r.res_dt_created_at)
            return createdAt >= today
        })
        const reservationsRevenue = allReservations.reduce((sum, r) => sum + parseFloat(r.res_dec_price || 0), 0)
        const visitorsToday = reservationsToday.reduce((sum, r) => sum + (r.res_int_guests || 0), 0)

        // ===== MODELOS 3D =====
        const modelPurchases = await Model3DPurchase.findAll({
            where: { pur_txt_status: 'PAID' }
        })
        const modelsRevenue = modelPurchases.reduce((sum, p) => sum + parseFloat(p.pur_dec_amount || 0), 0)
        const modelsSoldCount = modelPurchases.length

        // ===== LIBROS =====
        const bookPurchases = await BookPurchase.findAll({
            where: { bpu_txt_status: 'PAID' }
        })
        const booksRevenue = bookPurchases.reduce((sum, p) => sum + parseFloat(p.bpu_dec_amount || 0), 0)
        const booksSoldCount = bookPurchases.length

        // ===== CURSOS =====
        const coursePurchases = await CoursePurchase.findAll({
            where: { cpu_txt_status: 'PAID' }
        })
        const coursesRevenue = coursePurchases.reduce((sum, p) => sum + parseFloat(p.cpu_dec_amount || 0), 0)
        const coursesSoldCount = coursePurchases.length

        // ===== TOTALES =====
        const totalRevenue = reservationsRevenue + modelsRevenue + booksRevenue + coursesRevenue

        res.json({
            reservations: {
                total: allReservations.length,
                today: reservationsToday.length,
                visitorsToday,
                revenue: reservationsRevenue
            },
            models3d: {
                sold: modelsSoldCount,
                revenue: modelsRevenue
            },
            books: {
                sold: booksSoldCount,
                revenue: booksRevenue
            },
            courses: {
                sold: coursesSoldCount,
                revenue: coursesRevenue
            },
            total: {
                revenue: totalRevenue,
                transactions: allReservations.length + modelsSoldCount + booksSoldCount + coursesSoldCount
            }
        })
    } catch (err) {
        console.error('[Admin Stats] error:', err)
        res.status(500).json({ error: 'Error al obtener estadísticas' })
    }
})

// GET /admin/stats/purchases/models3d - Compras de modelos 3D
r.get('/purchases/models3d', adminAuth, async (req, res) => {
    try {
        const purchases = await Model3DPurchase.findAll({
            include: [{ model: Model3D, as: 'model' }],
            order: [['pur_dt_created', 'DESC']]
        })

        // Obtener usuarios
        const userIds = [...new Set(purchases.map(p => p.use_int_id))]
        const users = await User.findAll({ where: { use_int_id: userIds } })
        const userMap = Object.fromEntries(users.map(u => [u.use_int_id, u]))

        res.json(purchases.map(p => ({
            id: p.pur_int_id,
            userId: p.use_int_id,
            userName: userMap[p.use_int_id] ?
                `${userMap[p.use_int_id].use_txt_nombres} ${userMap[p.use_int_id].use_txt_apellidos}` : 'N/A',
            userEmail: userMap[p.use_int_id]?.use_txt_email || 'N/A',
            modelId: p.mod_int_id,
            modelName: p.model?.mod_txt_name || 'N/A',
            amount: p.pur_dec_amount,
            status: p.pur_txt_status,
            paymentId: p.pur_txt_payment_id,
            createdAt: p.pur_dt_created
        })))
    } catch (err) {
        console.error('[Admin Stats] models3d purchases error:', err)
        res.status(500).json({ error: 'Error al obtener compras' })
    }
})

// GET /admin/stats/purchases/books - Compras de libros
r.get('/purchases/books', adminAuth, async (req, res) => {
    try {
        const purchases = await BookPurchase.findAll({
            include: [{ model: Book, as: 'book' }],
            order: [['bpu_dt_created', 'DESC']]
        })

        const userIds = [...new Set(purchases.map(p => p.use_int_id))]
        const users = await User.findAll({ where: { use_int_id: userIds } })
        const userMap = Object.fromEntries(users.map(u => [u.use_int_id, u]))

        res.json(purchases.map(p => ({
            id: p.bpu_int_id,
            userId: p.use_int_id,
            userName: userMap[p.use_int_id] ?
                `${userMap[p.use_int_id].use_txt_nombres} ${userMap[p.use_int_id].use_txt_apellidos}` : 'N/A',
            userEmail: userMap[p.use_int_id]?.use_txt_email || 'N/A',
            bookId: p.boo_int_id,
            bookTitle: p.book?.boo_txt_title || 'N/A',
            bookAuthor: p.book?.boo_txt_author || '',
            amount: p.bpu_dec_amount,
            status: p.bpu_txt_status,
            paymentId: p.bpu_txt_payment_id,
            createdAt: p.bpu_dt_created
        })))
    } catch (err) {
        console.error('[Admin Stats] books purchases error:', err)
        res.status(500).json({ error: 'Error al obtener compras' })
    }
})

// GET /admin/stats/purchases/courses - Compras de cursos
r.get('/purchases/courses', adminAuth, async (req, res) => {
    try {
        const purchases = await CoursePurchase.findAll({
            include: [{ model: Course, as: 'course' }],
            order: [['cpu_dt_created', 'DESC']]
        })

        const userIds = [...new Set(purchases.map(p => p.use_int_id))]
        const users = await User.findAll({ where: { use_int_id: userIds } })
        const userMap = Object.fromEntries(users.map(u => [u.use_int_id, u]))

        res.json(purchases.map(p => ({
            id: p.cpu_int_id,
            userId: p.use_int_id,
            userName: userMap[p.use_int_id] ?
                `${userMap[p.use_int_id].use_txt_nombres} ${userMap[p.use_int_id].use_txt_apellidos}` : 'N/A',
            userEmail: userMap[p.use_int_id]?.use_txt_email || 'N/A',
            courseId: p.cou_int_id,
            courseTitle: p.course?.cou_txt_title || 'N/A',
            amount: p.cpu_dec_amount,
            status: p.cpu_txt_status,
            paymentId: p.cpu_txt_payment_id,
            createdAt: p.cpu_dt_created
        })))
    } catch (err) {
        console.error('[Admin Stats] courses purchases error:', err)
        res.status(500).json({ error: 'Error al obtener compras' })
    }
})

// GET /admin/stats/history - Historial de ingresos (Gráfico)
r.get('/history', adminAuth, async (req, res) => {
    try {
        // Usamos Reservation.sequelize para ejecutar SQL directo, ya que es más eficiente para unir tablas
        // Nota: Asegúrate de que los nombres de las columnas coincidan con tu DB (res_dt_created_at, pur_dt_created, etc)
        const query = `
            SELECT DATE(fecha) as date, SUM(monto) as amount
            FROM (
                -- 1. Ventas de Modelos 3D
                SELECT pur_dt_created as fecha, pur_dec_amount as monto 
                FROM mod_purchase 
                WHERE pur_txt_status = 'PAID'

                UNION ALL

                -- 2. Ventas de Libros
                SELECT bpu_dt_created as fecha, bpu_dec_amount as monto 
                FROM bpu_book_purchase 
                WHERE bpu_txt_status = 'PAID'

                UNION ALL

                -- 3. Ventas de Cursos
                SELECT cpu_dt_created as fecha, cpu_dec_amount as monto 
                FROM cpu_course_purchase 
                WHERE cpu_txt_status = 'PAID'

                UNION ALL

                -- 4. Reservas de Museo
                SELECT res_dt_created_at as fecha, res_dec_price as monto 
                FROM res_reservation 
                WHERE res_txt_status IN ('PAID', 'USED')
            ) as ingresos_totales
            GROUP BY DATE(fecha)
            ORDER BY date ASC
            LIMIT 7;
        `;

        // Ejecutamos la consulta usando la instancia de Sequelize que ya tiene el modelo Reservation
        const [results] = await Reservation.sequelize.query(query);

        // Formateamos los datos para el gráfico del frontend
        const formattedData = results.map(row => ({
            date: new Date(row.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }),
            amount: parseFloat(row.amount) || 0
        }));

        res.json(formattedData);

    } catch (err) {
        console.error('[Admin Stats] history error:', err);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
})

// GET /admin/stats/analytics - Inteligencia de Negocio Avanzada
r.get('/analytics', adminAuth, async (req, res) => {
    try {
        const sequelize = Reservation.sequelize;

        // 1. TOP PRODUCTOS
        const [topBook] = await sequelize.query(`
            SELECT b.boo_txt_title as name, COUNT(*) as sales, 'Libro' as type
            FROM bpu_book_purchase p
            JOIN boo_book b ON p.boo_int_id = b.boo_int_id
            WHERE p.bpu_txt_status = 'PAID'
            GROUP BY b.boo_int_id ORDER BY sales DESC LIMIT 1
        `);

        const [topCourse] = await sequelize.query(`
            SELECT c.cou_txt_title as name, COUNT(*) as sales, 'Curso' as type
            FROM cpu_course_purchase p
            JOIN cou_course c ON p.cou_int_id = c.cou_int_id
            WHERE p.cpu_txt_status = 'PAID'
            GROUP BY c.cou_int_id ORDER BY sales DESC LIMIT 1
        `);

        const [topModel] = await sequelize.query(`
            SELECT m.mod_txt_name as name, COUNT(*) as sales, 'Modelo 3D' as type
            FROM mod_purchase p
            JOIN mod_model3d m ON p.mod_int_id = m.mod_int_id
            WHERE p.pur_txt_status = 'PAID'
            GROUP BY m.mod_int_id ORDER BY sales DESC LIMIT 1
        `);

        // 2. HORA PICO DEL MUSEO
        const [peakHour] = await sequelize.query(`
            SELECT res_txt_timeslot as time, COUNT(*) as count
            FROM res_reservation
            WHERE res_txt_status IN ('PAID', 'USED')
            GROUP BY res_txt_timeslot ORDER BY count DESC LIMIT 1
        `);

        // 3. CLIENTES VIP (CORREGIDO: core_user en lugar de use_user)
        const [topClients] = await sequelize.query(`
            SELECT u.use_txt_nombres, u.use_txt_apellidos, u.use_txt_email, SUM(monto) as total_spent
            FROM (
                SELECT use_int_id, pur_dec_amount as monto FROM mod_purchase WHERE pur_txt_status='PAID'
                UNION ALL
                SELECT use_int_id, bpu_dec_amount FROM bpu_book_purchase WHERE bpu_txt_status='PAID'
                UNION ALL
                SELECT use_int_id, cpu_dec_amount FROM cpu_course_purchase WHERE cpu_txt_status='PAID'
                UNION ALL
                SELECT use_int_id, res_dec_price FROM res_reservation WHERE res_txt_status='PAID'
            ) as sales
            JOIN core_user u ON sales.use_int_id = u.use_int_id
            GROUP BY u.use_int_id
            ORDER BY total_spent DESC
            LIMIT 3
        `);

        // 4. DÍA MÁS RENTABLE
        const [bestDay] = await sequelize.query(`
            SELECT DAYNAME(fecha) as day, SUM(monto) as revenue
            FROM (
                SELECT pur_dt_created as fecha, pur_dec_amount as monto FROM mod_purchase WHERE pur_txt_status='PAID'
                UNION ALL
                SELECT bpu_dt_created as fecha, bpu_dec_amount FROM bpu_book_purchase WHERE bpu_txt_status='PAID'
                UNION ALL
                SELECT cpu_dt_created as fecha, cpu_dec_amount FROM cpu_course_purchase WHERE cpu_txt_status='PAID'
                UNION ALL
                SELECT res_dt_created_at as fecha, res_dec_price FROM res_reservation WHERE res_txt_status='PAID'
            ) as all_sales
            GROUP BY day
            ORDER BY revenue DESC
        `);

        // 5. TASA DE COMPRA CRUZADA
        const [crossSell] = await sequelize.query(`
            SELECT 
                COUNT(DISTINCT use_int_id) as total_customers,
                COUNT(DISTINCT CASE WHEN category_count > 1 THEN use_int_id END) as multi_category_buyers
            FROM (
                SELECT use_int_id, COUNT(DISTINCT category) as category_count
                FROM (
                    SELECT use_int_id, 'MOD' as category FROM mod_purchase WHERE pur_txt_status='PAID'
                    UNION ALL
                    SELECT use_int_id, 'BOOK' FROM bpu_book_purchase WHERE bpu_txt_status='PAID'
                    UNION ALL
                    SELECT use_int_id, 'COURSE' FROM cpu_course_purchase WHERE cpu_txt_status='PAID'
                    UNION ALL
                    SELECT use_int_id, 'RES' FROM res_reservation WHERE res_txt_status='PAID'
                ) as combined
                GROUP BY use_int_id
            ) as user_categories
        `);

        res.json({
            topProducts: {
                book: topBook[0] || null,
                course: topCourse[0] || null,
                model: topModel[0] || null
            },
            peakHour: peakHour[0] || null,
            vipClients: topClients,
            bestDays: bestDay,
            crossSell: crossSell[0]
        });

    } catch (err) {
        console.error('[Analytics] Error:', err);
        res.status(500).json({ error: 'Error calculando inteligencia de negocios' });
    }
});

export default r