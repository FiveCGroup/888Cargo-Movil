import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth'; // Asegúrate de importar tu hook
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

const appSignature = 'TmlyYW0gTmFpdHNpcmM=';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { isAuthenticated, isLoading, refresh } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    refresh(); // Asegura que el estado esté actualizado al montar
  }, []);

  useEffect(() => {
    if (isLoading || !loaded) return;

    // Si NO está autenticado y no está en login/register, redirige a login
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    }
    // Si está autenticado y está en login, redirige al home
    if (isAuthenticated && segments[0] === 'login') {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, loaded]);

  if (!loaded || isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="CotizadorScreen" options={{ title: 'Cotización' }} />
        <Stack.Screen name="register" options={{ title: 'Registro' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}