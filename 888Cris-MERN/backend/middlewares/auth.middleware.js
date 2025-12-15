import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config.js';
import databaseRepository from '../repositories/index.js';

const { users } = databaseRepository;

export const authRequired = async (req, res, next) => {
  try {
    // Obtener token del header o cookie
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No autorizado - Token no proporcionado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, TOKEN_SECRET);
    
    // Obtener usuario
    const user = await users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'No autorizado - Usuario no encontrado' });
    }

    // Agregar usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      phone: user.phone,
      country: user.country,
      roles: decoded.roles || ['cliente']
    };

    next();
  } catch (error) {
    console.error('Error en authRequired:', error.message);
    return res.status(401).json({ success: false, message: 'No autorizado - Token inválido' });
  }
};