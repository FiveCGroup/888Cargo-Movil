import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import LoginForm from '../components/LoginForm';
import { useAuthContext } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export default function LoginScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuthContext();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    const handleLoginSuccess = () => {
        console.log('✅ Login exitoso en LoginScreen, redirigiendo...');
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
