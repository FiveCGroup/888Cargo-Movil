import { Tabs, Redirect, router } from 'expo-router';
import React from 'react';
import { Platform, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import CustomAlert from '@/components/CustomAlert';
import useCustomAlert from '@/hooks/useCustomAlert';
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
  const { alertState, hideAlert, showConfirm, showError } = useCustomAlert();

  const handleLogout = () => {
    showConfirm(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      async () => {
        try {
          console.log('🚪 [TabLayout] Iniciando proceso de logout...');
          const result = await logout();
          
          if (result.success) {
            console.log('✅ [TabLayout] Logout exitoso, redirigiendo...');
            router.replace('/login');
          } else {
            console.warn('⚠️ [TabLayout] Error en logout pero continuando...');
            router.replace('/login');
          }
        } catch (error) {
          console.error('❌ [TabLayout] Error en handleLogout:', error);
          showError('Error', 'Error al cerrar sesión. Intenta nuevamente.');
        }
      },
      undefined, // onCancel - no necesitamos acción específica
      'Cerrar Sesión',
      'Cancelar'
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
    <>
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
                    alignItems: 'center',
                    paddingTop: 6, // Mismo padding top que usan los tabs nativos
                    paddingBottom: 6,
                    paddingHorizontal: 2,
                  }}
                  onPress={handleLogout}
                  activeOpacity={0.6}
                >
                  <IconSymbol size={28} name="power" color="#dc3545" />
                  <Text style={{ 
                    color: '#dc3545',
                    fontSize: 12,
                    marginTop: 2, // Reducir spacing para coincidir con tabs nativos
                    fontWeight: '600',
                    textAlign: 'center',
                  }}>
                    Salir
                  </Text>
                </TouchableOpacity>
              );
            },
          }}
        />
      </Tabs>
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </>
  );
}
