import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuthContext } from '@/context/AuthContext';
import CustomAlert from '@/components/CustomAlert';
import { IconSizes, IconColors } from '@/constants/Icons';

interface LogoutTabButtonProps {
  color?: string;
  focused?: boolean;
}

export function LogoutTabButton({ color = '#fff', focused }: LogoutTabButtonProps) {
  const { logout } = useAuthContext();
  const [showAlert, setShowAlert] = useState(false);

  const handleLogoutPress = () => {
    console.log('🚪 [LogoutTabButton] Click en logout');
    setShowAlert(true);
  };

  const handleConfirmLogout = async () => {
    try {
      console.log('🚪 [LogoutTabButton] Ejecutando logout...');
      setShowAlert(false);

      await logout();  // Cambia isAuthenticated → tu protection redirige sola
      console.log('🚪 [LogoutTabButton] Logout completado - redirección automática');
      
      // NO uses router.replace ni dismissAll aquí tampoco
    } catch (error) {
      console.error('❌ [LogoutTabButton] Error:', error);
      setShowAlert(false);
    }
  };

  const handleCancel = () => {
    console.log('🚪 [LogoutTabButton] Usuario canceló');
    setShowAlert(false);
    // Solo cierra el alert
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleLogoutPress}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#dc3545',
          marginHorizontal: 8,
          marginVertical: 4,
          borderRadius: 8,
          paddingVertical: 8,
        }}
      >
        <IconSymbol size={24} name="power" color={IconColors.white} />
        <Text style={{ color: '#fff', fontSize: 11, marginTop: 2, fontWeight: '600' }}>
          Salir
        </Text>
      </TouchableOpacity>

      <CustomAlert
        visible={showAlert}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar sesión?"
        type="confirm"
        buttons={[
          { text: 'Cancelar', style: 'cancel', onPress: handleCancel },
          { text: 'Cerrar Sesión', style: 'destructive', onPress: handleConfirmLogout },
        ]}
        onClose={handleCancel}
      />
    </>
  );
}