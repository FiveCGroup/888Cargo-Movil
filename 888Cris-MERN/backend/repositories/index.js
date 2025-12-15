// backend/repositories/index.js
import transactionManager from './transaction.manager.js';
import userRepository from './user.repository.js';
import roleRepository from './role.repository.js';
import clienteRepository from './cliente.repository.js';
import cargaRepository from './carga.repository.js';
import articuloRepository from './articulo.repository.js';
import cajaRepository from './caja.repository.js';
import qrRepository from './qr.repository.js';
import contenedorRepository from './contenedor.repository.js';
import auditRepository from './audit.repository.js';
import userRoleRepository from './user-role.repository.js';
import recoveryTokenRepository from './recovery-token.repository.js';

const databaseRepository = {
  transaction: transactionManager,
  users: userRepository,
  roles: roleRepository,
  user_roles: userRoleRepository,
  recovery_tokens: recoveryTokenRepository,
  clientes: clienteRepository,
  cargas: cargaRepository,
  articulos: articuloRepository,
  cajas: cajaRepository,
  qr: qrRepository,
  contenedores: contenedorRepository,
  audit: auditRepository
};

export default databaseRepository;

// Solo exportamos lo que realmente existe
export {
  transactionManager,
  userRepository,
  roleRepository,
  userRoleRepository,
  recoveryTokenRepository,
  clienteRepository,
  cargaRepository,
  articuloRepository,
  cajaRepository,
  qrRepository,
  contenedorRepository,
  auditRepository
};