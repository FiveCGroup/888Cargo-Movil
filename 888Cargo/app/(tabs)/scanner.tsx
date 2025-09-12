import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes } from '../../constants/Colors';
import { createThemeStyles } from '../../constants/Theme';
import { useColorScheme } from '../../hooks/useColorScheme';
import Logo888Cargo from '../../components/Logo888Cargo';

export default function ScannerScreen() {
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[themeStyles.container, styles.centerContent]}>
            <View style={styles.headerContainer}>
                <Logo888Cargo size="small" layout="horizontal" showText={true} />
            </View>
            
            <View style={themeStyles.card}>
                <Text style={[themeStyles.title, { color: colors.primary }]}>
                    Escáner QR
                </Text>
                <Text style={[themeStyles.textSecondary, styles.subtitle]}>
                    📱 Funcionalidad en desarrollo...
                </Text>
                <Text style={[themeStyles.textMuted, styles.description]}>
                    Aquí podrás escanear códigos QR para gestionar cargas de manera rápida y eficiente.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
        position: 'absolute',
        top: Spacing.xl,
        width: '100%',
    },
    subtitle: {
        textAlign: 'center',
        marginTop: Spacing.md,
        fontSize: FontSizes.lg,
    },
    description: {
        textAlign: 'center',
        marginTop: Spacing.lg,
        lineHeight: 22,
    },
});
