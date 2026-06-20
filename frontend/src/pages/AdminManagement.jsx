import React, { useState } from 'react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { cascade } from '../utils/animations';
import CustomStatusSelect from '../components/CustomStatusSelect';
import DatePicker from "react-multi-date-picker";

export default function AdminManagement({ 
    stats, realVisitors, reservations, filterDate, setFilterDate, 
    filterStatus, setFilterStatus, handleValidate, handleCancel,
    formatTime, statusLabels, theme, styles 
}) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredReservations = reservations.filter(r => {
        const term = searchTerm.toLowerCase();
        const name = (r.user?.name || '').toLowerCase();
        const lastname = (r.user?.lastname || '').toLowerCase();
        const email = (r.user?.email || '').toLowerCase();
        return name.includes(term) || lastname.includes(term) || email.includes(term);
    });

    // 👇 CSS RESPONSIVE PARA GESTIÓN
    const responsiveCss = `
        /* 1. CONTENEDOR DE FILTROS */
        .management-filters {
            display: grid;
            grid-template-columns: 1fr; /* Móvil: 1 columna, todo al 100% de ancho */
            gap: 1rem;
            margin-bottom: 1.5rem;
            align-items: center;
            position: relative;
            z-index: 50; /* Fija el problema de z-index con la tabla */
        }

        /* PC: Fecha y Estado automáticos, Buscador ocupa todo el resto */
        @media (min-width: 768px) {
            .management-filters {
                grid-template-columns: auto auto 1fr; 
            }
        }

        /* 2. INPUTS AL 100% DEL ANCHO DE SU CELDA */
        .management-input {
            width: 100%;
            height: 42px;
            padding: 0 0.75rem 0 2.5rem;
            font-size: 0.95rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            outline: none;
        }
        
        /* 3. TABLA FULL WIDTH */
        .management-table-container {
            width: 100%;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden; /* Para redondear bordes */
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 1;
        }

        .scroll-wrapper {
            max-height: 500px; /* Scroll Vertical */
            overflow-y: auto;
            overflow-x: auto; /* Scroll Horizontal si es necesario en móvil */
            width: 100%;
        }

        table.full-width-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 600px; /* Evita que la tabla se aplaste en móvil (activa scroll horizontal) */
        }
    `;

    return (
        <>
            <style>{responsiveCss}</style>

            {/* ESTADÍSTICAS */}
            {stats && (
                <div style={styles.statsGrid}>
                    <div style={{...styles.statCard, ...cascade(4).style}} className={cascade(4).className}><div style={styles.statValue}>{stats.total}</div><div style={styles.statLabel}>Total Reservas</div></div>
                    <div style={{...styles.statCard, ...cascade(5).style}} className={cascade(5).className}><div style={styles.statValue}>{realVisitors}</div><div style={styles.statLabel}>Visitantes (Entraron)</div></div>
                    <div style={{...styles.statCard, ...cascade(6).style}} className={cascade(6).className}><div style={styles.statValue}>{stats.totalGuests}</div><div style={styles.statLabel}>Aforo Esperado</div></div>
                    <div style={{...styles.statCard, ...cascade(7).style}} className={cascade(7).className}><div style={{ ...styles.statValue, color: theme.primary }}>S/ {stats.revenue?.toFixed(2) || '0.00'}</div><div style={styles.statLabel}>Ingresos</div></div>
                </div>
            )}

            <div style={{...styles.section, ...cascade(8).style}} className={cascade(8).className}>
                <h2 style={{ margin: '0 0 1.5rem 0' }}>Listado de Reservas</h2>
                
                {/* 👇 FILTROS Y BUSCADOR (GRID RESPONSIVE) */}
                <div className={`management-filters ${cascade(9).className}`} style={cascade(9).style}>
                    
                    <div style={{ minWidth: '180px', position: 'relative', zIndex: 60 }}>
                        <DatePicker
                            value={filterDate ? new Date(filterDate + 'T12:00:00') : null}
                            onChange={(dateObj) => {
                                setFilterDate(dateObj ? dateObj.format("YYYY-MM-DD") : '');
                            }}
                            format="DD/MM/YYYY"
                            months={["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]}
                            weekDays={["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]}
                            placeholder="Seleccionar fecha"
                            containerStyle={{ width: '100%' }}
                            style={{ width: '100%', height: '42px', padding: '0 0.75rem', fontSize: '0.95rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', cursor: 'pointer' }}
                            className={`bg-white dark:bg-[#141414] dark:text-white dark:border-zinc-700 bg-dark`}
                        />
                    </div>
                    
                    {/* ESTADO */}
                    <div style={{ minWidth: '180px', position: 'relative', zIndex: 50 }}>
                        <CustomStatusSelect
                            value={filterStatus}
                            onChange={(val) => setFilterStatus(val)}
                            options={[
                                { value: "", label: "Estado: Todos" },
                                { value: "PENDING", label: "Pendiente" },
                                { value: "PAID", label: "Pagado" },
                                { value: "USED", label: "Usado" },
                                { value: "EXPIRED", label: "Expirado" },
                                { value: "CANCELLED", label: "Cancelado" }
                            ]}
                        />
                    </div>

                    {/* BUSCADOR (Se estira para llenar el espacio) */}
                    <div style={{ position: 'relative', width: '100%' }}>
                        <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', color: '#9ca3af' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente o correo..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="management-input bg-white dark:bg-[#141414] text-gray-900 dark:text-white border-gray-300 dark:border-zinc-700"
                        />
                    </div>
                </div>

                {/* 👇 TABLA EN CONTENEDOR FLEXIBLE */}
                <div className={`management-table-container ${cascade(10).className}`} style={cascade(10).style}>
                    <div className="scroll-wrapper custom-scroll">
                        <table className="full-width-table">
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={styles.th}>ID</th><th style={styles.th}>Hora</th><th style={styles.th}>Pers.</th><th style={styles.th}>Estado</th><th style={styles.th}>Cliente</th><th style={styles.th}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReservations.length === 0 ? (
                                    <tr><td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#999', padding: '3rem' }}>
                                        {reservations.length === 0 ? 'No hay reservas en esta fecha' : 'No se encontraron resultados'}
                                    </td></tr>
                                ) : (
                                    filteredReservations.map((r, i) => {
                                        const isSearching = searchTerm.trim() !== '';
                                        const animProps = isSearching ? {} : cascade(11 + i);
                                        return (
                                        <tr key={r.id} style={animProps.style} className={animProps.className}>
                                            <td style={styles.td}>#{r.id}</td>
                                            <td style={styles.td}>{formatTime(r.timeslot)}</td>
                                            <td style={styles.td}>{r.guests}</td>
                                            <td style={styles.td}>
                                                <span style={styles.badge(r.status)}>{statusLabels[r.status] || r.status}</span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{fontWeight: 'bold', textTransform: 'capitalize'}}>{r.user?.name || 'Cliente'} {r.user?.lastname || ''}</div>
                                                <div style={{fontSize: '0.75rem', color: '#666'}}>{r.user?.email || '-'}</div>
                                            </td>
                                            <td style={styles.td}>
                                                {r.status === 'PAID' && <button style={styles.actionBtn('success')} onClick={() => handleValidate(r.id)}>✓ Validar</button>}
                                                {['PENDING', 'PAID'].includes(r.status) && <button style={styles.actionBtn('danger')} onClick={() => handleCancel(r.id)}>✕ Cancelar</button>}
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}