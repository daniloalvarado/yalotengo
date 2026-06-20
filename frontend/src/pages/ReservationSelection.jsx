import React from 'react';
import { PlusIcon, MinusIcon, CalendarDaysIcon, CreditCardIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-multi-date-picker";
import "react-multi-date-picker/styles/backgrounds/bg-dark.css";
import { cascade } from "../utils/animations";
import PayButton from "../components/PayButton";
import { useState, useEffect } from 'react';

// Estilos específicos para este paso, replicando el AdminSales
const selectionStyles = `
  .slots-container::-webkit-scrollbar { width: 8px; }
  .slots-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
  .slots-container::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
  
  /* GRID DE HORARIOS */
  .slots-grid-responsive {
      display: grid;
      gap: 0.5rem; 
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

export default function ReservationSelection({
    date, setDate, today, loading, slots, selectedSlot, setSelectedSlot,
    guests, setGuests, onNext, theme, styles, formatTime, closedMessage, prices = { pen: 5 }
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

    const localStyles = {
        squareBtn: (slot, isSelected, isPast) => ({
            ...styles.slotBtn(slot, isSelected, isPast, theme),
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
            padding: '1.2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: '1rem'
        }
    };

    return (
        <div style={styles.container}>
            <style>{selectionStyles}</style>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <CalendarDaysIcon style={{ width: '32px', height: '32px', color: theme.primary }} />
                <h1 className="text-gray-900 dark:text-white" style={{ ...styles.title, marginBottom: 0 }}>Reserva tu Entrada</h1>
            </div>

            <div className={`bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-gray-200 ${cascade(0).className}`} style={{ ...styles.section, ...cascade(0).style }}>
                {/* Sección Fecha */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <label style={{ fontWeight: 'bold' }}>Selecciona una fecha:</label>
                    <div style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}>
                        <DatePicker
                            value={date ? new Date(date + 'T12:00:00') : null}
                            onChange={(dateObj) => setDate(dateObj ? dateObj.format("YYYY-MM-DD") : '')}
                            minDate={new Date(today + 'T12:00:00')}
                            format="DD/MM/YYYY"
                            months={["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]}
                            weekDays={["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]}
                            placeholder="Seleccionar fecha"
                            containerStyle={{ width: '100%' }}
                            style={{ ...styles.input }}
                            className={`bg-white dark:bg-[#141414] dark:text-white dark:border-zinc-700 ${isDarkTheme ? 'bg-dark' : ''}`}
                        />
                    </div>
                </div>

                <div className={`main-layout-responsive ${cascade(1).className}`} style={{ ...cascade(1).style }}>
                    
                    {/* COLUMNA 1: Horarios */}
                    <div>
                        <h4 className="text-gray-900 dark:text-white" style={{ margin: '0 0 1rem 0' }}>1. Selecciona Horario:</h4>
                        {!date ? (
                            <p className="text-gray-400 dark:text-gray-500" style={{ textAlign: 'center', padding: '1rem' }}>Primero selecciona una fecha</p>
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
                            <div className="slots-grid-responsive custom-scroll">
                                {slots.map((slot, index) => {
                                    const past = isTimePast(slot.time);
                                    return (
                                        <button key={slot.time}
                                            className={`${cascade(2 + index, '', 0, 20).className} border border-gray-200 dark:border-zinc-800 ${slot.isFull || past ? 'bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500' : selectedSlot === slot.time ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-[#1c1c1c] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700'}`}
                                            style={{ ...localStyles.squareBtn(slot, selectedSlot === slot.time, past), ...cascade(2 + index, '', 0, 20).style }}
                                            onClick={() => !slot.isFull && !past && setSelectedSlot(slot.time)}
                                            disabled={slot.isFull || past}>
                                            <span className="slot-time-text" style={{ fontWeight: '800' }}>
                                                {formatTime(slot.time)}
                                            </span>
                                            <span className="slot-status-text" style={{ marginTop: '0.2rem', opacity: 0.8 }}>
                                                {slot.isFull ? 'Lleno' : past ? 'Cerrado' : `${slot.available} disp.`}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* COLUMNA 2: Panel de Cobro */}
                    {selectedSlot ? (
                        <div style={{ ...localStyles.payPanel, ...cascade(2).style }} className={`animate-slide-down bg-white dark:bg-[#141414] border border-gray-200 dark:border-zinc-800 ${cascade(2).className}`}>
                            <h4 className="text-gray-900 dark:text-white" style={{ margin: '0 0 1rem 0' }}>2. Confirmar Reserva:</h4>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>Horario:</span>
                                <strong className="text-gray-900 dark:text-white" style={{ fontSize: '1rem' }}>{formatTime(selectedSlot)}</strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>Personas:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button onClick={() => setGuests(Math.max(1, guests - 1))} className="bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-white" style={{ border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1rem', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}>
                                        <MinusIcon style={{ width: '16px', height: '16px' }} strokeWidth={2.5} />
                                    </button>
                                    <span className="text-gray-900 dark:text-white" style={{ fontWeight: 'bold', minWidth: '25px', textAlign: 'center', fontSize: '1.1rem' }}>{guests}</span>
                                    <button onClick={() => setGuests(Math.min(10, guests + 1))} className="bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-white" style={{ border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1.1rem', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}>
                                        <PlusIcon style={{ width: '16px', height: '16px' }} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>

                            {/* PRECIOS */}
                            <div style={{ marginTop: '1.5rem', fontSize: '1rem', color: theme.textDark }}>
                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                    <div style={priceBadgeStyle}>
                                        <CreditCardIcon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                                        <span>Total a pagar: <strong>S/ {(guests * prices.pen).toFixed(2)}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <PayButton
                                    text={loading ? 'Procesando...' : 'Continuar Pago'}
                                    onClick={onNext}
                                    disabled={loading || !selectedSlot || !date}
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ ...localStyles.payPanel, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', textAlign: 'center', flexDirection: 'column', ...cascade(2).style }} className={`bg-white dark:bg-[#141414] border border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-600 ${cascade(2).className}`}>
                            <CalendarDaysIcon style={{ width: '50px', height: '50px', marginBottom: '0.8rem', opacity: 0.3 }} />
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Selecciona un horario</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}