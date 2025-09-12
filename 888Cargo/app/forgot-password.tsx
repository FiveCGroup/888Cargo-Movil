import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/Colors';
import { createThemeStyles } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const router = useRouter();
    const { resetPassword } = useAuth();
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleResetPassword = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Por favor ingresa tu email');
            return;
        }

        if (!validateEmail(email.trim())) {
            Alert.alert('Error', 'Por favor ingresa un email válido');
            return;
        }

        setIsLoading(true);
        
        const result = await resetPassword(email.trim());
        
        setIsLoading(false);
        
        if (result.success) {
            Alert.alert(
                'Email Enviado', 
                'Se ha enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada.',
                [
                    { 
                        text: 'OK', 
                        onPress: () => router.back()
                    }
                ]
            );
        } else {
            Alert.alert('Error', result.error || 'Error al enviar email de recuperación');
        }
    };

    const handleBackToLogin = () => {
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.authBackground }]}>
            <KeyboardAvoidingView
                style={themeStyles.authContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={themeStyles.authContent}>
                        {/* Header con estilo web */}
                        <View style={styles.headerContainer}>
                            <Text style={[themeStyles.title, { color: colors.textLight }]}>888 Cargo</Text>
                            <Text style={themeStyles.authSubtitle}>Recuperar Contraseña</Text>
                        </View>

                        {/* Card de recuperación con estilo web */}
                        <View style={themeStyles.authCard}>
                            <Text style={themeStyles.authTitle}>Restablecer Contraseña</Text>
                            
                            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                            </Text>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[
                                        themeStyles.input,
                                        emailFocused && themeStyles.inputFocused
                                    ]}
                                    placeholder="Email"
                                    placeholderTextColor={colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                />
                            </View>

                            {/* Reset Button */}
                            <TouchableOpacity
                                style={[
                                    themeStyles.button,
                                    isLoading && themeStyles.buttonDisabled
                                ]}
                                onPress={handleResetPassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={colors.textLight} />
                                ) : (
                                    <Text style={themeStyles.buttonText}>Enviar Enlace</Text>
                                )}
                            </TouchableOpacity>

                            {/* Back to Login */}
                            <View style={styles.backContainer}>
                                <View style={[styles.backLinkContainer, { borderColor: colors.border }]}>
                                    <Text style={[styles.backText, { color: colors.textSecondary }]}>
                                        ¿Recordaste tu contraseña?{' '}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={handleBackToLogin}
                                        disabled={isLoading}
                                    >
                                        <Text style={[styles.backLink, { color: colors.primary }]}>
                                            Iniciar Sesión
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    instructionText: {
        fontSize: FontSizes.sm,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    backContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
    },
    backLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        borderTopWidth: 1,
        paddingTop: Spacing.md,
    },
    backText: {
        fontSize: FontSizes.sm,
    },
    backLink: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
});
