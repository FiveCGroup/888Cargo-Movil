/**
 * Email Service - Servicio para enviar notificaciones por correo
 * Soporta Gmail, Outlook y SMTP personalizado
 */

import nodemailer from 'nodemailer';

const getEmailConfig = () => {
  const enabled = process.env.EMAIL_NOTIFICATIONS === 'true';
  const provider = process.env.EMAIL_PROVIDER || 'gmail';
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM || user || 'noreply@888cargo.com';
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (!enabled) {
    console.log('📧 Email notifications disabled');
    return null;
  }
  if (!user || !password) {
    console.error('❌ Email credentials not configured');
    return null;
  }

  // Configuración según proveedor
  let host, port, secure;
  
  if (provider === 'Titan') {
    host = 'smtp.titan.email';
    port = 465;
    secure = true;
  } else if (provider === 'outlook') {
    host = 'smtp-mail.outlook.com';
    port = 587;
    secure = false;
  } else {
    // SMTP personalizado
    host = smtpHost || 'smtp.gmail.com';
    port = smtpPort;
    secure = smtpSecure;
  }

  return { host, port, secure, user, password, from };
};

const createTransporter = (config) => {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
};

/**
 * Enviar email de bienvenida
 * @param {string} email - Email del usuario
 * @param {string} name - Nombre del usuario
 */
export const sendWelcomeEmail = async (email, name) => {
  try {
    const config = getEmailConfig();
    if (!config) {
      return { success: false, message: 'Email not configured' };
    }

    const transporter = createTransporter(config);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a 888Cargo! 🎉</h1>
          </div>
          <div class="content">
            <p>Hola ${name || 'Usuario'},</p>
            <p>¡Bienvenido a <strong>888Cargo</strong>! Tu registro fue exitoso.</p>
            <p>Ya puedes acceder a nuestra plataforma para gestionar tus cargas de manera eficiente.</p>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>¡Que disfrutes de nuestros servicios!</p>
            <p>Saludos,<br>El equipo de 888Cargo</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hola ${name || 'Usuario'}, ¡bienvenido a 888Cargo! Tu registro fue exitoso. Ya puedes acceder a nuestra plataforma para gestionar tus cargas.`;

    const info = await transporter.sendMail({
      from: config.from,
      to: email,
      subject: '¡Bienvenido a 888Cargo! 🎉',
      text: text,
      html: html
    });

    console.log('✅ Welcome email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Enviar email de confirmación de registro
 * @param {string} email - Email del usuario
 * @param {string} name - Nombre del usuario
 * @param {string} username - Username del usuario
 */
export const sendRegistrationConfirmation = async (email, name, username) => {
  try {
    const config = getEmailConfig();
    if (!config) {
      return { success: false, message: 'Email not configured' };
    }

    const transporter = createTransporter(config);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Confirmación de Registro ✅</h1>
          </div>
          <div class="content">
            <p>Hola ${name || 'Usuario'},</p>
            <p>Tu cuenta ha sido creada exitosamente en <strong>888Cargo</strong>.</p>
            <div class="credentials">
              <h3>Datos de acceso:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Usuario:</strong> ${username || email}</p>
            </div>
            <p>Ya puedes iniciar sesión en nuestra plataforma.</p>
            <div class="warning">
              <p><strong>⚠️ Importante:</strong> Guarda esta información de forma segura. No compartas tus credenciales con nadie.</p>
            </div>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>Saludos,<br>El equipo de 888Cargo</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hola ${name || 'Usuario'}, tu cuenta ha sido creada exitosamente. Datos de acceso: Email: ${email}, Usuario: ${username || email}. Ya puedes iniciar sesión en nuestra plataforma.`;

    const info = await transporter.sendMail({
      from: config.from,
      to: email,
      subject: 'Confirmación de Registro - 888Cargo',
      text: text,
      html: html
    });

    console.log('✅ Registration confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending registration confirmation email:', error.message);
    return { success: false, message: error.message };
  }
};

export default {
  sendWelcomeEmail,
  sendRegistrationConfirmation
};
