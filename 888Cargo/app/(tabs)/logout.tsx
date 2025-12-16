import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import CustomAlert from '../../components/CustomAlert';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function LogoutScreen() {
  const router = useRouter();
  const { logout } = useAuthContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showAlert, setShowAlert] = useState(false);

  // Mostrar el alert al montar el componente
  useEffect(() => {
    console.log('🚪 [logout.tsx] Mostrando confirmación de logout');
    setShowAlert(true);
  }, []);

  const handleConfirmLogout = async () => {
    try {
      console.log('🚪 [logout.tsx] Usuario confirmó logout, ejecutando...');
      setShowAlert(false);
      
      await logout();
      console.log('🚪 [logout.tsx] Logout completado, navegando a /login');
      
      router.replace('/login');
    } catch (error) {
      console.error('❌ [logout.tsx] Error en logout:', error);
      setShowAlert(false);
    }
  };

  const handleCancel = () => {
    console.log('🚪 [logout.tsx] Usuario canceló logout');
    setShowAlert(false);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomAlert
        visible={showAlert}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar sesión?"
        type="confirm"
        buttons={[
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: handleCancel,
          },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: handleConfirmLogout,
          },
        ]}
        onClose={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});