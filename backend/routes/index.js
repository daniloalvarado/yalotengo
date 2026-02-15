import { Router } from 'express'
import statusRoutes from './status.js'

// ✅ AUTH
import authRoutes from '../modules/auth/routes.auth.js'

// ✅ ARCHIVOS Y NOTIFICACIONES
import downloadsRoutes from '../modules/files/routes.downloads.js'
import notifyRoutes from '../modules/notify/routes.notify.js'
import internalRoutes from '../modules/internal/routes.internal.js'

// ✅ CART (Nuevo: Pago unificado)
import cartRoutes from '../modules/cart/routes.cart.js'

// ✅ RESERVAS MUSEO (con MercadoPago)
import reservationRoutes from '../modules/reservation/routes.reservation.js'
import adminReservationRoutes from '../modules/reservation/routes.admin.js'
import mercadopagoRoutes from '../modules/reservation/routes.mercadopago.js'

// ✅ MODELOS 3D (con MercadoPago)
import models3dRoutes from '../modules/models3d/routes.models3d.js'

// ✅ LIBROS (con MercadoPago)
import booksRoutes from '../modules/books/routes.books.js'

// ✅ CURSOS (con MercadoPago)
import coursesRoutes from '../modules/courses/routes.courses.js'

// ✅ ADMIN - Gestión de catálogo
import adminModels3dRoutes from '../modules/admin/routes.admin.models3d.js'
import adminBooksRoutes from '../modules/admin/routes.admin.books.js'
import adminCoursesRoutes from '../modules/admin/routes.admin.courses.js'
import adminStatsRoutes from '../modules/admin/routes.admin.stats.js'
const r = Router()

// Estado y salud
r.use('/', statusRoutes)

// --- ZONA DE AUTENTICACIÓN ---
r.use('/api/auth', authRoutes)
r.use('/auth', authRoutes)



// --- MODELOS 3D ---
r.use('/models3d', models3dRoutes)

// --- LIBROS ---
r.use('/books', booksRoutes)

// --- CURSOS ---
r.use('/courses', coursesRoutes)

// --- UTILIDADES ---
r.use('/files', downloadsRoutes)
r.use('/notify', notifyRoutes)
r.use('/', internalRoutes)

// --- CARRITO UNIFICADO ---
r.use('/cart', cartRoutes)

// --- RESERVAS MUSEO (MercadoPago) ---
r.use('/reservations', reservationRoutes)
r.use('/reservations', mercadopagoRoutes)
r.use('/admin/reservations', adminReservationRoutes)

// --- ADMIN CATÁLOGO ---
r.use('/admin/models3d', adminModels3dRoutes)
r.use('/admin/books', adminBooksRoutes)
r.use('/admin/courses', adminCoursesRoutes)
r.use('/admin/stats', adminStatsRoutes)

export default r