import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Platform, View, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { createThemeStyles } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthState, useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const themeStyles = createThemeStyles(colorScheme ?? 'light');
  const { isLoading, isAuthenticated } = useAuthState();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              Alert.alert('Error', 'Error al cerrar sesión');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[themeStyles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[themeStyles.loadingText, { color: colors.textMuted }]}>
          Verificando autenticación...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0494d6', // Azul claro de la marca para elementos activos
        tabBarInactiveTintColor: '#ffffff', // Blanco para iconos inactivos (mejor contraste)
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: colors.authBackground,
          borderTopColor: 'transparent',
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cargas"
        options={{
          title: 'Cargas',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cube.box.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'QR Scanner',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="qrcode.viewfinder" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Salir',
          tabBarButton: (props) => {
            return (
              <TouchableOpacity
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#dc3545',
                  marginHorizontal: 4,
                  marginVertical: 6,
                  borderRadius: 8,
                  paddingVertical: 8,
                }}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <IconSymbol size={24} name="power" color="#ffffff" />
                <Text style={{ 
                  color: '#ffffff', 
                  fontSize: 11, 
                  marginTop: 2, 
                  fontWeight: '600' 
                }}>
                  Salir
                </Text>
              </TouchableOpacity>
            );
          },
        }}
      />
    </Tabs>
  );
}
