import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Dashboard from '../../components/Dashboard';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function HomeScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleNavigateToCargas = () => {
        router.push('/(tabs)/cargas');
    };

    const handleNavigateToQRScanner = () => {
        router.push('/(tabs)/scanner');
    };

    const handleNavigateToProfile = () => {
        router.push('/(tabs)/profile');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Dashboard
                onNavigateToCargas={handleNavigateToCargas}
                onNavigateToQRScanner={handleNavigateToQRScanner}
                onNavigateToProfile={handleNavigateToProfile}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
