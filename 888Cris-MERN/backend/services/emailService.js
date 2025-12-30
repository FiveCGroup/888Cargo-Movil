/**
 * Email Service - Servicio para enviar notificaciones por correo
 * Soporta Gmail, Outlook y SMTP personalizado
 */

import nodemailer from 'nodemailer';

/**
 * Obtener configuración de email
 */
const getEmailConfig = () => {
    const enabled = process.env.EMAIL_ENABLED === 'true';
    const service = process.env.EMAIL_SERVICE; // 'Titan'
    const user = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;
    const from = process.env.EMAIL_FROM;
    const host = process.env.EMAIL_HOST || 'smtp.titan.email';
    const port = parseInt(process.env.EMAIL_PORT) || 587;
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

/**
 * Crear transporter para Titan (HostGator SMTP)
 */
const createTransporter = (config) => {
    console.log('📧 SMTP Config:', { host: config.host, port: config.port, secure: config.secure, user: config.user });
    return nodemailer.createTransport({  // Corregido: era createTransporter
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.password
        },
        tls: {
            rejectUnauthorized: false // Para desarrollo
        }
    });
};

/**
 * Enviar email de bienvenida
 * @param {string} email - Email del usuario
 * @param {string} name - Nombre del usuario
 * @returns {Promise}
 */
export const sendWelcomeEmail = async (email, name) => {
    try {
        const config = getEmailConfig();
        if (!config) {
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createTransporter(config);

        const welcomeMessage = `Hola ${name}, ¡bienvenido a 888Cargo! Tu registro fue exitoso. Gracias por unirte a nosotros.`;

        const mailOptions = {
            from: config.from,
            to: email,
            subject: '¡Bienvenido a 888Cargo!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #333; text-align: center;">¡Bienvenido a 888Cargo!</h1>
                        <p style="font-size: 16px; color: #555; line-height: 1.5;">
                            ${welcomeMessage}
                        </p>
                        <p style="font-size: 14px; color: #777;">
                            Si tienes alguna pregunta, contáctanos.
                        </p>
                        <br>
                        <p style="font-size: 14px; color: #333;">
                            Saludos,<br>
                            Equipo de 888Cargo
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent:', info.messageId);
        return { success: true, message: 'Welcome email sent', messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error sending welcome email:', error.message);
        return { success: false, message: error.message };
    }
};

export const sendRegistrationConfirmation = async (email, name, username) => {
    try {
        const config = getEmailConfig();
        if (!config) {
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createTransporter(config);

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333;">Confirmación de registro</h2>
                    <p style="color: #555;">Hola ${name},</p>
                    <p style="color: #555;">Tu cuenta ha sido creada correctamente. Tu usuario es <strong>${username}</strong>.</p>
                    <p style="color: #555;">Si no reconoces esta acción, por favor contacta al soporte.</p>
                    <p style="color: #333;">Saludos,<br/>Equipo 888Cargo</p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: config.from,
            to: email,
            subject: 'Confirmación de registro - 888Cargo',
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Registration confirmation email sent:', info.messageId);
        return { success: true, message: 'Registration confirmation email sent', messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error sending registration confirmation email:', error.message || error);
        return { success: false, message: error.message || 'Error sending registration confirmation' };
    }
};

export default {
    sendWelcomeEmail,
    sendRegistrationConfirmation
};
