import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants/Colors';
import { createThemeStyles } from '../constants/Theme';
import { useAuth } from '../hooks/useAuth';
import { useColorScheme } from '../hooks/useColorScheme';
import Logo888Cargo from './Logo888Cargo';
import { dashboardStyles } from '../styles/components/Dashboard.styles';
import { IconSizes } from '../constants/Icons';

interface DashboardCard {
    title: string;
    iconName: string;
    iconLibrary?: 'MaterialIcons' | 'Ionicons';
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
    onNavigateToDocumentacion?: () => void;
    onNavigateToCotizaciones?: () => void; // ← AGREGADO
}

export default function Dashboard({
    onNavigateToCargas,
    onNavigateToQRScanner,
    onNavigateToProfile,
    onNavigateToDocumentacion,
    onNavigateToCotizaciones // ← AGREGADO
}: DashboardProps) {
    const { user } = useAuth();
    const [pressedCard, setPressedCard] = useState<number | null>(null);

    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    const dashboardCards: DashboardCard[] = [
        {
            title: 'Cotizaciones',
            iconName: 'calculate',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToCotizaciones // ← AGREGADO PRIMERO
        },
        {
            title: 'Gestión de Cargas',
            iconName: 'inventory-2',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToCargas
        },
        {
            title: 'Escanear QR',
            iconName: 'qr-code-scanner',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToQRScanner
        },
        {
            title: 'Mi Perfil',
            iconName: 'person',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToProfile
        },
        {
            title: '📚 Documentación',
            iconName: 'menu-book',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToDocumentacion
        },
        {
            title: 'Configuración',
            iconName: 'settings',
            iconLibrary: 'MaterialIcons',
            onPress: () => Alert.alert('Info', 'Configuración pendiente')
        },
        {
            title: 'Reportes',
            iconName: 'analytics',
            iconLibrary: 'MaterialIcons',
            onPress: () => Alert.alert('Info', 'Reportes pendiente')
        },
        {
            title: 'Ayuda',
            iconName: 'help',
            iconLibrary: 'MaterialIcons',
            onPress: () => Alert.alert('Ayuda', 'Contacta soporte: soporte@888cargo.com')
        }
    ];

    return (
        <View style={themeStyles.container}>
            {/* Encabezado estilo web */}
            <View style={[dashboardStyles.header]}>
                <View>
                    <Text style={[dashboardStyles.welcomeText, { color: colors.textLight }]}>¡Hola!</Text>
                    <Text style={[dashboardStyles.userNameText, { color: colors.textLight }]}>
                        {user?.name || user?.email || 'Usuario'}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={dashboardStyles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Título principal con logo */}
                <View style={dashboardStyles.titleContainer}>
                    <Logo888Cargo 
                        size="medium" 
                        showText={true}
                        layout="horizontal"
                        style={{ marginBottom: Spacing.sm }}
                    />
                    <Text style={[dashboardStyles.subtitle, { color: colors.textMuted }]}>
                        Soluciones de Logística y Transporte
                    </Text>
                </View>

                {/* Tarjetas principales con distribución fija de 2 columnas */}
                <View style={dashboardStyles.cardsContainer}>
                    {dashboardCards.map((card, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                dashboardStyles.dashboardCard,
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
                                dashboardStyles.cardIcon,
                                { backgroundColor: colors.cardBackground },
                                pressedCard === index && { backgroundColor: colors.primary }
                            ]}>
                                <MaterialIcons 
                                    name={card.iconName as any} 
                                    size={36} 
                                    color={pressedCard === index ? colors.textLight : colors.primary}
                                />
                            </View>
                            <Text style={[
                                dashboardStyles.cardTitle,
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
