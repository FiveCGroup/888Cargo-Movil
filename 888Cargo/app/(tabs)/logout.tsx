import React, { useEffect } from 'react';
import { View, Alert, StyleSheet, ToastAndroid } from 'react-native'; // Agrega Toast para feedback
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para limpieza extra

export default function LogoutScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    showConfirmation();
  }, []);

  const showConfirmation = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => router.back(),
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout(); // Llama al backend y limpia tokens
              await AsyncStorage.clear(); // Limpia todo el storage local (opcional: solo keys específicas)
              ToastAndroid.show('Sesión cerrada exitosamente', ToastAndroid.SHORT);
              router.replace('/login');
            } catch (error) {
              console.error('Error en logout:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión. Intenta nuevamente.');
              router.back(); // Regresa si falla
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});