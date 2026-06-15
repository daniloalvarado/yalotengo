import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'daniloalvarado2002@gmail.com';
const SENDER_EMAIL = 'onboarding@resend.dev'; // Resend testing email

/**
 * Genera el marco HTML base para los correos
 */
const baseTemplate = (title, content, color) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${title} | Yalotengo</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background-color: \${color}; color: #ffffff; padding: 20px 30px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .header img { width: 50px; height: 50px; margin-bottom: 10px; border-radius: 50%; background: white; padding: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.5px; }
        .content { padding: 30px; }
        .content p { font-size: 16px; line-height: 1.5; color: #555; }
        .details-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 5px; }
        .detail-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
        .detail-label { font-weight: 600; color: #6b7280; font-size: 14px; }
        .detail-value { font-weight: bold; color: #111827; font-size: 15px; text-align: right; }
        .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        .highlight { color: \${color}; font-size: 20px; font-weight: 800; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yalotengo-frontend.onrender.com/favicon.png" alt="Yalotengo Logo" />
            <h1>\${title}</h1>
        </div>
        <div class="content">
            \${content}
        </div>
        <div class="footer">
            Este es un mensaje automático generado por el sistema <strong>Yalotengo</strong>.<br>
            Por favor, no respondas a este correo.
        </div>
    </div>
</body>
</html>
`;

/**
 * Enviar notificación de Reserva
 */
export const notifyAdminReservation = async (reservationData) => {
    try {
        const { id, customerName, date, timeslot, guests, total, type = 'Online' } = reservationData;
        
        const content = `
            <p>Hola Administrador,</p>
            <p>Se ha registrado una nueva <strong>Reserva en Yalotengo</strong>.</p>
            
            <div class="details-box">
                <div class="detail-row"><span class="detail-label">ID Reserva:</span> <span class="detail-value">#${id}</span></div>
                <div class="detail-row"><span class="detail-label">Cliente:</span> <span class="detail-value">${customerName || 'Invitado'}</span></div>
                <div class="detail-row"><span class="detail-label">Fecha:</span> <span class="detail-value">${date}</span></div>
                <div class="detail-row"><span class="detail-label">Horario:</span> <span class="detail-value">${timeslot}</span></div>
                <div class="detail-row"><span class="detail-label">Personas:</span> <span class="detail-value">${guests}</span></div>
                <div class="detail-row"><span class="detail-label">Tipo:</span> <span class="detail-value">${type}</span></div>
                <div class="detail-row" style="margin-top: 15px; border-top: 2px solid #e5e7eb; padding-top: 10px;">
                    <span class="detail-label">Total Cobrado:</span> 
                    <span class="detail-value highlight">S/ ${Number(total).toFixed(2)}</span>
                </div>
            </div>
            <p>Ingresa al panel de administración para ver más detalles.</p>
        `;

        const html = baseTemplate('Nueva Reserva Confirmada', content, '#0d9467'); // Verde

        await resend.emails.send({
            from: `Yalotengo <${SENDER_EMAIL}>`,
            to: ADMIN_EMAIL,
            subject: `[Yalotengo] Nueva Reserva: ${date} a las ${timeslot}`,
            html: html
        });
        console.log('[EmailService] Notificación de Reserva enviada con éxito a', ADMIN_EMAIL);
    } catch (error) {
        console.error('[EmailService] Error al enviar correo de reserva:', error);
    }
};

/**
 * Enviar notificación de Compra General (Catálogo, Libros, Cursos)
 */
export const notifyAdminPurchase = async (purchaseData) => {
    try {
        const { category, customerName, items, total, transactionId } = purchaseData;
        
        // Colores según categoría
        const colors = {
            'Catálogo (Modelos 3D)': '#3b82f6', // Azul
            'Libros': '#8b5cf6', // Morado
            'Cursos': '#f59e0b', // Naranja
            'Cotizaciones': '#ec4899', // Rosa
        };
        const color = colors[category] || '#4b5563';

        let itemsHtml = items.map(item => 
            `<div style="padding: 5px 0; border-bottom: 1px solid #eee;">
                <strong>${item.quantity || 1}x</strong> ${item.name} 
                <span style="float:right; color:#666;">S/ ${Number(item.price || 0).toFixed(2)}</span>
            </div>`
        ).join('');

        const content = `
            <p>Hola Administrador,</p>
            <p>Se ha procesado una nueva venta exitosa en la sección de <strong>${category}</strong>.</p>
            
            <div class="details-box">
                <div class="detail-row"><span class="detail-label">ID Transacción:</span> <span class="detail-value">${transactionId || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Cliente:</span> <span class="detail-value">${customerName || 'Usuario Registrado'}</span></div>
                
                <div style="margin-top: 15px;">
                    <span class="detail-label">Artículos Comprados:</span>
                    <div style="margin-top: 8px; font-size: 14px;">
                        ${itemsHtml}
                    </div>
                </div>

                <div class="detail-row" style="margin-top: 15px; border-top: 2px solid #e5e7eb; padding-top: 10px;">
                    <span class="detail-label">Total Ingreso:</span> 
                    <span class="detail-value highlight" style="color: ${color};">S/ ${Number(total).toFixed(2)}</span>
                </div>
            </div>
            <p>Revisa el módulo de Ventas/Pedidos para gestionar esta entrega.</p>
        `;

        const html = baseTemplate(`💰 Nueva Venta de ${category}`, content, color);

        await resend.emails.send({
            from: `Yalotengo <${SENDER_EMAIL}>`,
            to: ADMIN_EMAIL,
            subject: `Venta exitosa: ${category} por S/ ${Number(total).toFixed(2)}`,
            html: html
        });
        console.log(`[EmailService] Notificación de Venta (${category}) enviada con éxito.`);
    } catch (error) {
        console.error('[EmailService] Error al enviar correo de venta:', error);
    }
};

/**
 * Enviar notificación de Cotización Personalizada
 */
export const notifyAdminCotizacion = async (quoteData) => {
    try {
        const { id, customerName, contactEmail, description, status } = quoteData;
        
        const content = `
            <p>Hola Administrador,</p>
            <p>Se ha registrado una actualización en <strong>Cotizaciones 3D Personalizadas</strong>.</p>
            
            <div class="details-box">
                <div class="detail-row"><span class="detail-label">ID Cotización:</span> <span class="detail-value">#${id}</span></div>
                <div class="detail-row"><span class="detail-label">Cliente:</span> <span class="detail-value">${customerName || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Contacto:</span> <span class="detail-value">${contactEmail || 'N/A'}</span></div>
                <div class="detail-row"><span class="detail-label">Estado:</span> <span class="detail-value" style="color: #ec4899;">${status}</span></div>
                
                <div style="margin-top: 15px;">
                    <span class="detail-label">Descripción:</span>
                    <div style="margin-top: 8px; font-size: 14px; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        ${description || 'Sin descripción'}
                    </div>
                </div>
            </div>
            <p>Revisa el módulo de Cotizaciones para responder al cliente o verificar su pago.</p>
        `;

        const html = baseTemplate('🛠️ Novedad en Cotización 3D', content, '#ec4899'); // Rosa

        await resend.emails.send({
            from: `Yalotengo <${SENDER_EMAIL}>`,
            to: ADMIN_EMAIL,
            subject: `Actualización en Cotización #${id}`,
            html: html
        });
        console.log('[EmailService] Notificación de Cotización enviada con éxito.');
    } catch (error) {
        console.error('[EmailService] Error al enviar correo de cotización:', error);
    }
};
