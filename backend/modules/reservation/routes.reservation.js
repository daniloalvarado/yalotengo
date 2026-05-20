import { Router } from 'express'
import { Op } from 'sequelize'
import { auth } from '../../utils/jwt.js'
import { Reservation, generateTimeSlots, getMaxCapacity } from './model.reservation.js'
import { SysConfig } from '../config/model.config.js'
import { generateAndUploadQR, generateQRDataURL } from './qr.generator.js'
import { User } from '../auth/model.user.js'

const r = Router()

// ============================================
// GET /reservations/slots?date=YYYY-MM-DD
// Obtener slots disponibles para una fecha
// ============================================
r.get('/slots', async (req, res) => {
    try {
        const { date } = req.query

        // Validación de formato
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Fecha requerida en formato YYYY-MM-DD' })
        }

        // --- CORRECCIÓN DE ZONA HORARIA ---
        // 1. Obtenemos la fecha ACTUAL del servidor ajustada a su zona horaria local
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // Desfase en milisegundos
        const localDate = new Date(now.getTime() - offset).toISOString().split('T')[0];

        // 2. Comparamos cadenas de texto (Ej: "2026-01-13" < "2026-01-13")
        // Si la fecha pedida es MENOR a la fecha local de hoy, es pasado.
        if (date < localDate) {
            return res.status(400).json({ error: 'No se pueden reservar fechas pasadas' })
        }
        // ----------------------------------

        // --- LÓGICA DE DÍAS CERRADOS ---
        const configs = await SysConfig.findAll()
        const configMap = {}
        configs.forEach(c => configMap[c.key] = c.value)

        const closedDatesStr = configMap['RESERVATION_CLOSED_DAYS'] || ''
        const closedDates = closedDatesStr.split(',').map(d => d.trim()).filter(d => d)

        const closedWeekdaysStr = configMap['RESERVATION_CLOSED_WEEKDAYS'] || ''
        const closedWeekdays = closedWeekdaysStr.split(',').map(d => d.trim()).filter(d => d)

        // 1. Verificar fecha específica
        if (closedDates.includes(date)) {
            return res.json({ closed: true, message: 'El museo se encuentra cerrado en esta fecha.' })
        }

        // 2. Verificar día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
        // Usamos new Date(date + 'T00:00:00') para evitar problemas de zona horaria al sacar el día
        const requestedDateObj = new Date(date + 'T00:00:00')
        const dayOfWeek = requestedDateObj.getDay().toString()
        
        if (closedWeekdays.includes(dayOfWeek)) {
            return res.json({ closed: true, message: 'El museo no atiende este día de la semana.' })
        }
        // ----------------------------------

        const { slots: allSlots, openTime, closeTime } = await generateTimeSlots()
        const maxCapacity = await getMaxCapacity()

        // Contar reservas por slot para esa fecha
        const reservations = await Reservation.findAll({
            where: {
                res_dt_date: date,
                res_txt_status: { [Op.in]: ['PENDING', 'PAID'] }
            },
            attributes: ['res_txt_timeslot', 'res_int_guests']
        })

        // Sumar guests por slot
        const slotCounts = {}
        for (const res of reservations) {
            const slot = res.res_txt_timeslot
            slotCounts[slot] = (slotCounts[slot] || 0) + res.res_int_guests
        }

        // Generar respuesta con disponibilidad
        const slots = allSlots.map(time => {
            const used = slotCounts[time] || 0
            const available = maxCapacity - used
            return {
                time,
                available,
                maxCapacity,
                isFull: available <= 0
            }
        })

        res.json({
            date,
            slots,
            openTime,
            closeTime
        })
    } catch (err) {
        console.error('[Reservations] slots error:', err)
        res.status(500).json({ error: 'Error al obtener slots' })
    }
})

