/**
 * Email Service - Servicio para enviar notificaciones por correo
 * Soporta Gmail, Outlook y SMTP personalizado
 */

import nodemailer from 'nodemailer';

const getEmailConfig = () => {
  const enabled = process.env.EMAIL_ENABLED === 'true';
  const service = process.env.EMAIL_SERVICE;
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM;
  const host = process.env.EMAIL_HOST || 'smtp.titan.email';
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const secure = process.env.EMAIL_SECURE === 'true';

  if (!enabled) {
    console.log('📧 Email notifications disabled');
    return null;
  }
  if (!user || !password || !from) {
    console.error('❌ Email credentials not configured');
    return null;
  }
  return { service, user, password, from, host, port, secure };
};

const createTransporter = (config) => {
  console.log('📧 SMTP Config:', { host: config.host, port: config.port, secure: config.secure, user: config.user });
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    tls: { rejectUnauthorized: false }
  });

  // Verificar conexión y logear resultado
  transporter.verify((err, success) => {
    if (err) console.error('❌ SMTP verify error:', err);
    else console.log('✅ SMTP transporter ready');
  });

  return transporter;
};

export const sendWelcomeEmail = async (email, name) => {
  try {
    const config = getEmailConfig();
    if (!config) return null;

    const transporter = createTransporter(config);
    const subject = 'Bienvenido a 888Cargo';
    const text = `Hola ${name || ''}, ¡bienvenido a 888Cargo! Tu registro fue exitoso.`;
    const html = `<p>Hola ${name || ''},</p><p>¡bienvenido a <strong>888Cargo</strong>! Tu registro fue exitoso.</p>`;

    const info = await transporter.sendMail({
      from: config.from,
      to: email,
      subject,
      text,
      html
    });

    // LOG extendido para diagnóstico de entrega
    console.log('📧 Welcome email sendMail info:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      envelope: info.envelope,
      response: info.response
    });

    return info;
  } catch (error) {
    console.error('❌ sendWelcomeEmail error:', error?.response || error.message || error);
    throw error;
  }
};

export const sendRegistrationConfirmation = async (email, name, username) => {
  try {
    const config = getEmailConfig();
    if (!config) return null;

    const transporter = createTransporter(config);
    const subject = 'Confirmación de registro - 888Cargo';
    const text = `Hola ${name || ''}, tu usuario ${username || email} ha sido creado correctamente.`;
    const html = `<p>Hola ${name || ''},</p><p>Tu usuario <strong>${username || email}</strong> ha sido creado correctamente.</p>`;

    const info = await transporter.sendMail({
      from: config.from,
      to: email,
      subject,
      text,
      html
    });

    console.log('📧 Registration confirmation sendMail info:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      envelope: info.envelope,
      response: info.response
    });

    return info;
  } catch (error) {
    console.error('❌ sendRegistrationConfirmation error:', error?.response || error.message || error);
    throw error;
  }
};

export default {
  sendWelcomeEmail,
  sendRegistrationConfirmation
};
