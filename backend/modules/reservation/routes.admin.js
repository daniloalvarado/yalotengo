import { Router } from 'express'
import { Op } from 'sequelize'
import { adminAuth } from '../../utils/adminAuth.js'
import { Reservation, generateTimeSlots, getMaxCapacity } from './model.reservation.js'
import { generateAndUploadQR, generateQRDataURL } from './qr.generator.js'
import { User } from '../auth/model.user.js'

const r = Router()

// Todas las rutas requieren admin
r.use(adminAuth)

// ============================================
// GET /admin/reservations
// Listar todas las reservas con filtros
// ============================================
r.get('/', async (req, res) => {
    try {
        const { date, status, page = 1, limit = 50 } = req.query

        const where = {}
        if (date) where.res_dt_date = date
        if (status) where.res_txt_status = status

        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10)

        const { count, rows } = await Reservation.findAndCountAll({
            where,
            order: [['res_dt_date', 'DESC'], ['res_txt_timeslot', 'ASC']],
            limit: parseInt(limit, 10),
            offset
        })

        // Cargar usuarios para mostrar nombres
        const userIds = [...new Set(rows.map(r => r.use_int_id))]
        const users = await User.findAll({ where: { use_int_id: userIds } })
        const userMap = Object.fromEntries(users.map(u => [u.use_int_id, u]))

        const reservations = rows.map(r => ({
            id: r.res_int_id,
            date: r.res_dt_date,
            timeslot: r.res_txt_timeslot,
            guests: r.res_int_guests,
            status: r.res_txt_status,
            price: r.res_dec_price,
            qrCode: r.res_txt_qr_code,
            createdAt: r.res_dt_created_at,
            usedAt: r.res_dt_used_at,
            user: userMap[r.use_int_id] ? {
                id: userMap[r.use_int_id].use_int_id,
                email: userMap[r.use_int_id].use_txt_email,
                name: `${userMap[r.use_int_id].use_txt_nombres || ''} ${userMap[r.use_int_id].use_txt_apellidos || ''}`.trim()
            } : null
        }))

        res.json({
            reservations,
            pagination: {
                total: count,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                pages: Math.ceil(count / parseInt(limit, 10))
            }
        })
    } catch (err) {
        console.error('[Admin] list reservations error:', err)
        res.status(500).json({ error: 'Error al listar reservas' })
    }
})

// ============================================
// POST /admin/reservations/walk-in
// Venta en taquilla (visitante presencial)
// ============================================
r.post('/walk-in', async (req, res) => {
    try {
        const { date, timeslot, guests = 1, price = 0, customerName = '' } = req.body

        if (!date || !timeslot) {
            return res.status(400).json({ error: 'Fecha y horario requeridos' })
        }

        const numGuests = parseInt(guests, 10)
        if (numGuests < 1 || numGuests > 10) {
            return res.status(400).json({ error: 'Número de personas debe ser entre 1 y 10' })
        }

        // Verificar slot válido
        const allSlots = generateTimeSlots()
        if (!allSlots.includes(timeslot)) {
            return res.status(400).json({ error: 'Horario no válido' })
        }

        // Verificar disponibilidad
        const maxCapacity = getMaxCapacity()
        const currentReservations = await Reservation.findAll({
            where: {
                res_dt_date: date,
                res_txt_timeslot: timeslot,
                res_txt_status: { [Op.in]: ['PENDING', 'PAID'] }
            }
        })

        const currentGuests = currentReservations.reduce((sum, r) => sum + r.res_int_guests, 0)
        if (currentGuests + numGuests > maxCapacity) {
            return res.status(409).json({
                error: 'No hay suficiente disponibilidad',
                available: maxCapacity - currentGuests
            })
        }

        // Crear reserva como PAID (pago en efectivo)
        const reservation = await Reservation.create({
            use_int_id: req.user.use_int_id, // Admin que registra
            res_dt_date: date,
            res_txt_timeslot: timeslot,
            res_int_guests: numGuests,
            res_dec_price: price,
            res_txt_status: 'PAID' // Directamente pagado
        })

        // Generar QR
        const qrKey = await generateAndUploadQR(
            reservation.res_txt_qr_code,
            reservation.res_int_id
        )
        reservation.res_txt_qr_key = qrKey
        await reservation.save()

        const qrDataUrl = await generateQRDataURL(
            reservation.res_txt_qr_code,
            reservation.res_int_id
        )

        res.status(201).json({
            ok: true,
            reservation: {
                id: reservation.res_int_id,
                date: reservation.res_dt_date,
                timeslot: reservation.res_txt_timeslot,
                guests: reservation.res_int_guests,
                status: reservation.res_txt_status,
                qrCode: reservation.res_txt_qr_code,
                qrImage: qrDataUrl
            }
        })
    } catch (err) {
        console.error('[Admin] walk-in error:', err)
        res.status(500).json({ error: 'Error al crear venta' })
    }
})

