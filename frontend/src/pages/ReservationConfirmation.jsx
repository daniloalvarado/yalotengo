import React, { useState, useCallback, useEffect } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon
} from "@heroicons/react/24/outline";
import api from '../api/client';

// Inicializar Mercado Pago con la public key
const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-cfbf3797-fd23-4fee-bd19-6a813bd52dec';
initMercadoPago(MP_PUBLIC_KEY, {
  locale: 'es-PE'
});

export default function ReservationConfirmation({
  reservation, loading, setLoading, onPaymentSuccess, onCancel, theme, styles, formatTime, formatDate, prices = { pen: 5 }
}) {
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'yape'
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Estado para Yape
  const [yapePhone, setYapePhone] = useState('');
  const [yapeOtp, setYapeOtp] = useState('');
  const [yapeStep, setYapeStep] = useState(1); // 1: phone, 2: otp

  // Precios dinámicos por tipo de pago basados en la base de datos (config)
  const PRICING = {
    card: { amount: prices.pen, currency: 'PEN', symbol: 'S/', label: 'Tarjeta' },
    yape: { amount: prices.pen, currency: 'PEN', symbol: 'S/', label: 'Yape / Efectivo' }
  };

  // Calcular precio según método de pago y número de guests
  const currentPricing = PRICING[paymentMethod];
  const totalPrice = currentPricing.amount * reservation.guests;

  // Callback cuando el pago con tarjeta es enviado desde el Brick
  const onCardSubmit = useCallback(async (formData) => {
    setProcessingPayment(true);
    setPaymentError(null);

    try {
      const response = await api.post(`/reservations/${reservation.id}/mercadopago`, {
        token: formData.token,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        installments: formData.installments,
        payer: formData.payer
      });

      if (response.data.ok && response.data.status === 'approved') {
        onPaymentSuccess(response.data.reservation);
      } else if (response.data.status === 'pending' || response.data.status === 'in_process') {
        setPaymentError('Tu pago está pendiente de confirmación. Te notificaremos cuando se complete.');
      } else {
        setPaymentError(response.data.error || 'El pago no fue aprobado');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err.response?.data?.error || 'Error al procesar el pago');
    } finally {
      setProcessingPayment(false);
    }
  }, [reservation.id, onPaymentSuccess]);

  // Procesar pago con Yape
  const handleYapePayment = async () => {
    if (!yapePhone || yapePhone.length < 9) {
      setPaymentError('Ingresa un número de teléfono válido');
      return;
    }
    if (!yapeOtp || yapeOtp.length !== 6) {
      setPaymentError('Ingresa el código OTP de 6 dígitos de tu app Yape');
      return;
    }

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      // Generar token de Yape usando el SDK de MP
      const mp = new window.MercadoPago(MP_PUBLIC_KEY);

      const tokenResponse = await mp.createToken({
        paymentMethodId: 'yape',
        phone: yapePhone,
        otp: yapeOtp
      });

      if (!tokenResponse || !tokenResponse.token) {
        throw new Error('No se pudo generar el token de Yape');
      }

      // Enviar al backend
      const response = await api.post(`/reservations/${reservation.id}/mercadopago`, {
        token: tokenResponse.token,
        payment_method_id: 'yape',
        payer: {
          email: 'comprador@ejemplo.com'
        }
      });

      if (response.data.ok && response.data.status === 'approved') {
        onPaymentSuccess(response.data.reservation);
      } else {
        setPaymentError(response.data.error || 'El pago fue rechazado');
      }
    } catch (err) {
      console.error('Yape payment error:', err);
      if (err.message?.includes('otp') || err.message?.includes('OTP')) {
        setPaymentError('Código OTP incorrecto. Genera uno nuevo en tu app Yape.');
      } else if (err.message?.includes('phone')) {
        setPaymentError('Número de teléfono no válido o no registrado en Yape.');
      } else {
        setPaymentError(err.response?.data?.error || err.message || 'Error al procesar el pago con Yape');
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  // Callback para errores del Brick
  const onError = useCallback((error) => {
    console.error('Brick error:', error);
    setPaymentError('Error en el formulario de pago. Por favor intente de nuevo.');
  }, []);

  // Callback para cuando el Brick está listo
  const onReady = useCallback(() => {
    console.log('Payment Brick ready');
  }, []);

  // Reset error cuando cambia método de pago
  useEffect(() => {
    setPaymentError(null);
    setYapeStep(1);
    setYapePhone('');
    setYapeOtp('');
  }, [paymentMethod]);

  const cardCss = `
      .card-container {
        margin: 0 auto;
        width: 100%;
        max-width: 420px; /* Ancho por defecto para móviles */
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      
      /* 👇 AQUI ESTA LA MAGIA: Media Query para Desktop 👇 */
      @media (min-width: 900px) {
        .card-container {
          max-width: 1000px; /* Permitir más ancho en PC */
          display: grid;
          grid-template-columns: 1fr 1.5fr; /* Columna Izq (Resumen) más angosta, Der (Pago) más ancha */
          gap: 2rem;
          align-items: start; /* Alinear al tope */
        }

        /* Ajustar la tarjeta de resumen para que no tenga margen abajo en desktop */
        .summary-card {
          margin-bottom: 0 !important;
          height: fit-content; /* Que se ajuste a su contenido */
          position: sticky;
          top: 20px; /* Opcional: para que baje contigo si haces scroll */
        }

        /* Hacer que el botón cancelar ocupe todo el ancho abajo */
        .cancel-btn {
            grid-column: 1 / -1;
            max-width: 300px;
            margin: 1rem auto 0 auto;
        }
      }
      
      .summary-card {
        display: flex;
        flex-direction: column;
        width: 100%;
        border-radius: 1rem;
        background-color: #fff;
        padding: 1.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        /* margin-bottom quitado de aquí para manejarlo con gap del flex/grid */
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #f0f0f0;
      }

      .title-section {
        display: flex;
        flex-direction: column;
      }

      .title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
      }

      .price {
        font-size: 2.5rem;
        line-height: 1;
        font-weight: 700;
        color: ${theme.textDark};
        margin-top: 0.25rem;
        transition: all 0.3s ease;
      }
      
      .currency {
        font-size: 1.25rem;
        vertical-align: super;
        margin-right: 2px;
        color: ${theme.primary};
      }

      .price-badge {
        background: ${theme.primaryLight};
        color: ${theme.primary};
        padding: 0.25rem 0.75rem;
        border-radius: 2rem;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .details-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0;
      }

      .detail-item {
        display: flex;
        align-items: center;
        color: #374151;
        font-size: 0.9rem;
      }

      .detail-item svg {
        height: 1.25rem;
        width: 1.25rem;
        flex-shrink: 0;
        margin-right: 0.5rem;
        color: ${theme.primary};
      }

      .payment-section {
        background: #fff;
        border-radius: 1rem;
        border: 1px solid #e5e7eb;
        padding: 1.5rem;
        /* margin-bottom quitado para manejarlo con gap */
      }

      .payment-title {
        font-size: 1rem;
        font-weight: 600;
        color: ${theme.textDark};
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .payment-title svg {
        width: 1.25rem;
        height: 1.25rem;
        color: ${theme.primary};
      }

      /* Tabs de método de pago */
      .payment-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .payment-tab {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.75rem;
        background: #fff;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .payment-tab:hover {
        border-color: ${theme.primary};
      }

      .payment-tab.active {
        border-color: ${theme.primary};
        background: ${theme.primaryLight};
      }

      .payment-tab svg {
        width: 1.5rem;
        height: 1.5rem;
        color: #6b7280;
      }

      .payment-tab.active svg {
        color: ${theme.primary};
      }

      .payment-tab span {
        font-size: 0.8rem;
        font-weight: 600;
        color: #374151;
      }

      .payment-tab .price-label {
        font-size: 0.7rem;
        color: #6b7280;
        font-weight: 500;
      }

      /* Yape form */
      .yape-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .yape-logo {
        text-align: center;
        margin-bottom: 0.5rem;
      }

      .yape-logo img {
        height: 40px;
      }

      .yape-logo-text {
        font-size: 1.5rem;
        font-weight: bold;
        color: #00D1AE;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-size: 0.875rem;
        font-weight: 600;
        color: ${theme.textDark};
      }

      .form-group input {
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: border-color 0.2s;
      }

      .form-group input:focus {
        outline: none;
        border-color: ${theme.primary};
      }

      .form-group .hint {
        font-size: 0.75rem;
        color: #6b7280;
      }

      .yape-btn {
        background: #00D1AE;
        color: white;
        border: none;
        padding: 1rem;
        border-radius: 0.75rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .yape-btn:hover {
        background: #00b89d;
      }

      .yape-btn:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .yape-instructions {
        background: #f0fdfa;
        border: 1px solid #99f6e4;
        border-radius: 0.5rem;
        padding: 1rem;
        font-size: 0.875rem;
        color: #0f766e;
      }

      .yape-instructions ol {
        margin: 0.5rem 0 0 1.25rem;
        padding: 0;
      }

      .yape-instructions li {
        margin-bottom: 0.25rem;
      }

      .error-message {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }

      .cancel-btn {
        background: transparent;
        border: none;
        color: ${theme.danger};
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9rem;
        width: 100%;
        padding: 0.75rem;
        transition: opacity 0.2s;
        /* margin-top movido al media query/container para mejor control */
      }
      
      .cancel-btn:hover {
        opacity: 0.7;
      }

      .cancel-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .processing-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .processing-card {
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top-color: ${theme.primary};
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;

  return (
    <div style={styles.container}>
      <style>{cardCss}</style>

      <h1 style={styles.title}>Confirma tu Reserva</h1>

      <div className="card-container">
        {/* Resumen de la reserva */}
        <div className="summary-card">
          <div className="header">
            <div className="title-section">
              <span className="title">Total a Pagar</span>
              <span className="price">
                <span className="currency">{currentPricing.symbol}</span>
                {totalPrice.toFixed(2)}
              </span>
            </div>
            <span className="price-badge">{currentPricing.currency}</span>
          </div>

          <ul className="details-list">
            <li className="detail-item">
              <CalendarDaysIcon />
              <span>{formatDate(reservation.date)}</span>
            </li>
            <li className="detail-item">
              <ClockIcon />
              <span>{formatTime(reservation.timeslot)}</span>
            </li>
            <li className="detail-item">
              <UserGroupIcon />
              <span>
                {reservation.guests} {reservation.guests === 1 ? 'Persona' : 'Personas'}
              </span>
            </li>
          </ul>
        </div>

        {/* Sección de pago */}
        <div className="payment-section">
          <div className="payment-title">
            <CreditCardIcon />
            Método de Pago
          </div>

          {/* Tabs para elegir método */}
          <div className="payment-tabs">
            <button
              type="button"
              className={`payment-tab ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCardIcon />
              <span>Tarjeta</span>
              <span className="price-label">S/ {prices.pen.toFixed(2)} PEN</span>
            </button>
            <button
              type="button"
              className={`payment-tab ${paymentMethod === 'yape' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('yape')}
            >
              <DevicePhoneMobileIcon />
              <span>Yape</span>
              <span className="price-label">S/ {prices.pen.toFixed(2)} PEN</span>
            </button>
          </div>

          {paymentError && (
            <div className="error-message">
              {paymentError}
            </div>
          )}

          {/* Formulario de tarjeta */}
          {paymentMethod === 'card' && (
            <CardPayment
              initialization={{
                amount: totalPrice
              }}
              customization={{
                visual: {
                  style: {
                    theme: 'default',
                    customVariables: {
                      formBackgroundColor: '#ffffff',
                      baseColor: theme.primary
                    }
                  }
                },
                paymentMethods: {
                  maxInstallments: 1
                }
              }}
              onSubmit={onCardSubmit}
              onReady={onReady}
              onError={onError}
            />
          )}

          {/* Formulario de Yape */}
          {paymentMethod === 'yape' && (
            <div className="yape-form">
              <div className="yape-logo">
                <span className="yape-logo-text">Yape</span>
              </div>

              <div className="yape-instructions">
                <strong>¿Cómo pagar con Yape?</strong>
                <ol>
                  <li>Ingresa tu número de teléfono registrado en Yape</li>
                  <li>Abre tu app Yape</li>
                  <li>Ve a "Compras online" y obtén tu código de 6 dígitos</li>
                  <li>Ingresa el código aquí y confirma el pago</li>
                </ol>
              </div>

              <div className="form-group">
                <label htmlFor="yape-phone">Número de teléfono</label>
                <input
                  type="tel"
                  id="yape-phone"
                  placeholder="9XX XXX XXX"
                  value={yapePhone}
                  onChange={(e) => setYapePhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  maxLength={9}
                />
                <span className="hint">Tu número registrado en Yape</span>
              </div>

              <div className="form-group">
                <label htmlFor="yape-otp">Código de aprobación (OTP)</label>
                <input
                  type="text"
                  id="yape-otp"
                  placeholder="XXXXXX"
                  value={yapeOtp}
                  onChange={(e) => setYapeOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <span className="hint">Código de 6 dígitos de tu app Yape</span>
              </div>

              <button
                type="button"
                className="yape-btn"
                onClick={handleYapePayment}
                disabled={processingPayment || !yapePhone || yapePhone.length < 9 || !yapeOtp || yapeOtp.length !== 6}
              >
                <DevicePhoneMobileIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Pagar S/ {totalPrice.toFixed(2)} con Yape
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="cancel-btn"
          onClick={onCancel}
          disabled={processingPayment || loading}
        >
          Cancelar Reserva
        </button>
      </div>

      {/* Overlay de procesamiento */}
      {processingPayment && (
        <div className="processing-overlay">
          <div className="processing-card">
            <div className="spinner"></div>
            <p style={{ color: theme.textDark, fontWeight: 600 }}>
              Procesando tu pago...
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Por favor no cierres esta ventana
            </p>
          </div>
        </div>
      )}
    </div>
  );
}