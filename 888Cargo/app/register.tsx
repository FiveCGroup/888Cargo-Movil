import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RegisterForm from '../components/RegisterForm';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

export default function RegisterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleRegisterSuccess = () => {
        // Navegar al login después del registro exitoso
        router.replace('/login');
    };

    const handleNavigateToLogin = () => {
        router.push('/login');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.authBackground }]}>
            <RegisterForm
                onRegisterSuccess={handleRegisterSuccess}
                onNavigateToLogin={handleNavigateToLogin}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
