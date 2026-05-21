import React from 'react';
import { PlusIcon, MinusIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

// Estilos específicos para este paso
const selectionStyles = `
  .slots-container::-webkit-scrollbar { width: 8px; }
  .slots-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
  .slots-container::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
  
  @media (min-width: 768px) {
    .reservation-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; align-items: start; }
    .date-section { grid-column: 1 / -1; }
  }
  .mobile-margin { margin-bottom: 1rem; }
  @media (min-width: 768px) { .mobile-margin { margin-bottom: 0; } }
`;

export default function ReservationSelection({
    date, setDate, today, loading, slots, selectedSlot, setSelectedSlot,
    guests, setGuests, onNext, theme, styles, formatTime, closedMessage
}) {

    // Lógica visual local
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

    // Estilo tipo Badge similar al de Home
    const priceBadgeStyle = {
        background: 'rgba(16, 185, 129, 0.1)', // bg-emerald-500/10
        border: '1px solid rgba(16, 185, 129, 0.4)', // border-emerald-500/40
        color: '#1f2937', // text-gray-800 (negro/oscuro)
        padding: '0.6rem 1.2rem',
        borderRadius: '50px',
        fontSize: '0.95rem',
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: '0.6rem',
        gap: '10px',
        fontWeight: '600'
    };

    return (
        <div style={styles.container}>
            <style>{selectionStyles}</style>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <CalendarDaysIcon style={{ width: '32px', height: '32px', color: theme.primary }} />
                <h1 style={{ ...styles.title, marginBottom: 0 }}>Reserva tu Entrada</h1>
            </div>

            <div className="reservation-grid">
                {/* Sección Fecha */}
                <div style={styles.section} className="date-section mobile-margin">
                    <label style={styles.label}>Selecciona una fecha</label>
                    <input
                        type={date ? "date" : "text"}
                        placeholder="Seleccionar fecha"
                        min={today}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        style={styles.input}
                        onFocus={(e) => {
                            e.target.type = "date";
                            e.target.showPicker && e.target.showPicker();
                        }}
                        onBlur={(e) => {
                            if (!e.target.value) e.target.type = "text";
                        }}
                    />
                </div>

                {/* Sección Horarios - SIEMPRE VISIBLE */}
                <div style={styles.section} className="mobile-margin">
                    <label style={styles.label}>Selecciona un horario</label>
                    {!date ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Primero selecciona una fecha</p>
                    ) : loading ? (
                        <p>Cargando horarios...</p>
                    ) : closedMessage ? (
                        <div style={{
                            backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5',
                            padding: '1.5rem', borderRadius: '10px', textAlign: 'center', margin: '1rem 0'
                        }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Museo Cerrado</h3>
                            <p style={{ margin: 0 }}>{closedMessage}</p>
                        </div>
                    ) : slots.length === 0 ? (
                        <p>No hay horarios disponibles</p>
                    ) : (
                        <div className="slots-container" style={styles.slotsGrid}>
                            {slots.map(slot => {
                                const past = isTimePast(slot.time);
                                return (
                                    <button key={slot.time}
                                        onClick={() => !slot.isFull && !past && setSelectedSlot(slot.time)}
                                        disabled={slot.isFull || past}
                                        style={styles.slotBtn(slot, selectedSlot === slot.time, past, theme)}>
                                        {formatTime(slot.time)}
                                        <div style={styles.available}>{slot.isFull ? 'Lleno' : past ? 'Cerrado' : `${slot.available} disp.`}</div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Sección Personas y Botón - SIEMPRE VISIBLE */}
                <div style={styles.sidebarSection}>
                    <label style={{ ...styles.label, textAlign: 'center' }}>Número de personas</label>
                    <div style={styles.guestSelector}>
                        <button style={styles.guestBtn} onClick={() => setGuests(Math.max(1, guests - 1))}>
                            <MinusIcon style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
                        </button>
                        <span style={styles.guestCount}>{guests}</span>
                        <button style={styles.guestBtn} onClick={() => setGuests(Math.min(10, guests + 1))}>
                            <PlusIcon style={{ width: '18px', height: '18px' }} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* PRECIOS */}
                    <div style={{ marginTop: '1.5rem', fontSize: '1rem', color: theme.textDark }}>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <div style={priceBadgeStyle}>
                                <span>💳</span>
                                <span>Tarjeta: <strong>$ {(guests * 2).toFixed(2)}</strong></span>
                            </div>
                            <div style={priceBadgeStyle}>
                                <span>📱</span>
                                <span>Yape: <strong>S/ {(guests * 5).toFixed(2)}</strong></span>
                            </div>
                        </div>
                    </div>

                    <button
                        style={{ ...styles.primaryBtn, ...(loading || !selectedSlot || !date ? styles.disabledBtn : {}) }}
                        onClick={onNext}
                        disabled={loading || !selectedSlot || !date}>
                        {loading ? 'Procesando...' : 'Continuar Pago'}
                    </button>
                </div>
            </div>
        </div>
    );
}