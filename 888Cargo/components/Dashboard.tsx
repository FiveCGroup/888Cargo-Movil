import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/Colors';
import { createThemeStyles } from '../constants/Theme';
import { useAuth } from '../hooks/useAuth';
import { useColorScheme } from '../hooks/useColorScheme';
import Logo888Cargo from './Logo888Cargo';

interface DashboardCard {
    title: string;
    value: string;
    icon: string;
    onPress?: () => void;
}

interface Carga {
    id: string;
    estado: string;
    [key: string]: any;
}

interface DashboardProps {
    onNavigateToCargas?: () => void;
    onNavigateToQRScanner?: () => void;
    onNavigateToProfile?: () => void;
}

export default function Dashboard({
    onNavigateToCargas,
    onNavigateToQRScanner,
    onNavigateToProfile
}: DashboardProps) {
    const { user, logout } = useAuth();
    const [pressedCard, setPressedCard] = useState<number | null>(null);

    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

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

    const dashboardCards: DashboardCard[] = [
        {
            title: 'Gestión de Cargas',
            value: '📦',
            icon: '📦',
            onPress: onNavigateToCargas
        },
        {
            title: 'Escanear QR',
            value: '📱',
            icon: '📱',
            onPress: onNavigateToQRScanner
        },
        {
            title: 'Mi Perfil',
            value: '👤',
            icon: '👤',
            onPress: onNavigateToProfile
        },
        {
            title: 'Configuración',
            value: '⚙️',
            icon: '⚙️',
            onPress: () => Alert.alert('Info', 'Configuración pendiente')
        },
        {
            title: 'Reportes',
            value: '📊',
            icon: '📊',
            onPress: () => Alert.alert('Info', 'Reportes pendiente')
        },
        {
            title: 'Ayuda',
            value: '❓',
            icon: '❓',
            onPress: () => Alert.alert('Ayuda', 'Contacta soporte: soporte@888cargo.com')
        }
    ];

    return (
        <View style={themeStyles.container}>
            {/* Header estilo web */}
            <View style={[themeStyles.navBar, styles.header]}>
                <View>
                    <Text style={[styles.welcomeText, { color: colors.textLight }]}>¡Hola!</Text>
                    <Text style={[styles.userNameText, { color: colors.textLight }]}>
                        {user?.name || user?.email || 'Usuario'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[themeStyles.button, themeStyles.buttonDanger, styles.logoutButton]}
                    onPress={handleLogout}
                >
                    <Text style={themeStyles.buttonText}>Salir</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Título principal con logo */}
                <View style={styles.titleContainer}>
                    <Logo888Cargo 
                        size="medium" 
                        showText={true}
                        layout="horizontal"
                        style={{ marginBottom: Spacing.sm }}
                    />
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        Soluciones de Logística y Transporte
                    </Text>
                </View>

                {/* Cards principales con distribución fija de 2 columnas */}
                <View style={styles.cardsContainer}>
                    {dashboardCards.map((card, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dashboardCard,
                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                pressedCard === index && { 
                                    borderColor: colors.primary,
                                    backgroundColor: colors.primary 
                                }
                            ]}
                            onPress={card.onPress}
                            onPressIn={() => setPressedCard(index)}
                            onPressOut={() => setPressedCard(null)}
                            disabled={!card.onPress}
                        >
                            <View style={[
                                styles.cardIcon,
                                { backgroundColor: colors.cardBackground },
                                pressedCard === index && { backgroundColor: colors.primary }
                            ]}>
                                <Text style={[
                                    styles.cardIconText,
                                    { color: colors.text },
                                    pressedCard === index && { color: colors.textLight }
                                ]}>
                                    {card.value}
                                </Text>
                            </View>
                            <Text style={[
                                styles.cardTitle,
                                { color: colors.text },
                                pressedCard === index && { color: colors.textLight }
                            ]}>
                                {card.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingVertical: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    welcomeText: {
        fontSize: FontSizes.base,
        fontWeight: '500',
    },
    userNameText: {
        fontSize: FontSizes.lg,
        fontWeight: '700',
        marginTop: Spacing.xs,
    },
    logoutButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        minWidth: 80,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingTop: Spacing.md,
    },
    subtitle: {
        fontSize: FontSizes.base,
        fontWeight: '400',
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
        justifyContent: 'space-between',
    },
    dashboardCard: {
        width: '47%', // Fijo para 2 columnas exactas
        minHeight: 130,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardIcon: {
        width: 55,
        height: 55,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    cardIconText: {
        fontSize: 26,
    },
    cardTitle: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: Spacing.xs,
        lineHeight: FontSizes.sm * 1.2,
    },
});
