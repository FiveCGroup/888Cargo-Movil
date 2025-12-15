import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, Redirect, useFocusEffect } from 'expo-router';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export default function LoginScreen() {
    const router = useRouter();
    const { isAuthenticated, refresh } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Refresca el estado de autenticación cada vez que la pantalla toma foco
    useFocusEffect(
        React.useCallback(() => {
            refresh();
        }, [])
    );

    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    const handleLoginSuccess = () => {
        console.log('✅ Login exitoso, redirigiendo al dashboard...');
        // Redirigir al dashboard después del login exitoso
        router.replace('/(tabs)');
    };

    const handleNavigateToRegister = () => {
        router.push('/register' as any);
    };

    const handleNavigateToForgotPassword = () => {
        router.push('/forgot-password' as any);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.authBackground }]}>
            <LoginForm
                onLoginSuccess={handleLoginSuccess}
                onNavigateToRegister={handleNavigateToRegister}
                onNavigateToForgotPassword={handleNavigateToForgotPassword}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
