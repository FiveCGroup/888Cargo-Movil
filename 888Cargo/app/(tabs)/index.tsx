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

    const handleNavigateToDocumentacion = () => {
        router.push('/(tabs)/documentacion');
    };

    const handleNavigateToCotizaciones = () => {
        router.push('/(tabs)/cotizaciones');
    };

    const handleNavigateToControlCargas = () => {
        router.push('/(tabs)/control-cargas');
    };

    const handleNavigateToLocker = () => {
        router.push('/(tabs)/locker');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Dashboard
                onNavigateToCargas={handleNavigateToCargas}
                onNavigateToQRScanner={handleNavigateToQRScanner}
                onNavigateToDocumentacion={handleNavigateToDocumentacion}
                onNavigateToCotizaciones={handleNavigateToCotizaciones}
                onNavigateToControlCargas={handleNavigateToControlCargas}
                onNavigateToLocker={handleNavigateToLocker}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
