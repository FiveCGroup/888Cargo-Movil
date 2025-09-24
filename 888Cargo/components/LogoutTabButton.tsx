import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/hooks/useAuth';
import { IconSizes, IconColors } from '@/constants/Icons';

interface LogoutTabButtonProps {
  color?: string;
  focused?: boolean;
}

export function LogoutTabButton({ color = '#fff', focused }: LogoutTabButtonProps) {
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

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#dc3545', // Fondo rojo
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
  );
}
