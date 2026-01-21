// services/admin.service.js
import databaseRepository from '../repositories/index.js';
import bcrypt from 'bcrypt';

const { users, roles, user_roles, permissions, role_permissions } = databaseRepository;

/**
 * Crear usuario (solo superadmin)
 */
export const crearUsuario = async (userData, requesterId) => {
  // Solo superadmin puede crear usuarios
  const requester = await users.findById(requesterId);
  const requesterRoles = await user_roles.executeQuery(
    'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?',
    [requesterId]
  );
  const hasSuperAdmin = requesterRoles.some(r => r.name === 'superadmin');
  if (!hasSuperAdmin) throw new Error('Acceso denegado');

  const existing = await users.findByEmail(userData.email);
  if (existing) throw new Error('Email ya registrado');

  const passwordHash = await bcrypt.hash(userData.password || '123456', 10);

  // Usar el nombre completo del cliente para username en lugar del correo
  const username = userData.username || userData.full_name || userData.email.split('@')[0];

  const { id: newUserId } = await users.create({
    username: username,
    email: userData.email,
    password: passwordHash,
    full_name: userData.full_name || '',
    phone: userData.phone || '',
    status: userData.status || 'active'
  });

  // Asignar rol
  if (userData.role) {
    const role = await roles.findOne({ name: userData.role });
    if (role) {
      await user_roles.create({ user_id: newUserId, role_id: role.id });
    }
  }

  return { success: true, message: 'Usuario creado', userId: newUserId };
};

/**
 * Listar todos los usuarios con sus roles
 */
export const listarUsuarios = async () => {
  const usuarios = await users.getAllWithRoles();
  return usuarios.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    roles: u.roles ? u.roles.split(',') : [],
    status: u.status,
    created_at: u.created_at
  }));
};

/**
 * Crear rol con permisos
 */
export const crearRol = async (nombre, permisosArray, requesterId) => {
  // Verificar permisos del solicitante
  const requesterRoles = await user_roles.executeQuery(
    'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?',
    [requesterId]
  );
  if (!requesterRoles.some(r => r.name === 'superadmin')) {
    throw new Error('Solo superadmin puede crear roles');
  }

  const rolExistente = await roles.findOne({ name: nombre });
  if (rolExistente) throw new Error('Rol ya existe');

  const { id: roleId } = await roles.create({ name: nombre, description: `${nombre} role` });

  for (const permName of permisosArray) {
    let permiso = await permissions.findOne({ name: permName });
    if (!permiso) {
      const { id } = await permissions.create({ name: permName, module: 'general' });
      permiso = { id };
    }
    await role_permissions.create({ role_id: roleId, permission_id: permiso.id });
  }

  return { success: true, roleId, nombre };
};