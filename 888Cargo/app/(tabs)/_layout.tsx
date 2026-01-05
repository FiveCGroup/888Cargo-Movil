import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthContext } from '@/context/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isAuthInitialized } = useAuthContext();

  useEffect(() => {
    console.log('📱 [TabLayout] isAuthenticated cambió a:', isAuthenticated);
  }, [isAuthenticated]);

  // Esperar inicialización de auth antes de decidir
  if (!isAuthInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Si NO está autenticado, redirigir a login
  if (!isAuthenticated) {
    console.log('📱 [TabLayout] NO autenticado - redirigiendo a /login');
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cotizaciones"
        options={{
          title: 'Cotizaciones',
          tabBarIcon: ({ color }) => <MaterialIcons name="calculate" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cargas"
        options={{
          title: 'Cargas',
          tabBarIcon: ({ color }) => <MaterialIcons name="inventory-2" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color }) => <MaterialIcons name="qr-code-scanner" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Salir',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="logout" 
              size={28} 
              color={focused ? '#dc3545' : '#dc3545'} 
            />
          ),
          tabBarLabelStyle: {
            color: '#dc3545', // Rojo para el texto
          },
          tabBarActiveTintColor: '#dc3545', // Rojo cuando está activo
          tabBarInactiveTintColor: '#dc3545', // Rojo cuando está inactivo
        }}
      />
      
      {/* Tabs ocultos pero accesibles por navegación */}
      <Tabs.Screen
        name="documentacion"
        options={{
          href: null, // Ocultar del tab bar
        }}
      />
    </Tabs>
  );
}