// ============================================
// POST /admin/reservations/:id/validate
// Validar entrada manualmente
// ============================================
r.post('/:id/validate', async (req, res) => {
    try {
        const { id } = req.params

        const reservation = await Reservation.findByPk(id)
        if (!reservation) {
            return res.status(404).json({ error: 'Reserva no encontrada' })
        }

        if (reservation.res_txt_status === 'USED') {
            return res.status(400).json({
                error: 'Este ticket ya fue utilizado',
                usedAt: reservation.res_dt_used_at
            })
        }

        if (reservation.res_txt_status !== 'PAID') {
            return res.status(400).json({ error: 'Este ticket no está pagado' })
        }

        // Marcar como usado
        reservation.res_txt_status = 'USED'
        reservation.res_dt_used_at = new Date()
        await reservation.save()

        res.json({
            ok: true,
            message: 'Entrada validada correctamente',
            reservation: {
                id: reservation.res_int_id,
                date: reservation.res_dt_date,
                timeslot: reservation.res_txt_timeslot,
                guests: reservation.res_int_guests
            }
        })
    } catch (err) {
        console.error('[Admin] validate error:', err)
        res.status(500).json({ error: 'Error al validar entrada' })
    }
})

// ============================================
// DELETE /admin/reservations/:id
// Cancelar reserva
// ============================================
r.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params

        const reservation = await Reservation.findByPk(id)
        if (!reservation) {
            return res.status(404).json({ error: 'Reserva no encontrada' })
        }

        if (reservation.res_txt_status === 'USED') {
            return res.status(400).json({ error: 'No se puede cancelar un ticket ya usado' })
        }

        reservation.res_txt_status = 'CANCELLED'
        await reservation.save()

        res.json({ ok: true, message: 'Reserva cancelada' })
    } catch (err) {
        console.error('[Admin] delete error:', err)
        res.status(500).json({ error: 'Error al cancelar reserva' })
    }
})

// ============================================
// POST /admin/reservations/cleanup
// Limpiar reservas PENDING antiguas
// ============================================
r.post('/cleanup', async (req, res) => {
    try {
        const result = await cleanupPendingReservations()
        res.json(result)
    } catch (err) {
        console.error('[Admin] cleanup error:', err)
        res.status(500).json({ error: 'Error en limpieza' })
    }
})

// ============================================
// GET /admin/reservations/stats
// Estadísticas del día
// ============================================
r.get('/stats', async (req, res) => {
    try {
        const { date } = req.query
        const targetDate = date || new Date().toISOString().split('T')[0]

        const reservations = await Reservation.findAll({
            where: { res_dt_date: targetDate }
        })

        const stats = {
            date: targetDate,
            total: reservations.length,
            totalGuests: reservations.reduce((sum, r) => sum + r.res_int_guests, 0),
            byStatus: {
                PENDING: 0,
                PAID: 0,
                USED: 0,
                EXPIRED: 0,
                CANCELLED: 0
            },
            revenue: 0
        }

        for (const r of reservations) {
            stats.byStatus[r.res_txt_status] = (stats.byStatus[r.res_txt_status] || 0) + 1
            if (['PAID', 'USED'].includes(r.res_txt_status)) {
                stats.revenue += Number(r.res_dec_price || 0)
            }
        }

        res.json(stats)
    } catch (err) {
        console.error('[Admin] stats error:', err)
        res.status(500).json({ error: 'Error al obtener estadísticas' })
    }
})

// ============================================
// Función de limpieza automática
// ============================================
export async function cleanupPendingReservations() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

    const [updated] = await Reservation.update(
        { res_txt_status: 'EXPIRED' },
        {
            where: {
                res_txt_status: 'PENDING',
                res_dt_created_at: { [Op.lt]: fifteenMinutesAgo }
            }
        }
    )

    console.log(`[Cleanup] ${updated} reservas PENDING expiradas`)
    return { cleaned: updated }
}

// Ejecutar limpieza cada 5 minutos
setInterval(() => {
    cleanupPendingReservations().catch(console.error)
}, 5 * 60 * 1000)

export default r
