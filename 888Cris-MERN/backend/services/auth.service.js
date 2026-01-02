// services/auth.service.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import databaseRepository from '../repositories/index.js';
import { TOKEN_SECRET } from '../config.js';
import whatsappService from './whatsappService.js';
import { sendWelcomeEmail, sendRegistrationConfirmation } from './emailService.js';

const { users, roles, user_roles, recovery_tokens, clientes } = databaseRepository;

/**
 * Registro de usuario (cliente por defecto)
 */
export const register = async (userData) => {
  const existing = await users.findByEmail(userData.email);
  if (existing) throw new Error('Email ya registrado');

  // Validar que el teléfono no esté duplicado si está proporcionado
  if (userData.phone) {
    const existingPhone = await users.executeQuery(
      'SELECT id FROM users WHERE phone = ?',
      [userData.phone]
    );
    if (existingPhone && existingPhone.length > 0) {
      throw new Error('Número de teléfono ya registrado');
    }
  }

  const passwordHash = await bcrypt.hash(userData.password, 10);

  const { id: userId } = await users.create({
    username: userData.username || userData.email.split('@')[0],
    email: userData.email,
    password: passwordHash,
    full_name: userData.full_name || '',
    phone: userData.phone || '',
    country: userData.country || 'Colombia'
  });

  // Asignar rol cliente por defecto
  const clienteRole = await roles.findOne({ name: 'cliente' });
  if (clienteRole) {
    await user_roles.create({ user_id: userId, role_id: clienteRole.id });
  }

  // Crear registro en la tabla `clientes` para mantener sincronía
  try {
    const clienteData = {
      nombre_cliente: userData.full_name || (userData.username || userData.email.split('@')[0]),
      correo_cliente: userData.email,
      telefono_cliente: userData.phone || '',
      pais_cliente: userData.country || 'Colombia',
      ciudad_cliente: userData.city || null,
      direccion_entrega: userData.address || null,
      cliente_shippingMark: userData.shippingMark || null
    };

    const createdCliente = await clientes.create(clienteData);
    // Opcional: si deseas mantener relación explícita, podrías guardar createdCliente.id en otra tabla.
    console.log('[Auth] Cliente creado con id:', createdCliente.id);
  } catch (err) {
    console.error('[Auth] Falló creación de cliente (no crítico):', err.message);
  }

  // Enviar notificaciones en background; no bloquea el flujo existente
  void (async () => {
    try {
      const tasks = [];
      if (userData.email) {
        tasks.push(sendWelcomeEmail(userData.email, userData.full_name));
        tasks.push(sendRegistrationConfirmation(userData.email, userData.full_name, userData.username || userData.email.split('@')[0]));
      }
      const phone = userData.phone || '';
      if (phone) {
        const fullName = `${userData.full_name}`.trim();
        tasks.push(whatsappService.sendWelcomeWhatsApp(phone, fullName, userData.country || ''));
      }
      if (tasks.length === 0) return;
      const results = await Promise.allSettled(tasks);
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error('[Notifications] task', i, 'rejected:', r.reason);
      });
    } catch (notifyErr) {
      console.error('[Notifications] unexpected error:', notifyErr);
    }
  })();

  return { success: true, user: { id: userId, name: userData.full_name, email: userData.email } };
};

/**
 * Login de usuario
 */
export const login = async (email, password) => {
  const user = await users.findByEmail(email);
  if (!user) throw new Error('Credenciales inválidas');

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) throw new Error('Credenciales inválidas');

  // Obtener roles del usuario
  const userRoles = await user_roles.executeQuery(`
    SELECT r.name FROM roles r 
    JOIN user_roles ur ON r.id = ur.role_id 
    WHERE ur.user_id = ?
  `, [user.id]);

  const rolesList = userRoles.map(r => r.name);

  const token = jwt.sign(
    { id: user.id, email: user.email, roles: rolesList },
    TOKEN_SECRET,
    { expiresIn: '24h' }
  );

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username || user.email.split('@')[0],
      full_name: user.full_name || '',
      phone: user.phone || '',
      country: user.country || '',
      roles: rolesList
    }
  };
};

/**
 * Solicitar recuperación de contraseña
 */
export const requestPasswordReset = async (email) => {
  const user = await users.findByEmail(email);
  if (!user) throw new Error('Email no encontrado');

  const token = Math.random().toString(36).substring(2, 15);
  const expires = new Date(Date.now() + 3600000); // 1 hora

  await recovery_tokens.create({
    user_id: user.id,
    token,
    expires_at: expires
  });

  // Aquí iría el envío por WhatsApp o email
  console.log(`Enlace de recuperación: http://localhost:8081/reset?token=${token}`);

  return { success: true, message: 'Enlace enviado' };
};

/**
 * Resetear contraseña
 */
export const resetPassword = async (token, newPassword) => {
  const recovery = await recovery_tokens.findOne({ token, used: 0 });
  if (!recovery || new Date(recovery.expires_at) < new Date()) {
    throw new Error('Token inválido o expirado');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await users.update(recovery.user_id, { password: passwordHash });

  await recovery_tokens.update(recovery.id, { used: 1 });

  return { success: true, message: 'Contraseña actualizada' };
};

/**
 * Limpieza de tokens expirados
 */
export const cleanAllExpiredTokens = async () => {
  const result = await recovery_tokens.executeQuery(
    'DELETE FROM recovery_tokens WHERE expires_at < CURRENT_TIMESTAMP OR used = 1'
  );
  return result.changes || 0;
};