// ============================================
// POST /reservations/create
// Crear una nueva reserva (requiere auth)
// ============================================
r.post('/create', auth, async (req, res) => {
    try {
        const { date, timeslot, guests = 1, price = 0 } = req.body
        const userId = req.user.use_int_id
        const user = await User.findByPk(userId)

        // Validaciones
        if (!date || !timeslot) {
            return res.status(400).json({ error: 'Fecha y horario requeridos' })
        }

        const numGuests = parseInt(guests, 10)
        if (numGuests < 1 || numGuests > 10) {
            return res.status(400).json({ error: 'Número de personas debe ser entre 1 y 10' })
        }

        // Verificar que el slot existe
        const { slots: allSlots } = await generateTimeSlots()
        if (!allSlots.includes(timeslot)) {
            return res.status(400).json({ error: 'Horario no válido' })
        }

        // Verificar disponibilidad
        const maxCapacity = await getMaxCapacity()
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
                error: 'No hay suficientes cupos',
                available: maxCapacity - currentGuests
            })
        }

        // Crear reserva
        const reservation = await Reservation.create({
            use_int_id: userId,
            res_dt_date: date,
            res_txt_timeslot: timeslot,
            res_int_guests: numGuests,
            res_dec_price: price,
            res_txt_status: 'PENDING'
        })

        res.status(201).json({
            ok: true,
            reservation: {
                id: reservation.res_int_id,
                date: reservation.res_dt_date,
                timeslot: reservation.res_txt_timeslot,
                guests: reservation.res_int_guests,
                status: reservation.res_txt_status,
                price: reservation.res_dec_price,
                userName: `${user.use_txt_nombres} ${user.use_txt_apellidos}`
            }
        })
    } catch (err) {
        console.error('[Reservations] create error:', err)
        res.status(500).json({ error: 'Error al crear reserva' })
    }
})

// ============================================
// POST /reservations/:id/pay
// Confirmar pago y generar QR
// ============================================
r.post('/:id/pay', auth, async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.use_int_id

        const reservation = await Reservation.findByPk(id)
        if (!reservation || reservation.use_int_id !== userId) {
            return res.status(404).json({ error: 'Reserva no encontrada' })
        }

        if (reservation.res_txt_status !== 'PENDING') {
            return res.status(400).json({ error: 'La reserva ya fue procesada' })
        }

        // Generar y subir QR
        const qrKey = await generateAndUploadQR(
            reservation.res_txt_qr_code,
            reservation.res_int_id
        )

        // Actualizar estado
        reservation.res_txt_status = 'PAID'
        reservation.res_txt_qr_key = qrKey
        await reservation.save()

        // Generar QR como data URL para mostrar inmediatamente
        const qrDataUrl = await generateQRDataURL(
            reservation.res_txt_qr_code,
            reservation.res_int_id
        )

        const user = await User.findByPk(userId);

        res.json({
            ok: true,
            reservation: {
                id: reservation.res_int_id,
                date: reservation.res_dt_date,
                timeslot: reservation.res_txt_timeslot,
                guests: reservation.res_int_guests,
                status: reservation.res_txt_status,
                qrCode: reservation.res_txt_qr_code,
                qrImage: qrDataUrl,
                userName: `${user.use_txt_nombres} ${user.use_txt_apellidos}`
            }
        })
    } catch (err) {
        console.error('[Reservations] pay error:', err)
        res.status(500).json({ error: 'Error al procesar pago' })
    }
})

// ============================================
// GET /reservations/:id/qr
// Obtener QR de una reserva
// ============================================
r.get('/:id/qr', auth, async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.use_int_id

        const reservation = await Reservation.findByPk(id)
        if (!reservation || reservation.use_int_id !== userId) {
            return res.status(404).json({ error: 'Reserva no encontrada' })
        }

        if (reservation.res_txt_status !== 'PAID') {
            return res.status(400).json({ error: 'La reserva no está pagada' })
        }

        const user = await User.findByPk(userId)
        const qrDataUrl = await generateQRDataURL(
            reservation.res_txt_qr_code,
            reservation.res_int_id
        )

        res.json({
            id: reservation.res_int_id,
            date: reservation.res_dt_date,
            timeslot: reservation.res_txt_timeslot,
            guests: reservation.res_int_guests,
            qrCode: reservation.res_txt_qr_code,
            qrImage: qrDataUrl,
            userName: `${user?.use_txt_nombres || ''} ${user?.use_txt_apellidos || ''}`.trim()
        })
    } catch (err) {
        console.error('[Reservations] qr error:', err)
        res.status(500).json({ error: 'Error al obtener QR' })
    }
})

