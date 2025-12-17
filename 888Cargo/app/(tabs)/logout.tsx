import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthContext } from '../../context/AuthContext';
import CustomAlert from '../../components/CustomAlert';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function LogoutScreen() {
  const { logout } = useAuthContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    console.log('🚪 [logout.tsx] Mostrando confirmación de logout');
    setShowAlert(true);
  }, []);

  const handleConfirmLogout = async () => {
    try {
      console.log('🚪 [logout.tsx] Usuario confirmó logout, ejecutando...');
      setShowAlert(false);

      await logout();  // Aquí se cierra sesión y cambia isAuthenticated a false
      console.log('🚪 [logout.tsx] Logout completado - la redirección la maneja Auth protection');

      // NO uses router.replace ni dismissAll aquí
      // Tu TabLayout ya redirige automáticamente a /login cuando detecta !isAuthenticated
    } catch (error) {
      console.error('❌ [logout.tsx] Error en logout:', error);
      setShowAlert(false);
    }
  };

  const handleCancel = () => {
    console.log('🚪 [logout.tsx] Usuario canceló logout');
    setShowAlert(false);
    // Solo cierra el alert - NO navegues (evita cualquier acción en stack)
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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