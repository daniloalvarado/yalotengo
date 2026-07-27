import React, { useState, useEffect } from 'react';
// 👇 Importamos BanknotesIcon para el botón de cobrar
import { TicketIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import { cascade } from '../utils/animations';
import DatePicker from "react-multi-date-picker";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";

export default function AdminSales({
    date, setDate, slots, selectedSlot, setSelectedSlot,
    guests, setGuests, FIXED_PRICE, loading, handleWalkIn,
    isTimePast, formatTime, theme, styles
}) {
    const [isDarkTheme, setIsDarkTheme] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDarkTheme(document.documentElement.classList.contains('dark'));
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);
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
        squareBtn: (slot, isSelected, isPast) => {
            const base = styles.slotBtn(slot, isSelected, isPast);
            return {
                ...base,
                backgroundColor: (slot.isFull || isPast) ? (isDarkTheme ? '#27272a' : '#f3f4f6') : isSelected ? theme.primary : (isDarkTheme ? '#1c1c1c' : '#fff'),
                color: (slot.isFull || isPast) ? '#9ca3af' : isSelected ? '#fff' : (isDarkTheme ? '#f3f4f6' : '#374151'),
                border: isSelected ? 'none' : `1px solid ${isDarkTheme ? '#27272a' : '#e5e7eb'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '75px',
                width: '100%',
                padding: '0.2rem',
                textAlign: 'center'
            }
        },
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
        <div style={{ ...styles.section, ...cascade(4).style }} className={cascade(4).className}>
            <style>{responsiveCss}</style>

            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: theme.textDark, ...cascade(1).style }} className={cascade(1).className}>Venta en Taquilla</h2>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', ...cascade(2).style }} className={`text-gray-500 dark:text-gray-400 ${cascade(2).className}`}>
                    Registra visitantes presenciales (Pago en efectivo)
                </p>
            </div>

            <div style={{ ...styles.row, ...cascade(6).style, position: 'relative', zIndex: 50 }} className={cascade(6).className}>
                <label style={{ fontWeight: 'bold', color: theme.textDark }}>Fecha de venta:</label>
                <div style={{ width: '140px' }}>
                    <DatePicker
                        value={date ? new Date(date + 'T12:00:00') : null}
                        onChange={(dateObj) => {
                            setDate(dateObj ? dateObj.format("YYYY-MM-DD") : '');
                            setSelectedSlot(null);
                        }}
                        minDate={new Date()}
                        format="DD/MM/YYYY"
                        months={["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]}
                        weekDays={["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]}
                        placeholder="Seleccionar fecha"
                        containerStyle={{ width: '100%' }}
                        style={{ width: '100%', height: '42px', padding: '0 0.75rem', fontSize: '0.95rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', cursor: 'pointer' }}
                        className={`bg-white dark:bg-[#141414] dark:text-white dark:border-zinc-700 ${isDarkTheme ? 'bg-dark' : ''}`}
                    />
                </div>
            </div>

            <div className={`main-layout-responsive ${cascade(7).className}`} style={{ marginTop: '1.5rem', ...cascade(7).style }}>

                {/* COLUMNA 1: Horarios */}
                <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: theme.textDark }}>1. Selecciona Horario:</h4>

                    {slots.length === 0 ? (
                        <p style={{ color: '#999', fontStyle: 'italic' }}>No hay horarios para esta fecha.</p>
                    ) : (
                        <div className="slots-grid-responsive custom-scroll">
                            {slots.map((slot, index) => {
                                const past = isTimePast(slot.time);
                                return (
                                    <button
                                        key={slot.time}
                                        onClick={() => !slot.isFull && !past && setSelectedSlot(slot.time)}
                                        disabled={slot.isFull || past}
                                        style={{ ...localStyles.squareBtn(slot, selectedSlot === slot.time, past), ...cascade(8 + index).style }}
                                        className={cascade(8 + index).className}
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
                            <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>Horario:</span>
                            <strong style={{ fontSize: '1rem' }}>{formatTime(selectedSlot)}</strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>Personas:</span>
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