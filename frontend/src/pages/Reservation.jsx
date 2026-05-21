import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

// Importamos los componentes hijos (Las Vistas)
import ReservationSelection from './ReservationSelection'
import ReservationConfirmation from './ReservationConfirmation'
import ReservationSuccess from './ReservationSuccess'

// --- TEMA Y ESTILOS GLOBALES ---
const THEME = {
    primary: '#0d9467',
    primaryDark: '#0a7551',
    primaryLight: '#e6f7f2',
    textDark: '#1a1a2e',
    danger: '#ef4444',
    gray: '#9ca3af',
    bgLight: '#f8f9fa'
};

export default function Reservation() {
    const navigate = useNavigate()
    const location = useLocation()

    // Estados
    const [date, setDate] = useState('')
    const [slots, setSlots] = useState([])
    const [selectedSlot, setSelectedSlot] = useState(null)
    const [guests, setGuests] = useState(1)
    const [loading, setLoading] = useState(false)
    const [reservation, setReservation] = useState(null)
    const [step, setStep] = useState('select')
    const [closedMessage, setClosedMessage] = useState('')

    // --- 1. LÓGICA DEL NEGOCIO ---

    useEffect(() => {
        if (location.state?.pendingReservation) {
            const incoming = location.state.pendingReservation;
            setReservation(incoming);
            setDate(incoming.date);
            setGuests(incoming.guests);
            setSelectedSlot(incoming.timeslot);
            setStep('confirm');
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const getLocalDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const today = getLocalDate();

    const formatTime = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    };

    const formatDate = (isoDate) => {
        if (!isoDate) return '';
        const [year, month, day] = isoDate.split('-');
        return `${day}/${month}/${year}`;
    };

    // Cargar slots
    useEffect(() => {
        if (!date) return
        setLoading(true)
        setSelectedSlot(null)
        setClosedMessage('')
        
        api.get(`/reservations/slots?date=${date}`)
            .then(res => {
                if (res.data.closed) {
                    setClosedMessage(res.data.message);
                    setSlots([]);
                    showErrorToast(res.data.message);
                } else {
                    setSlots(res.data.slots || []);
                }
            })
            .catch(err => {
                const msg = err.response?.data?.error || 'No hay horarios disponibles';
                showErrorToast(msg);
                console.error(err)
            })
            .finally(() => setLoading(false))
    }, [date])

    // --- 2. NOTIFICACIONES PERSONALIZADAS (TOASTS) ---

    // TOAST VERDE (ÉXITO)
    const showGreenToast = (title) => {
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
                const bar = toast.querySelector('.swal2-timer-progress-bar');
                if (bar) bar.style.backgroundColor = THEME.primary;
            }
        })
        Toast.fire({ icon: 'success', title: title, iconColor: THEME.primary })
    }

    // 👇 TOAST ROJO (ERROR / SIN CUPO) 👇
    const showErrorToast = (title) => {
        const Toast = Swal.mixin({
            toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
                // Pintamos la barra de ROJO
                const bar = toast.querySelector('.swal2-timer-progress-bar');
                if (bar) bar.style.backgroundColor = THEME.danger;
            }
        })
        // Icono de error y color rojo
        Toast.fire({ icon: 'error', title: title, iconColor: THEME.danger })
    }

    // --- 3. HANDLERS ---

    const handleCreateReservation = async () => {
        if (!selectedSlot) {
            showErrorToast('Selecciona un horario'); // Toast en lugar de simple error
            return
        }
        setLoading(true)
        try {
            const res = await api.post('/reservations/create', { date, timeslot: selectedSlot, guests, price: guests * 2 })
            setReservation(res.data.reservation)
            setStep('confirm')
            window.dispatchEvent(new Event("cart:update"));

            showGreenToast('Reserva creada');

        } catch (err) {
            // 👇 AQUÍ CAPTURAMOS SI NO HAY CUPO
            const errorMsg = err.response?.data?.error || 'Error al crear reserva';
            showErrorToast(errorMsg); // Muestra "No hay cupos suficientes" con barra roja

            // Opcional: Recargar los slots para que el usuario vea que ya se llenó
            if (date) {
                api.get(`/reservations/slots?date=${date}`)
                    .then(res => setSlots(res.data.slots || []));
            }
        } finally {
            setLoading(false)
        }
    }

    // Handler cuando Mercado Pago procesa el pago exitosamente
    const handlePaymentSuccess = (paidReservation) => {
        setReservation(paidReservation)
        setStep('qr')
        window.dispatchEvent(new Event("cart:update"));

        Swal.fire({
            title: '¡Pago Exitoso!', text: 'Tu entrada ha sido generada.',
            imageUrl: '/favicon.png', imageWidth: 100, imageHeight: 100, confirmButtonColor: THEME.primary
        });
    }

    const handleCancel = async () => {
        const result = await Swal.fire({
            title: '¿Cancelar reserva?', text: "Se liberará el horario.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: THEME.danger, cancelButtonColor: THEME.gray,
            confirmButtonText: 'Sí, cancelar', cancelButtonText: 'Volver'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                if (reservation && reservation.id) {
                    await api.delete(`/reservations/${reservation.id}`);
                }
                window.dispatchEvent(new Event("cart:update"));
                setStep('select');
                setReservation(null);
                setGuests(1);

                showGreenToast('Reserva cancelada');

            } catch (err) {
                console.error(err);
                showErrorToast("Error al cancelar");
            } finally {
                setLoading(false);
            }
        }
    }

    const handleNewReservation = () => {
        setStep('select'); setDate(''); setSlots([]); setSelectedSlot(null); setGuests(1); setReservation(null);
    }

    // --- ESTILOS COMPARTIDOS ---
    const styles = {
        container: { maxWidth: '900px', margin: '0rem auto', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' },
        title: { fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: THEME.textDark, textAlign: 'center' },
        section: { padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
        sidebarSection: { padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: 'fit-content' },
        label: { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' },
        input: { width: '100%', padding: '0.75rem', fontSize: '1rem', border: '2px solid #e0e0e0', borderRadius: '8px', outline: 'none', cursor: 'pointer' },
        slotsGrid: {
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem', marginTop: '1rem',
            maxHeight: '280px', overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '0.5rem',
            border: '1px solid #f0f0f0', borderRadius: '8px', padding: '1rem', backgroundColor: '#fafafa'
        },
        slotBtn: (slot, isSelected, isPast, theme) => {
            const isDisabled = slot.isFull || isPast;
            return {
                padding: '0.75rem', fontSize: '1rem', fontWeight: '600', borderRadius: '8px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                backgroundColor: isDisabled ? '#e0e0e0' : isSelected ? theme.primary : '#fff',
                color: isDisabled ? '#999' : isSelected ? '#fff' : '#333',
                boxShadow: isSelected ? `0 4px 6px ${theme.primary}40` : '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s', opacity: isPast ? 0.6 : 1, border: isSelected ? 'none' : '1px solid #e5e7eb'
            }
        },
        available: { fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.9 },
        guestSelector: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' },
        guestBtn: { width: '40px', height: '40px', border: 'none', borderRadius: '50%', backgroundColor: THEME.primary, color: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 },
        guestCount: { fontSize: '1.5rem', fontWeight: 'bold', minWidth: '40px', textAlign: 'center', color: THEME.textDark },
        primaryBtn: { width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', borderRadius: '10px', backgroundColor: THEME.primary, color: '#fff', cursor: 'pointer', marginTop: '1rem', transition: 'background 0.2s' },
        secondaryBtn: { width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', borderRadius: '10px', backgroundColor: '#6366f1', color: '#fff', cursor: 'pointer', marginTop: '0.5rem' },
        disabledBtn: { opacity: 0.6, cursor: 'not-allowed' }
    }

    // --- RENDERIZADO CONDICIONAL ---
    if (step === 'select') {
        return <ReservationSelection
            date={date} setDate={setDate} today={today}
            slots={slots} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} loading={loading}
            guests={guests} setGuests={setGuests} onNext={handleCreateReservation}
            theme={THEME} styles={styles} formatTime={formatTime} closedMessage={closedMessage}
        />
    }

    if (step === 'confirm' && reservation) {
        return <ReservationConfirmation
            reservation={reservation} loading={loading} setLoading={setLoading}
            onPaymentSuccess={handlePaymentSuccess} onCancel={handleCancel}
            theme={THEME} styles={styles} formatTime={formatTime} formatDate={formatDate}
        />
    }

    if (step === 'qr' && reservation) {
        return <ReservationSuccess
            reservation={reservation}
            onViewPurchases={() => navigate('/purchases')}
            onNewReservation={handleNewReservation}
            theme={THEME} styles={styles} formatTime={formatTime} formatDate={formatDate}
        />
    }

    return null
}