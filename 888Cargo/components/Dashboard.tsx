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
import { useAuthContext } from '../context/AuthContext';
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
    onNavigateToCotizaciones?: () => void;
    onNavigateToControlCargas?: () => void;
    onNavigateToLocker?: () => void;
}

export default function Dashboard({
    onNavigateToCargas,
    onNavigateToQRScanner,
    onNavigateToDocumentacion,
    onNavigateToCotizaciones,
    onNavigateToControlCargas,
    onNavigateToLocker,
}: DashboardProps) {
    const { user } = useAuthContext();
    const [pressedCard, setPressedCard] = useState<number | null>(null);

    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    // Módulos alineados con el home web: Documentación, Cotizaciones, Escanear QR, Gestión de carga, Locker, Control de carga
    const dashboardCards: DashboardCard[] = [
        {
            title: 'Cotizaciones',
            iconName: 'calculate',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToCotizaciones,
        },
        {
            title: 'Gestión de Cargas',
            iconName: 'inventory-2',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToCargas,
        },
        {
            title: 'Control de carga',
            iconName: 'assignment',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToControlCargas,
        },
        {
            title: 'Locker',
            iconName: 'lock',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToLocker,
        },
        {
            title: 'Escanear QR',
            iconName: 'qr-code-scanner',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToQRScanner,
        },
        {
            title: 'Documentación',
            iconName: 'menu-book',
            iconLibrary: 'MaterialIcons',
            onPress: onNavigateToDocumentacion,
        },
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
