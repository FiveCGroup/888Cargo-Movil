import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    // Inmediatamente regresar al dashboard cuando se "navegue" a esta pantalla
    router.replace('/(tabs)');
  }, []);

  return <View />;
}