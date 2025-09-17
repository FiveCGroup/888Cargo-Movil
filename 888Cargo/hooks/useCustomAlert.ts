import { useState, useCallback } from 'react';
import { AlertButton } from '@/components/CustomAlert';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  buttons: AlertButton[];
}

const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = useCallback((
    title: string,
    message: string,
    buttons?: AlertButton[],
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm' = 'info'
  ) => {
    const defaultButtons: AlertButton[] = [
      {
        text: 'OK',
        style: 'default',
      }
    ];

    setAlertState({
      visible: true,
      title,
      message,
      type,
      buttons: buttons || defaultButtons,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Funciones de conveniencia para diferentes tipos de alerta
  const showSuccess = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    showAlert(title, message, buttons, 'success');
  }, [showAlert]);

  const showError = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    showAlert(title, message, buttons, 'error');
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    showAlert(title, message, buttons, 'warning');
  }, [showAlert]);

  const showInfo = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    showAlert(title, message, buttons, 'info');
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ) => {
    const buttons: AlertButton[] = [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: 'destructive',
        onPress: onConfirm,
      }
    ];
    showAlert(title, message, buttons, 'confirm');
  }, [showAlert]);

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};

export default useCustomAlert;