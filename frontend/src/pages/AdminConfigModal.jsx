import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-multi-date-picker';
import AnimatedModal from '../components/AnimatedModal';

export default function AdminConfigModal({ isOpen, onClose, onSaveSuccess, theme }) {
    const [config, setConfig] = useState({
        RESERVATION_OPEN_TIME: '09:00',
        RESERVATION_CLOSE_TIME: '20:00',
        RESERVATION_SLOT_DURATION: '30',
        RESERVATION_MAX_CAPACITY: '10',
        RESERVATION_PRICE_PEN: '5',
        RESERVATION_CLOSED_DAYS: '',
        RESERVATION_CLOSED_WEEKDAYS: ''
    });
    const [loading, setLoading] = useState(false);
    const datePickerRef = useRef(null);

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

    // Funciones para fechas específicas (ahora usando DatePicker)
    const closedDatesArr = config.RESERVATION_CLOSED_DAYS ? config.RESERVATION_CLOSED_DAYS.split(',').filter(d => d) : [];

    const handleDatesChange = (dateObjects) => {
        // dateObjects es un arreglo de objetos DatePicker
        if (!dateObjects) {
            handleChange('RESERVATION_CLOSED_DAYS', '');
            return;
        }
        
        // Extraer formato YYYY-MM-DD
        const formattedDates = dateObjects.map(dateObj => {
            const date = dateObj.toDate();
            // Evitar problemas de zona horaria, construir el string local
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        });
        
        handleChange('RESERVATION_CLOSED_DAYS', formattedDates.join(','));
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

    const handleSave = async () => {
        setLoading(true);
        try {
            // Guardar uno por uno (ya que nuestro backend espera un PUT por key)
            for (const key of Object.keys(config)) {
                await api.put(`/config/${key}`, { value: config[key] });
            }
            toast.success('Configuración guardada exitosamente');
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (err) {
            toast.error('Error al guardar configuración');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatedModal
            isOpen={isOpen}
            onClose={onClose}
            title="Ajustes de Reservas"
            maxWidth="max-w-2xl"
        >
            <div className="flex flex-col gap-6">
                {/* Fila 1: Horas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">Hora de Apertura</label>
                        <input type="time" className="p-3 text-base border border-gray-300 rounded-lg outline-none focus:border-green-500 transition-colors"
                            value={config.RESERVATION_OPEN_TIME}
                            onChange={e => handleChange('RESERVATION_OPEN_TIME', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">Hora de Cierre</label>
                        <input type="time" className="p-3 text-base border border-gray-300 rounded-lg outline-none focus:border-green-500 transition-colors"
                            value={config.RESERVATION_CLOSE_TIME}
                            onChange={e => handleChange('RESERVATION_CLOSE_TIME', e.target.value)} />
                    </div>
                </div>

                {/* Fila 2: Capacidad y Tiempo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">Aforo Máximo (Personas/turno)</label>
                        <input type="number" className="p-3 text-base border border-gray-300 rounded-lg outline-none focus:border-green-500 transition-colors" min="1"
                            value={config.RESERVATION_MAX_CAPACITY}
                            onChange={e => handleChange('RESERVATION_MAX_CAPACITY', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">Duración del Turno (Minutos)</label>
                        <input type="number" className="p-3 text-base border border-gray-300 rounded-lg outline-none focus:border-green-500 transition-colors" min="5" step="5"
                            value={config.RESERVATION_SLOT_DURATION}
                            onChange={e => handleChange('RESERVATION_SLOT_DURATION', e.target.value)} />
                    </div>
                </div>

                {/* Fila 3: Precios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-gray-700">Precio por Reserva (Soles)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">S/</span>
                            <input type="number" className="p-3 pl-8 text-base border border-gray-300 rounded-lg outline-none focus:border-green-500 transition-colors w-full" min="0" step="0.50"
                                value={config.RESERVATION_PRICE_PEN}
                                onChange={e => handleChange('RESERVATION_PRICE_PEN', e.target.value)} />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Días Recurrentes Cerrados (Para siempre)</label>
                    <p className="text-sm text-gray-500 m-0 mb-2">
                        Selecciona qué días de la semana el museo NUNCA atiende.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map(day => {
                            const isChecked = closedWeekdaysArr.includes(day.num.toString());
                            return (
                                <label key={day.num} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm font-medium transition-all ${
                                    isChecked ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}>
                                    <input type="checkbox" checked={isChecked} 
                                        onChange={() => handleWeekdayToggle(day.num)} 
                                        className="cursor-pointer m-0" />
                                    {day.label}
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Fechas Específicas Cerradas (Mantenimiento / Feriados)</label>
                    <p className="text-sm text-gray-500 m-0 mb-2">
                        Haz clic para abrir el calendario y selecciona todas las fechas que quieras (puedes elegir varias de golpe).
                    </p>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 items-center">
                            <div className="flex-1">
                                <DatePicker
                                    ref={datePickerRef}
                                    multiple
                                    value={closedDatesArr.map(d => new Date(d + 'T00:00:00'))}
                                    onChange={handleDatesChange}
                                    format="DD/MM/YYYY"
                                    months={["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]}
                                    weekDays={["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]}
                                    placeholder="Haz clic aquí para seleccionar fechas"
                                    containerStyle={{ width: '100%' }}
                                    style={{
                                        width: '100%',
                                        height: '46px',
                                        padding: '0.75rem',
                                        fontSize: '1rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <button 
                                onClick={() => datePickerRef.current?.closeCalendar()} 
                                className="px-4 h-[46px] bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Listo
                            </button>
                        </div>
                        
                        {closedDatesArr.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {closedDatesArr.map(d => {
                                    const [year, month, day] = d.split('-');
                                    const displayDate = `${day}-${month}-${year}`;
                                    
                                    return (
                                        <div key={d} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-800 text-sm font-medium border border-red-300">
                                            <span>{displayDate}</span>
                                            <button onClick={() => handleRemoveDate(d)} className="text-red-600 hover:text-red-800 flex">
                                                <XMarkIcon className="w-3.5 h-3.5 stroke-[3]" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button className="px-6 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50" 
                    onClick={onClose} disabled={loading}>
                    Cancelar
                </button>
                <button className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-70" 
                    onClick={handleSave} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </AnimatedModal>
    );
}