// ============================================
// POST /reservations/verify
// Verificar QR en la entrada del museo
// ============================================
r.post('/verify', async (req, res) => {
    try {
        const { qrCode } = req.body
        if (!qrCode) {
            return res.status(400).json({ error: 'Código QR requerido' })
        }

        const reservation = await Reservation.findOne({
            where: { res_txt_qr_code: qrCode }
        })

        if (!reservation) {
            return res.status(404).json({
                valid: false,
                error: 'Ticket no encontrado'
            })
        }

        // Verificar estado
        if (reservation.res_txt_status === 'USED') {
            return res.json({
                valid: false,
                error: 'Este ticket ya fue utilizado',
                usedAt: reservation.res_dt_used_at
            })
        }

        if (reservation.res_txt_status !== 'PAID') {
            return res.json({
                valid: false,
                error: 'Este ticket no está pagado'
            })
        }

        // Verificar fecha (debe ser hoy)
        const today = new Date().toISOString().split('T')[0]
        if (reservation.res_dt_date !== today) {
            return res.json({
                valid: false,
                error: `Este ticket es para ${reservation.res_dt_date}, no para hoy`
            })
        }

        // Marcar como usado
        reservation.res_txt_status = 'USED'
        reservation.res_dt_used_at = new Date()
        await reservation.save()

        // Obtener datos del usuario
        const user = await User.findByPk(reservation.use_int_id)

        res.json({
            valid: true,
            message: '¡Bienvenido al museo!',
            reservation: {
                id: reservation.res_int_id,
                date: reservation.res_dt_date,
                timeslot: reservation.res_txt_timeslot,
                guests: reservation.res_int_guests,
                // Add user info
                user: {
                    name: user?.use_txt_nombres || 'Cliente',
                    lastname: user?.use_txt_apellidos || ''
                }
            }
        })
    } catch (err) {
        console.error('[Reservations] verify error:', err)
        res.status(500).json({ error: 'Error al verificar ticket' })
    }
})

// ============================================
// GET /reservations/my
// Obtener mis reservas (CON LIMPIEZA INSTANTÁNEA)
// ============================================
r.get('/my', auth, async (req, res) => {
    try {
        const userId = req.user.use_int_id

        // 👇👇👇 AQUÍ EMPIEZA LA MAGIA (CÓDIGO NUEVO) 👇👇👇
        // Antes de buscar, borramos lo viejo de ESTE usuario inmediatamente
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        await Reservation.update(
            { res_txt_status: 'EXPIRED' },
            {
                where: {
                    use_int_id: userId, // Solo de este usuario
                    res_txt_status: 'PENDING', // Solo las pendientes
                    res_dt_created_at: { [Op.lt]: fifteenMinutesAgo } // Viejas de > 15 min
                }
            }
        );
        // 👆👆👆 AQUÍ TERMINA LA MAGIA 👆👆👆


        // AHORA SÍ, buscamos (ya vendrán limpias)
        const user = await User.findByPk(userId)
        const reservations = await Reservation.findAll({
            where: { use_int_id: userId },
            order: [['res_dt_date', 'DESC'], ['res_txt_timeslot', 'DESC']]
        })

        res.json({
            reservations: reservations.map(r => ({
                id: r.res_int_id,
                date: r.res_dt_date,
                timeslot: r.res_txt_timeslot,
                guests: r.res_int_guests,
                status: r.res_txt_status,
                price: r.res_dec_price,
                currency: r.res_txt_currency || 'PEN', // USD o PEN
                createdAt: r.res_dt_created_at,
                userName: `${user?.use_txt_nombres || ''} ${user?.use_txt_apellidos || ''}`.trim()
            }))
        })
    } catch (err) {
        console.error('[Reservations] my error:', err)
        res.status(500).json({ error: 'Error al obtener reservas' })
    }
})

// ============================================
// DELETE /reservations/:id
// Cancelar/Eliminar una reserva pendiente
// ============================================
r.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.user.use_int_id

        // Buscamos la reserva y verificamos que sea del usuario
        const reservation = await Reservation.findOne({
            where: { res_int_id: id, use_int_id: userId }
        })

        if (!reservation) {
            return res.status(404).json({ error: 'Reserva no encontrada' })
        }

        // Solo permitimos borrar si está PENDING
        if (reservation.res_txt_status !== 'PENDING') {
            return res.status(400).json({ error: 'No se puede cancelar una reserva pagada o usada' })
        }

        // Eliminación física (o lógica si prefieres, aquí la borramos para liberar el slot)
        await reservation.destroy()

        res.json({ ok: true, message: 'Reserva cancelada' })
    } catch (err) {
        console.error('[Reservations] delete error:', err)
        res.status(500).json({ error: 'Error al cancelar reserva' })
    }
})

export default r