import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { createThemeStyles } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthState } from '@/hooks/useAuth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const themeStyles = createThemeStyles(colorScheme ?? 'light');
  const { isLoading, isAuthenticated } = useAuthState();

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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.borderLight,
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
    </Tabs>
  );
}
