import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

import {
    TicketIcon,
    QrCodeIcon,
    ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";

// Importar los nuevos componentes hijos
import AdminSales from './AdminSales'
import AdminScanner from './AdminScanner'
import AdminManagement from './AdminManagement'

const STATUS_LABELS = {
    PENDING: 'Pendiente', PAID: 'Pagado', USED: 'Usado',
    EXPIRED: 'Vencido', CANCELLED: 'Cancelado'
};

const THEME = {
    primary: '#0d9467', primaryDark: '#0a7551', primaryLight: '#e6f7f2',
    textDark: '#1a1a2e', danger: '#ef4444', warning: '#f59e0b',
    gray: '#9ca3af', bgLight: '#f8f9fa'
};

export default function AdminReservations() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('sales')

    const getTodayDate = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };
    const today = getTodayDate();

    // Estados de Venta
    const [date, setDate] = useState(today)
    const [slots, setSlots] = useState([])
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [guests, setGuests] = useState(1)
    const FIXED_PRICE = 2;

    // Estados de Gestión
    const [reservations, setReservations] = useState([])
    const [filterDate, setFilterDate] = useState(today)
    const [filterStatus, setFilterStatus] = useState('')
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(false)

    // Estados de Escáner
    const [scannerActive, setScannerActive] = useState(false)
    const [lastScan, setLastScan] = useState(null)

    // Funciones Auxiliares
    const formatTime = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    };

    const isTimePast = (slotTime) => {
        if (date !== today) return false;
        const now = new Date();
        const [slotHours, slotMinutes] = slotTime.split(':').map(Number);
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        if (slotHours < currentHours) return true;
        if (slotHours === currentHours && slotMinutes < currentMinutes) return true;
        return false;
    };

    // Efectos
    useEffect(() => {
        if (activeTab === 'sales' && date) {
            api.get(`/reservations/slots?date=${date}`)
                .then(res => setSlots(res.data.slots || []))
                .catch(err => toast.error(err.response?.data?.error || 'No hay horarios disponibles'))
        }
    }, [date, activeTab])

    useEffect(() => {
        if (activeTab === 'table') {
            loadReservations()
            loadStats()
        }
    }, [activeTab, filterDate, filterStatus])

    // Lógica de Negocio
    const loadReservations = async () => {
        try {
            const params = new URLSearchParams()
            if (filterDate) params.append('date', filterDate)
            if (filterStatus) params.append('status', filterStatus)
            const res = await api.get(`/admin/reservations?${params}`)
            setReservations(res.data.reservations || [])
        } catch (err) {
            toast.error('Error al cargar reservas')
        }
    }

    const loadStats = async () => {
        try {
            const res = await api.get(`/admin/reservations/stats?date=${filterDate}`)
            setStats(res.data)
        } catch (err) {
            console.error('Error loading stats:', err)
        }
    }

    const realVisitors = reservations
        .filter(r => r.status === 'USED')
        .reduce((sum, r) => sum + Number(r.guests), 0);

    const handleWalkIn = async () => {
        if (loading) return;
        if (!selectedSlot) { toast.error('Selecciona un horario'); return }
        const result = await Swal.fire({
            title: '¿Registrar Venta?',
            html: `Horario: <b>${formatTime(selectedSlot)}</b><br>Personas: <b>${guests}</b><br>Total: <b style="color:${THEME.primary}; font-size:1.2em">S/ ${(guests * FIXED_PRICE).toFixed(2)}</b>`,
            icon: 'question', showCancelButton: true, confirmButtonColor: THEME.primary, cancelButtonColor: THEME.gray, confirmButtonText: 'Sí, cobrar'
        });

        if (!result.isConfirmed) return;
        setLoading(true)
        try {
            const res = await api.post('/admin/reservations/walk-in', { date, timeslot: selectedSlot, guests, price: guests * FIXED_PRICE })
            Swal.fire({ title: '¡Venta Registrada!', text: `Entradas generadas para ${res.data.reservation.guests} personas.`, icon: 'success', confirmButtonColor: THEME.primary, timer: 2000 });
            setSelectedSlot(null); setGuests(1);
            const slotsRes = await api.get(`/reservations/slots?date=${date}`)
            setSlots(slotsRes.data.slots || [])
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al registrar venta')
        } finally { setLoading(false) }
    }

    const handleScan = useCallback(async (result) => {
        if (!result?.[0]?.rawValue) return
        const scannedData = result[0].rawValue
        setLastScan({ scanning: true })
        try {
            const parsed = JSON.parse(scannedData)
            const res = await api.post('/reservations/verify', { qrCode: parsed.code })
            const isValid = res.data.valid;
            setLastScan({ valid: isValid, message: res.data.message || res.data.error, reservation: res.data.reservation })
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
            if (isValid) Toast.fire({ icon: 'success', title: res.data.message })
            else Toast.fire({ icon: 'error', title: res.data.error })
        } catch (err) {
            setLastScan({ valid: false, message: 'QR inválido o error de red' })
            toast.error('Error al verificar QR')
        }
    }, [])

    const handleValidate = async (id) => {
        if (loading) return;
        setLoading(true)
        try {
            await api.post(`/admin/reservations/${id}/validate`)
            toast.success('Entrada validada')
            loadReservations(); loadStats()
        } catch (err) { toast.error(err.response?.data?.error || 'Error al validar') }
        finally { setLoading(false) }
    }

    const handleCancel = async (id) => {
        if (loading) return;
        const result = await Swal.fire({ title: '¿Cancelar reserva?', text: "Esta acción no se puede deshacer.", icon: 'warning', showCancelButton: true, confirmButtonColor: THEME.danger, cancelButtonColor: THEME.gray, confirmButtonText: 'Sí, cancelar' });
        if (result.isConfirmed) {
            setLoading(true)
            try {
                await api.delete(`/admin/reservations/${id}`)
                Swal.fire({ title: 'Cancelada', text: 'La reserva ha sido eliminada.', icon: 'success', confirmButtonColor: THEME.primary });
                loadReservations(); loadStats()
            } catch (err) { toast.error(err.response?.data?.error || 'Error al cancelar') }
            finally { setLoading(false) }
        }
    }

    // --- ESTILOS CORREGIDOS ---
    const styles = {
        container: { maxWidth: '1200px', margin: '1rem auto', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
        title: { fontSize: '1.75rem', fontWeight: 'bold', color: THEME.textDark },

        tabs: { display: 'flex', gap: '0.8rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'flex-start' },
        tab: (active) => ({
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0.75rem 1.25rem', fontSize: '0.95rem', fontWeight: '600',
            border: active ? `2px solid ${THEME.primary}` : '2px solid transparent',
            borderRadius: '10px', cursor: 'pointer',
            backgroundColor: active ? THEME.primaryLight : '#fff',
            color: active ? THEME.primary : '#6b7280',
            transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }),

        section: { backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -5px rgba(0,0,0,0.05)' },

        // Estilo base de botón para reusar
        slotBtn: (slot, isSelected, isPast) => ({
            borderRadius: '8px', cursor: (slot.isFull || isPast) ? 'not-allowed' : 'pointer',
            backgroundColor: (slot.isFull || isPast) ? '#f3f4f6' : isSelected ? THEME.primary : '#fff',
            color: (slot.isFull || isPast) ? '#9ca3af' : isSelected ? '#fff' : '#374151',
            boxShadow: isSelected ? `0 4px 6px -1px ${THEME.primary}50` : '0 1px 2px rgba(0,0,0,0.05)',
            border: isSelected ? 'none' : '1px solid #e5e7eb', transition: 'all 0.2s'
        }),

        row: { display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' },
        input: { padding: '0.6rem', fontSize: '1rem', border: '1px solid #d1d5db', borderRadius: '6px', width: 'auto' },
        primaryBtn: { padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 'bold', border: 'none', borderRadius: '8px', backgroundColor: THEME.primary, color: '#fff', cursor: 'pointer', transition: 'background 0.2s', boxShadow: `0 4px 6px -1px ${THEME.primary}50` },
        table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem', display: 'block', overflowX: 'auto' },
        th: { textAlign: 'left', padding: '1rem', backgroundColor: '#f9fafb', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' },
        td: { padding: '1rem', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' },
        badge: (status) => ({ padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: { PENDING: '#fef3c7', PAID: THEME.primaryLight, USED: '#374151', EXPIRED: '#fee2e2', CANCELLED: '#f3f4f6' }[status] || '#f3f4f6', color: { PENDING: '#92400e', PAID: THEME.primary, USED: '#f9fafb', EXPIRED: '#991b1b', CANCELLED: '#374151' }[status] || '#374151', border: status === 'PAID' ? `1px solid ${THEME.primary}40` : 'none' }),
        actionBtn: (variant) => ({ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '0.25rem', fontWeight: '600', backgroundColor: variant === 'success' ? THEME.primary : variant === 'danger' ? THEME.danger : '#6b7280', color: '#fff' }),
        scannerBox: { maxWidth: '400px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', border: `4px solid ${THEME.primary}` },
        scanResult: (valid) => ({ padding: '1rem', marginTop: '1rem', borderRadius: '8px', backgroundColor: valid ? THEME.primaryLight : '#fee2e2', color: valid ? THEME.primary : '#991b1b', textAlign: 'center', fontWeight: '600', border: `1px solid ${valid ? THEME.primary : '#ef4444'}` }),

        // 👇 ESTADÍSTICAS CORREGIDAS: Ocupan todo el ancho uniformemente
        statsGrid: {
            display: 'grid',
            // Esto crea columnas de mínimo 200px que se estiran para llenar el espacio
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem'
        },
        statCard: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #e5e7eb' },
        statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#1a1a2e', lineHeight: 1 },
        statLabel: { fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem', fontWeight: '500' }
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Panel de Reservas</h1>
            </div>

            {/* TABS CON ICONOS */}
            <div style={styles.tabs}>
                <button style={styles.tab(activeTab === 'sales')} onClick={() => setActiveTab('sales')}>
                    <TicketIcon style={{ width: '20px' }} /> Venta Taquilla
                </button>
                <button style={styles.tab(activeTab === 'scanner')} onClick={() => setActiveTab('scanner')}>
                    <QrCodeIcon style={{ width: '20px' }} /> Escáner QR
                </button>
                <button style={styles.tab(activeTab === 'table')} onClick={() => setActiveTab('table')}>
                    <ClipboardDocumentListIcon style={{ width: '20px' }} /> Gestión
                </button>
            </div>

            {activeTab === 'sales' && (
                <AdminSales
                    date={date} setDate={setDate}
                    slots={slots} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot}
                    guests={guests} setGuests={setGuests}
                    FIXED_PRICE={FIXED_PRICE} loading={loading} handleWalkIn={handleWalkIn}
                    isTimePast={isTimePast} formatTime={formatTime} theme={THEME} styles={styles}
                />
            )}

            {activeTab === 'scanner' && (
                <AdminScanner
                    scannerActive={scannerActive} setScannerActive={setScannerActive}
                    handleScan={handleScan} lastScan={lastScan}
                    handleValidate={handleValidate}
                    handleCancel={handleCancel}
                    onReset={() => setLastScan(null)}
                    formatTime={formatTime} theme={THEME} styles={styles}
                />
            )}

            {activeTab === 'table' && (
                <AdminManagement
                    stats={stats} realVisitors={realVisitors} reservations={reservations}
                    filterDate={filterDate} setFilterDate={setFilterDate}
                    filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                    loadReservations={loadReservations} handleValidate={handleValidate} handleCancel={handleCancel}
                    formatTime={formatTime} statusLabels={STATUS_LABELS} theme={THEME} styles={styles}
                />
            )}
        </div>
    )
}