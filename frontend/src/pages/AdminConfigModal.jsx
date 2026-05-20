import React, { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function AdminConfigModal({ isOpen, onClose, theme }) {
    const [config, setConfig] = useState({
        RESERVATION_OPEN_TIME: '09:00',
        RESERVATION_CLOSE_TIME: '20:00',
        RESERVATION_SLOT_DURATION: '30',
        RESERVATION_MAX_CAPACITY: '10',
        RESERVATION_CLOSED_DAYS: '',
        RESERVATION_CLOSED_WEEKDAYS: ''
    });
    const [loading, setLoading] = useState(false);
    const [newDate, setNewDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadConfig();
        }
    }, [isOpen]);

    const loadConfig = async () => {
        try {
            const res = await api.get('/config');
            setConfig(prev => ({ ...prev, ...res.data }));
        } catch (err) {
            toast.error('Error al cargar configuración');
        }
    };

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    // Funciones para días de la semana recurrentes
    const handleWeekdayToggle = (dayNum) => {
        let currentDays = config.RESERVATION_CLOSED_WEEKDAYS ? config.RESERVATION_CLOSED_WEEKDAYS.split(',').filter(d => d) : [];
        if (currentDays.includes(dayNum.toString())) {
            currentDays = currentDays.filter(d => d !== dayNum.toString());
        } else {
            currentDays.push(dayNum.toString());
        }
        handleChange('RESERVATION_CLOSED_WEEKDAYS', currentDays.join(','));
    };

    // Funciones para fechas específicas
    const handleAddDate = () => {
        if (!newDate) return;
        let currentDates = config.RESERVATION_CLOSED_DAYS ? config.RESERVATION_CLOSED_DAYS.split(',').filter(d => d) : [];
        if (!currentDates.includes(newDate)) {
            currentDates.push(newDate);
            handleChange('RESERVATION_CLOSED_DAYS', currentDates.join(','));
        }
        setNewDate('');
    };

    const handleRemoveDate = (dateToRemove) => {
        let currentDates = config.RESERVATION_CLOSED_DAYS ? config.RESERVATION_CLOSED_DAYS.split(',').filter(d => d) : [];
        currentDates = currentDates.filter(d => d !== dateToRemove);
        handleChange('RESERVATION_CLOSED_DAYS', currentDates.join(','));
    };

    const WEEKDAYS = [
        { num: 1, label: 'Lunes' },
        { num: 2, label: 'Martes' },
        { num: 3, label: 'Miércoles' },
        { num: 4, label: 'Jueves' },
        { num: 5, label: 'Viernes' },
        { num: 6, label: 'Sábado' },
        { num: 0, label: 'Domingo' }
    ];

    const closedWeekdaysArr = config.RESERVATION_CLOSED_WEEKDAYS ? config.RESERVATION_CLOSED_WEEKDAYS.split(',').filter(d => d) : [];
    const closedDatesArr = config.RESERVATION_CLOSED_DAYS ? config.RESERVATION_CLOSED_DAYS.split(',').filter(d => d) : [];

    const handleSave = async () => {
        setLoading(true);
        try {
            // Guardar uno por uno (ya que nuestro backend espera un PUT por key)
            for (const key of Object.keys(config)) {
                await api.put(`/config/${key}`, { value: config[key] });
            }
            toast.success('Configuración guardada exitosamente');
            onClose();
        } catch (err) {
            toast.error('Error al guardar configuración');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1rem',
            backdropFilter: 'blur(4px)'
        },
        modal: {
            backgroundColor: '#fff', borderRadius: '16px',
            width: '100%', maxWidth: '600px', maxHeight: '90vh',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column'
        },
        header: {
            padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: theme.bgLight, borderRadius: '16px 16px 0 0'
        },
        title: { margin: 0, fontSize: '1.25rem', color: theme.textDark, fontWeight: 'bold' },
        closeBtn: {
            background: 'none', border: 'none', cursor: 'pointer',
            color: theme.gray, padding: '4px', borderRadius: '50%',
            transition: 'background 0.2s', display: 'flex'
        },
        body: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' },
        fieldGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
        label: { fontSize: '0.9rem', fontWeight: '600', color: '#374151' },
        input: {
            padding: '0.75rem', fontSize: '1rem', border: '1px solid #d1d5db',
            borderRadius: '8px', outline: 'none', transition: 'border 0.2s'
        },
        footer: {
            padding: '1.5rem', borderTop: '1px solid #e5e7eb',
            display: 'flex', justifyContent: 'flex-end', gap: '1rem',
            backgroundColor: theme.bgLight
        },
        btnCancel: {
            padding: '0.75rem 1.5rem', border: '1px solid #d1d5db', borderRadius: '8px',
            background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600'
        },
        btnSave: {
            padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px',
            background: theme.primary, color: '#fff', cursor: 'pointer', fontWeight: '600',
            opacity: loading ? 0.7 : 1
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Ajustes de Reservas</h2>
                    <button style={styles.closeBtn} onClick={onClose}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <XMarkIcon style={{ width: '24px' }} />
                    </button>
                </div>
                
                <div style={styles.body}>
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Aforo Máximo (Personas por turno)</label>
                        <input type="number" style={styles.input} min="1"
                            value={config.RESERVATION_MAX_CAPACITY}
                            onChange={e => handleChange('RESERVATION_MAX_CAPACITY', e.target.value)} />
                    </div>
                    
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Duración del Turno (Minutos)</label>
                        <input type="number" style={styles.input} min="5" step="5"
                            value={config.RESERVATION_SLOT_DURATION}
                            onChange={e => handleChange('RESERVATION_SLOT_DURATION', e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Hora de Apertura</label>
                            <input type="time" style={styles.input}
                                value={config.RESERVATION_OPEN_TIME}
                                onChange={e => handleChange('RESERVATION_OPEN_TIME', e.target.value)} />
                        </div>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Hora de Cierre</label>
                            <input type="time" style={styles.input}
                                value={config.RESERVATION_CLOSE_TIME}
                                onChange={e => handleChange('RESERVATION_CLOSE_TIME', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0.5rem 0' }}></div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Días Recurrentes Cerrados (Para siempre)</label>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#6b7280' }}>
                            Selecciona qué días de la semana el museo NUNCA atiende.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {WEEKDAYS.map(day => {
                                const isChecked = closedWeekdaysArr.includes(day.num.toString());
                                return (
                                    <label key={day.num} style={{ 
                                        display: 'flex', alignItems: 'center', gap: '4px', 
                                        padding: '0.4rem 0.8rem', borderRadius: '20px', 
                                        backgroundColor: isChecked ? '#fee2e2' : '#f3f4f6',
                                        color: isChecked ? '#991b1b' : '#374151',
                                        border: `1px solid ${isChecked ? '#fca5a5' : '#e5e7eb'}`,
                                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input type="checkbox" checked={isChecked} 
                                            onChange={() => handleWeekdayToggle(day.num)} 
                                            style={{ cursor: 'pointer', margin: 0 }} />
                                        {day.label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Fechas Específicas Cerradas (Mantenimiento / Feriados)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="date" style={{ ...styles.input, flex: 1 }} 
                                value={newDate} onChange={e => setNewDate(e.target.value)} />
                            <button onClick={handleAddDate} style={{ ...styles.btnSave, padding: '0 1rem' }}>
                                Añadir
                            </button>
                        </div>
                        {closedDatesArr.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {closedDatesArr.map(d => (
                                    <div key={d} style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '0.3rem 0.6rem', borderRadius: '6px',
                                        backgroundColor: '#fee2e2', color: '#991b1b',
                                        fontSize: '0.85rem', fontWeight: '500', border: '1px solid #fca5a5'
                                    }}>
                                        <span>{d}</span>
                                        <button onClick={() => handleRemoveDate(d)} style={{
                                            background: 'none', border: 'none', color: '#dc2626',
                                            cursor: 'pointer', padding: '0', display: 'flex'
                                        }}>
                                            <XMarkIcon style={{ width: '14px', strokeWidth: 3 }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={styles.footer}>
                    <button style={styles.btnCancel} onClick={onClose} disabled={loading}>Cancelar</button>
                    <button style={styles.btnSave} onClick={handleSave} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
