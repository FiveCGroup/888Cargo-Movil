/**
 * Email Service - Servicio para enviar notificaciones por correo
 * Soporta Gmail, Outlook y SMTP personalizado
 */

import nodemailer from 'nodemailer';

/**
 * Crear transportador de email basado en la configuración
 */
const createTransporter = () => {
    const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
    
    if (emailProvider === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    } else if (emailProvider === 'outlook') {
        return nodemailer.createTransport({
            service: 'outlook',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    } else {
        // SMTP personalizado
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }
};

/**
 * Enviar email de bienvenida al registrarse
 * @param {string} email - Email del usuario
 * @param {string} name - Nombre del usuario
 * @returns {Promise}
 */
export const sendWelcomeEmail = async (email, name) => {
    try {
        console.log('🔍 EMAIL_NOTIFICATIONS value:', JSON.stringify(process.env.EMAIL_NOTIFICATIONS));
        console.log('🔍 EMAIL_NOTIFICATIONS === "true":', process.env.EMAIL_NOTIFICATIONS === 'true');

        if (process.env.EMAIL_NOTIFICATIONS !== 'true') {
            console.log('📧 Email notifications disabled');
            return { success: true, message: 'Email notifications disabled' };
        }

        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: '¡Bienvenido a 888Cargo! 🎉',
            html: `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 8px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .header h1 { margin: 0; font-size: 28px; }
                        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
                        .welcome-text { font-size: 16px; margin-bottom: 20px; }
                        .features { margin: 20px 0; }
                        .feature { margin: 10px 0; padding: 10px; background: #f0f0f0; border-left: 4px solid #667eea; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>¡Bienvenido a 888Cargo!</h1>
                        </div>
                        <div class="content">
                            <p class="welcome-text">Hola <strong>${name}</strong>,</p>
                            <p>Tu cuenta ha sido creada exitosamente. Te damos la bienvenida a nuestra plataforma de gestión de cargas.</p>
                            
                            <div class="features">
                                <h3>Qué puedes hacer ahora:</h3>
                                <div class="feature">✅ Crear y gestionar tus cargas</div>
                                <div class="feature">✅ Generar códigos QR para seguimiento</div>
                                <div class="feature">✅ Consultar estado de envíos</div>
                                <div class="feature">✅ Recibir notificaciones en tiempo real</div>
                            </div>
                            
                            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                            
                            <a href="https://888cargo.com" class="button">Ir a la Plataforma</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2025 888Cargo. Todos los derechos reservados.</p>
                        <p>Este email fue enviado porque registraste una cuenta con nosotros.</p>
                    </div>
                </body>
                </html>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent successfully:', result.response);
        return { success: true, message: 'Welcome email sent' };

    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        // No lanzar error para no interrumpir el flujo de registro
        return { success: false, message: error.message };
    }
};

/**
 * Enviar email de confirmación de registro con credenciales
 * @param {string} email - Email del usuario
 * @param {string} name - Nombre del usuario
 * @param {string} username - Username del usuario
 * @returns {Promise}
 */
export const sendRegistrationConfirmation = async (email, name, username) => {
    try {
        if (process.env.EMAIL_NOTIFICATIONS !== 'true') {
            console.log('📧 Email notifications disabled');
            return { success: true, message: 'Email notifications disabled' };
        }

        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: 'Confirmación de Registro - 888Cargo',
            html: `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .info-box { background: #f0f7ff; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
                        .label { font-weight: bold; color: #667eea; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>Confirmación de Registro</h2>
                        <p>Hola <strong>${name}</strong>,</p>
                        <p>Tu registro en 888Cargo se ha completado exitosamente. Aquí están tus detalles:</p>
                        
                        <div class="info-box">
                            <p><span class="label">Email:</span> ${email}</p>
                            <p><span class="label">Usuario:</span> ${username}</p>
                            <p><span class="label">Contraseña:</span> La que proporcionaste al registrarse (cámbiala en tu primer acceso por seguridad)</p>
                        </div>
                        
                        <p>Ya puedes acceder a la plataforma con tus credenciales.</p>
                        <p>Por favor, no compartas esta información con terceros.</p>
                        
                        <p>¡Gracias por usar 888Cargo!</p>
                    </div>
                </body>
                </html>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Registration confirmation email sent:', result.response);
        return { success: true, message: 'Registration confirmation email sent' };

    } catch (error) {
        console.error('❌ Error sending registration confirmation email:', error);
        return { success: false, message: error.message };
    }
};

export default {
    sendWelcomeEmail,
    sendRegistrationConfirmation
};
