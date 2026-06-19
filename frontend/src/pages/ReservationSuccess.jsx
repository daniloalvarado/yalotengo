import React from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  UserCircleIcon,
  HomeIcon,
  TicketIcon
} from "@heroicons/react/24/outline";

export default function ReservationSuccess({
  reservation, onViewPurchases, onNewReservation, theme, styles, formatTime, formatDate
}) {

  // --- LÓGICA DE PRECIO Y MONEDA ---
  const finalPrice = Number(reservation.price) > 0
    ? Number(reservation.price)
    : (reservation.guests * 2);

  // Determinar símbolo de moneda basado en res_txt_currency
  const currency = reservation.currency || 'PEN';
  const currencySymbol = currency === 'USD' ? '$' : 'S/';

  // --- CSS NATIVO DEL EFECTO 3D ---
  const animatedCardStyles = `
      .card-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0rem 0;
        perspective: 1000px;
      }

      .card {
        position: relative;
        width: 320px;
        height: 500px;
        background-color: #fff;
        border-radius: 20px;
        border: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1);
        cursor: pointer;
      }

      .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px -5px rgba(13, 148, 103, 0.3);
      }

      /* PARTE 1: EL QR */
      .qr-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        padding: 2rem;
        text-align: center;
      }

      .qr-image {
        width: 220px;
        height: 220px;
        object-fit: contain;
        border-radius: 10px;
        margin-bottom: 1.5rem;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
      }

      .qr-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: ${theme.textDark};
        margin-bottom: 0.5rem;
      }
      
      .qr-hint {
        font-size: 0.9rem;
        color: ${theme.primary};
        font-weight: 600;
        background: ${theme.primaryLight};
        padding: 0.5rem 1rem;
        border-radius: 20px;
      }

      .card:hover .qr-view {
        transform: scale(0.5);
        opacity: 0;
      }

      /* PARTE 2: EL CONTENIDO */
      .card__content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        padding: 2rem;
        box-sizing: border-box;
        background-color: #ffffff;
        transform: rotateX(-90deg);
        transform-origin: bottom;
        transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        opacity: 0;
      }

      .card:hover .card__content {
        transform: rotateX(0deg);
        opacity: 1;
      }

      .content-header {
        border-bottom: 2px dashed #e5e7eb;
        padding-bottom: 1rem;
        margin-bottom: 1rem;
      }
      
      .content-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: ${theme.textDark};
        margin: 0;
      }
      
      .content-id {
        font-size: 0.85rem;
        color: #9ca3af;
        text-transform: uppercase;
      }

      .info-list {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }

      .info-item {
        display: flex;
        align-items: center;
        font-size: 0.95rem;
        color: #4b5563;
      }

      .info-item svg {
        width: 1.25rem;
        height: 1.25rem;
        margin-right: 0.75rem;
        color: ${theme.primary};
      }

      .status-badge {
        background-color: #dcfce7;
        color: #166534;
        font-weight: 700;
        padding: 0.25rem 0.75rem;
        border-radius: 99px;
        font-size: 0.8rem;
        display: inline-block;
        margin-top: 0.5rem;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .btn-small {
        border: none;
        padding: 0.75rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: transform 0.2s;
      }
      
      .btn-primary {
        background-color: ${theme.primary};
        color: white;
      }
      
      .btn-secondary {
        background-color: #f3f4f6;
        color: ${theme.textDark};
      }
      
      .btn-small:hover {
        transform: scale(1.02);
      }
      .btn-small svg { width: 1.2rem; height: 1.2rem; }

      /* --- DARK MODE --- */
      html.dark .card {
        background-color: #1c1c1c;
        border-color: #27272a;
      }
      html.dark .card__content {
        background-color: #1c1c1c;
      }
      html.dark .qr-title, html.dark .content-title {
        color: #f3f4f6;
      }
      html.dark .qr-hint {
        background: rgba(13, 148, 103, 0.2);
        color: #10b981;
      }
      html.dark .content-header {
        border-color: #3f3f46;
      }
      html.dark .info-item {
        color: #d1d5db;
      }
      html.dark .status-badge {
        background-color: rgba(22, 101, 52, 0.3);
        color: #4ade80;
      }
      html.dark .btn-secondary {
        background-color: #27272a;
        color: #f3f4f6;
      }
    `;

  return (
    <div style={styles.container}>
      <style>{animatedCardStyles}</style>

      <h1 className="text-gray-900 dark:text-white" style={styles.title}>¡Reserva Confirmada!</h1>

      <div className="card-container">
        <div className="card">

          {/* --- CAPA 1: CÓDIGO QR --- */}
          <div className="qr-view">
            <p className="qr-title">TU ACCESO</p>

            {reservation.qrImage ? (
              <img src={reservation.qrImage} alt="QR" className="qr-image" />
            ) : (
              <div style={{ height: '220px', display: 'flex', alignItems: 'center' }}>Cargando QR...</div>
            )}

            <div className="qr-hint">
              Pasa el mouse para ver detalles
            </div>
          </div>

          {/* --- CAPA 2: DETALLES DEL TICKET --- */}
          <div className="card__content">

            <div className="content-header">
              <p className="content-title">Ticket Virtual</p>
              <p className="content-id">ID: #{reservation.id}</p>

              {/* 👇 PRECIO CON MONEDA DINÁMICA */}
              <span className="status-badge">
                PAGADO • {currencySymbol} {finalPrice.toFixed(2)} {currency === 'USD' ? 'USD' : ''}
              </span>
            </div>

            <div className="info-list">
              <div className="info-item">
                <UserCircleIcon />
                <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                  {reservation.userName || 'Usuario'}
                </span>
              </div>
              <div className="info-item">
                <CalendarDaysIcon />
                <span>{formatDate(reservation.date)}</span>
              </div>
              <div className="info-item">
                <ClockIcon />
                <span>{formatTime(reservation.timeslot)}</span>
              </div>
              <div className="info-item">
                <UserGroupIcon />
                {/* 👇 AQUI ESTÁ LA CORRECCIÓN DE PLURAL/SINGULAR */}
                <span>
                  {reservation.guests} {reservation.guests === 1 ? 'Persona' : 'Personas'}
                </span>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-small btn-primary" onClick={onViewPurchases}>
                <TicketIcon />
                Ver mis Compras
              </button>
              <button className="btn-small btn-secondary" onClick={onNewReservation}>
                <HomeIcon />
                Nueva Reserva
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}