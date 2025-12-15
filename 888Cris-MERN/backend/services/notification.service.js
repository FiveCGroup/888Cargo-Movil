// services/notification.service.js
import databaseRepository from '../repositories/index.js';

export const enviarNotificacion = async (userId, titulo, mensaje, relatedId = null, tipo = 'info') => {
  await databaseRepository.notifications.create({
    user_id: userId,
    title: titulo,
    message: mensaje,
    related_id: relatedId,
    related_type: tipo
  });
};