import React from 'react';
// 👇 Importamos BanknotesIcon para el botón de cobrar
import { TicketIcon, BanknotesIcon } from "@heroicons/react/24/outline";

export default function AdminSales({
    date, setDate, slots, selectedSlot, setSelectedSlot,
    guests, setGuests, FIXED_PRICE, loading, handleWalkIn,
    isTimePast, formatTime, theme, styles
}) {
    const responsiveCss = `
        /* GRID DE HORARIOS */
        .slots-grid-responsive {
            display: grid;
            gap: 0.4rem; 
            max-height: 400px;
            overflow-y: auto;
            padding-right: 4px;
            grid-template-columns: repeat(2, 1fr); 
        }

        @media (min-width: 768px) {
            .slots-grid-responsive {
                gap: 0.8rem;
                grid-template-columns: repeat(4, 1fr);
            }
        }

        /* LAYOUT GENERAL */
        .main-layout-responsive {
            display: grid;
            gap: 2rem;
            align-items: start;
            grid-template-columns: 1fr;
        }

        @media (min-width: 900px) {
            .main-layout-responsive {
                grid-template-columns: 1fr 350px;
            }
        }

        /* AJUSTE DE TEXTO */
        .slot-time-text { font-size: 0.95rem; }
        .slot-status-text { font-size: 0.65rem; }

        @media (min-width: 768px) {
            .slot-time-text { font-size: 1.1rem; }
            .slot-status-text { font-size: 0.75rem; }
        }
    `;

    const localStyles = {
        squareBtn: (slot, isSelected, isPast) => ({
            ...styles.slotBtn(slot, isSelected, isPast),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '75px',
            width: '100%',
            padding: '0.2rem',
            textAlign: 'center'
        }),
        payPanel: {
            backgroundColor: '#fff',
            padding: '1.2rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: '1rem'
        }
    };

    return (
        <div style={styles.section}>
            <style>{responsiveCss}</style>

            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: theme.textDark }}>Venta en Taquilla</h2>
                <p style={{ color: '#666', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    Registra visitantes presenciales (Pago en efectivo)
                </p>
            </div>

            <div style={styles.row}>
                <label style={{ fontWeight: 'bold' }}>Fecha de venta:</label>
                <input type="date" value={date} onChange={e => { setDate(e.target.value); setSelectedSlot(null) }} style={styles.input} />
            </div>

            <div className="main-layout-responsive" style={{ marginTop: '1.5rem' }}>

                {/* COLUMNA 1: Horarios */}
                <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: theme.textDark }}>1. Selecciona Horario:</h4>

                    {slots.length === 0 ? (
                        <p style={{ color: '#999', fontStyle: 'italic' }}>No hay horarios para esta fecha.</p>
                    ) : (
                        <div className="slots-grid-responsive custom-scroll">
                            {slots.map(slot => {
                                const past = isTimePast(slot.time);
                                return (
                                    <button
                                        key={slot.time}
                                        onClick={() => !slot.isFull && !past && setSelectedSlot(slot.time)}
                                        disabled={slot.isFull || past}
                                        style={localStyles.squareBtn(slot, selectedSlot === slot.time, past)}
                                    >
                                        <span className="slot-time-text" style={{ fontWeight: '800' }}>
                                            {formatTime(slot.time)}
                                        </span>
                                        <span className="slot-status-text" style={{ marginTop: '0.2rem', opacity: 0.8 }}>
                                            {slot.isFull ? 'Lleno' : past ? 'Cerrado' : `${slot.available} cupos`}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* COLUMNA 2: Panel de Cobro */}
                {selectedSlot ? (
                    <div style={localStyles.payPanel} className="animate-slide-down">
                        <h4 style={{ margin: '0 0 1rem 0', color: theme.textDark }}>2. Confirmar Venta:</h4>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <span style={{ color: '#666', fontSize: '0.9rem' }}>Horario:</span>
                            <strong style={{ fontSize: '1rem' }}>{formatTime(selectedSlot)}</strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <span style={{ color: '#666', fontSize: '0.9rem' }}>Personas:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button onClick={() => setGuests(Math.max(1, guests - 1))} style={{ ...styles.actionBtn('normal'), backgroundColor: '#e5e7eb', color: '#333', fontSize: '1.1rem', width: '32px', height: '32px', padding: 0 }}>−</button>
                                <span style={{ fontWeight: 'bold', minWidth: '25px', textAlign: 'center', fontSize: '1.1rem' }}>{guests}</span>
                                <button onClick={() => setGuests(Math.min(10, guests + 1))} style={{ ...styles.actionBtn('normal'), backgroundColor: '#e5e7eb', color: '#333', fontSize: '1.1rem', width: '32px', height: '32px', padding: 0 }}>+</button>
                            </div>
                        </div>

                        <div style={{ padding: '0.8rem', backgroundColor: theme.primaryLight, borderRadius: '8px', color: theme.primary, marginBottom: '1.2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', marginBottom: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total a Pagar</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '800', lineHeight: '1' }}>S/ {(guests * FIXED_PRICE).toFixed(2)}</div>
                        </div>

                        <button style={{ ...styles.primaryBtn, width: '100%', padding: '0.8rem' }} onClick={handleWalkIn} disabled={loading}>
                            {loading ? 'Procesando...' : (
                                // 👇 AQUÍ ESTÁ EL CAMBIO: Icono + Texto
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <BanknotesIcon style={{ width: '24px', height: '24px' }} />
                                    <span>Cobrar Efectivo</span>
                                </div>
                            )}
                        </button>
                    </div>
                ) : (
                    <div style={{ ...localStyles.payPanel, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', color: '#999', textAlign: 'center', flexDirection: 'column' }}>
                        <TicketIcon style={{ width: '50px', height: '50px', marginBottom: '0.8rem', opacity: 0.3 }} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Selecciona un horario</p>
                    </div>
                )}
            </div>
        </div>
    );
}