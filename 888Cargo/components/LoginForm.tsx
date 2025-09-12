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
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/Colors';
import { createThemeStyles } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import Logo888Cargo from './Logo888Cargo';

interface LoginFormProps {
    onLoginSuccess?: () => void;
    onNavigateToRegister?: () => void;
    onNavigateToForgotPassword?: () => void;
}

export default function LoginForm({
    onLoginSuccess,
    onNavigateToRegister,
    onNavigateToForgotPassword
}: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    
    const { login, isLoading, error, clearError } = useAuth();
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Por favor ingresa email y contraseña');
            return;
        }

        clearError();
        
        const result = await login(email.trim(), password);
        
        if (result.success) {
            Alert.alert('Éxito', 'Sesión iniciada correctamente', [
                { text: 'OK', onPress: onLoginSuccess }
            ]);
        } else {
            Alert.alert('Error', result.error || 'Error al iniciar sesión');
        }
    };

    const handleForgotPassword = () => {
        if (onNavigateToForgotPassword) {
            onNavigateToForgotPassword();
        } else {
            Alert.alert('Información', 'Funcionalidad de recuperación pendiente');
        }
    };

    const handleRegister = () => {
        if (onNavigateToRegister) {
            onNavigateToRegister();
        } else {
            Alert.alert('Información', 'Funcionalidad de registro pendiente');
        }
    };

    return (
        <KeyboardAvoidingView
            style={themeStyles.authContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={themeStyles.authContent}>
                    {/* Header con logo */}
                    <View style={styles.headerContainer}>
                        <Logo888Cargo 
                            size="large" 
                            showText={true}
                            textStyle={{ color: colors.textLight }}
                        />
                        <Text style={themeStyles.authSubtitle}>Soluciones de Logística Internacional</Text>
                    </View>

                    {/* Card de login con estilo web */}
                    <View style={themeStyles.authCard}>
                        <Text style={themeStyles.authTitle}>Iniciar Sesión</Text>

                        {/* Mensaje de error */}
                        {error && (
                            <Text style={themeStyles.errorText}>{error}</Text>
                        )}

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

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[
                                        themeStyles.input,
                                        styles.passwordInput,
                                        passwordFocused && themeStyles.inputFocused
                                    ]}
                                    placeholder="Contraseña"
                                    placeholderTextColor={colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!isLoading}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                />
                                <TouchableOpacity
                                    style={styles.showPasswordButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.showPasswordText}>
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[
                                themeStyles.button,
                                isLoading && themeStyles.buttonDisabled
                            ]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={colors.textLight} />
                            ) : (
                                <Text style={themeStyles.buttonText}>Iniciar Sesión</Text>
                            )}
                        </TouchableOpacity>

                        {/* Forgot Password */}
                        <TouchableOpacity
                            style={styles.forgotPasswordButton}
                            onPress={handleForgotPassword}
                            disabled={isLoading}
                        >
                            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                                ¿Olvidaste tu contraseña?
                            </Text>
                        </TouchableOpacity>

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <View style={[styles.registerLinkContainer, { borderColor: colors.border }]}>
                                <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                                    ¿No tienes cuenta?{' '}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleRegister}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.registerLink, { color: colors.primary }]}>
                                        Regístrate
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    inputContainer: {
        marginBottom: Spacing.md,
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        marginBottom: 0,
    },
    showPasswordButton: {
        position: 'absolute',
        right: Spacing.md,
        top: Spacing.md,
        bottom: Spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        width: 32,
    },
    showPasswordText: {
        fontSize: FontSizes.base,
    },
    forgotPasswordButton: {
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    forgotPasswordText: {
        fontSize: FontSizes.sm,
        fontWeight: '500',
    },
    registerContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
    },
    registerLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        borderTopWidth: 1,
        paddingTop: Spacing.md,
    },
    registerText: {
        fontSize: FontSizes.sm,
    },
    registerLink: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
});
