import React from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
// 👇 Importamos todos los iconos necesarios
import {
    VideoCameraIcon,
    StopCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    ClockIcon,
    UsersIcon,
    CalendarIcon,
    CheckBadgeIcon,
    TrashIcon
} from "@heroicons/react/24/outline";

export default function AdminScanner({
    scannerActive, setScannerActive, handleScan, lastScan, onReset,
    handleValidate, handleCancel, // Recibimos las acciones
    formatTime, theme, styles
}) {

    // Función intermedia para validar y luego limpiar
    const onValidateClick = (id) => {
        handleValidate(id);
        // Opcional: onReset(); // Si quieres que se limpie automático al validar
    };

    const localStyles = {
        resultCard: {
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginTop: '1.5rem',
            border: '1px solid #e5e7eb'
        },
        header: (valid) => ({
            backgroundColor: valid ? theme.primaryLight : '#fee2e2',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: valid ? theme.primary : '#991b1b',
            fontWeight: 'bold',
            fontSize: '1.1rem'
        }),
        body: {
            padding: '1.5rem'
        },
        infoRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            marginBottom: '0.8rem',
            fontSize: '1rem',
            color: theme.textDark
        },
        icon: {
            width: '20px',
            height: '20px',
            color: theme.gray
        },
        actions: {
            display: 'grid',
            gridTemplateColumns: '1fr', // Stack vertically for responsiveness
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #f3f4f6'
        }
    };

    return (
        <div style={styles.section}>
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: theme.textDark }}>Escáner de Entrada</h2>
                <p style={{ color: '#666', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                    Escanea el QR del visitante para validar su entrada
                </p>
            </div>

            {/* BOTÓN CAMARA */}
            <button
                style={{
                    ...styles.primaryBtn,
                    marginBottom: '1rem',
                    backgroundColor: scannerActive ? theme.danger : theme.primary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
                onClick={() => setScannerActive(!scannerActive)}
            >
                {scannerActive ? (
                    <><StopCircleIcon style={{ width: '24px' }} /> Detener Cámara</>
                ) : (
                    <><VideoCameraIcon style={{ width: '24px' }} /> Iniciar Cámara</>
                )}
            </button>

            {/* AREA DE CÁMARA */}
            {scannerActive && (
                <div style={styles.scannerBox}>
                    <Scanner
                        onScan={handleScan}
                        onError={(err) => console.error(err)}
                        constraints={{ facingMode: 'environment' }}
                        scanDelay={2000} // Retardo para no escanear múltiple veces
                    />
                    <p style={{ textAlign: 'center', color: '#fff', padding: '0.5rem', backgroundColor: '#000' }}>
                        Enfoca el código QR
                    </p>
                </div>
            )}

            {/* RESULTADO DEL ESCANEO */}
            {lastScan && !lastScan.scanning && (
                <div style={localStyles.resultCard}>
                    {/* ENCABEZADO: VALIDO / INVALIDO */}
                    <div style={localStyles.header(lastScan.valid)}>
                        {lastScan.valid ? (
                            <><CheckCircleIcon style={{ width: '28px' }} /> ¡RESERVA VÁLIDA!</>
                        ) : (
                            <><XCircleIcon style={{ width: '28px' }} /> {lastScan.message || 'QR INVÁLIDO'}</>
                        )}
                    </div>

                    {/* CUERPO: DATOS DEL CLIENTE */}
                    <div style={localStyles.body}>
                        {lastScan.reservation ? (
                            <>
                                <div style={localStyles.infoRow}>
                                    <UserIcon style={localStyles.icon} />
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Titular:</div>
                                        <strong style={{ textTransform: 'capitalize' }}>
                                            {lastScan.reservation.user?.name || 'Cliente'} {lastScan.reservation.user?.lastname || ''}
                                        </strong>
                                    </div>
                                </div>

                                <div style={localStyles.infoRow}>
                                    <CalendarIcon style={localStyles.icon} />
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Fecha:</div>
                                        <strong>{lastScan.reservation.date}</strong>
                                    </div>
                                </div>

                                <div style={localStyles.infoRow}>
                                    <ClockIcon style={localStyles.icon} />
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Horario:</div>
                                        <strong>{formatTime(lastScan.reservation.timeslot)}</strong>
                                    </div>
                                </div>

                                <div style={localStyles.infoRow}>
                                    <UsersIcon style={localStyles.icon} />
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Personas:</div>
                                        <strong style={{ fontSize: '1.2rem' }}>{lastScan.reservation.guests}</strong>
                                    </div>
                                </div>

                                {/* ESTADO ACTUAL */}
                                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                    <span style={styles.badge(lastScan.reservation.status)}>
                                        Estado: {lastScan.reservation.status}
                                    </span>
                                </div>

                                {/* BOTONES DE ACCIÓN (Solo si es válido o está pendiente/pagado) */}
                                {lastScan.valid && (
                                    <div style={localStyles.actions}>
                                        <button
                                            onClick={() => onValidateClick(lastScan.reservation.id)}
                                            style={{ ...styles.primaryBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.9rem' }}
                                        >
                                            <CheckBadgeIcon style={{ width: '20px' }} /> VALIDAR INGRESO
                                        </button>

                                        <button
                                            onClick={() => handleCancel(lastScan.reservation.id)}
                                            style={{ ...styles.actionBtn('danger'), padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.9rem' }}
                                        >
                                            <TrashIcon style={{ width: '20px' }} /> Cancelar
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#666' }}>
                                {lastScan.message || "No se encontraron datos de la reserva."}
                            </p>
                        )}

                        {/* Botón para limpiar y escanear otro */}
                        <button
                            onClick={onReset}
                            style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', background: '#f9fafb', color: '#666', cursor: 'pointer' }}
                        >
                            Escanear Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}