import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/Colors';
import { createThemeStyles } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import Logo888Cargo from './Logo888Cargo';
import CustomAlert from './CustomAlert';
import useCustomAlert from '../hooks/useCustomAlert';
import { loginFormStyles } from '../styles/components/LoginForm.styles';
import { IconSizes, IconColors } from '../constants/Icons';

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
    const { alertState, hideAlert, showError, showSuccess, showInfo } = useCustomAlert();
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            showError('Error', 'Por favor ingresa email y contraseña');
            return;
        }

        clearError();
        
        const result = await login(email.trim(), password);
        
        if (result.success) {
            // Navegar inmediatamente al dashboard
            if (onLoginSuccess) {
                onLoginSuccess();
            }
            // Mostrar mensaje de éxito después de la navegación
            setTimeout(() => {
                showSuccess('Éxito', 'Sesión iniciada correctamente');
            }, 100);
        } else {
            showError('Error', result.error || 'Error al iniciar sesión');
        }
    };

    const handleForgotPassword = () => {
        if (onNavigateToForgotPassword) {
            onNavigateToForgotPassword();
        } else {
            showInfo('Información', 'Funcionalidad de recuperación pendiente');
        }
    };

    const handleRegister = () => {
        if (onNavigateToRegister) {
            onNavigateToRegister();
        } else {
            showInfo('Información', 'Funcionalidad de registro pendiente');
        }
    };

    return (
        <KeyboardAvoidingView
            style={themeStyles.authContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={loginFormStyles.scrollContainer}>
                <View style={themeStyles.authContent}>
                    {/* Header con logo */}
                    <View style={loginFormStyles.headerContainer}>
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
                        <View style={loginFormStyles.inputContainer}>
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
                        <View style={loginFormStyles.inputContainer}>
                            <View style={loginFormStyles.passwordContainer}>
                                <TextInput
                                    style={[
                                        themeStyles.input,
                                        loginFormStyles.passwordInput,
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
                                    style={loginFormStyles.showPasswordButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    <Text style={loginFormStyles.showPasswordText}>
                                        <MaterialIcons 
                                            name={showPassword ? 'visibility' : 'visibility-off'} 
                                            size={24} 
                                            color={IconColors.secondary} 
                                        />
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
                            style={loginFormStyles.forgotPasswordButton}
                            onPress={handleForgotPassword}
                            disabled={isLoading}
                        >
                            <Text style={[loginFormStyles.forgotPasswordText, { color: colors.primary }]}>
                                ¿Olvidaste tu contraseña?
                            </Text>
                        </TouchableOpacity>

                        {/* Register Link */}
                        <View style={loginFormStyles.registerContainer}>
                            <View style={[loginFormStyles.registerLinkContainer, { borderColor: colors.border }]}>
                                <Text style={[loginFormStyles.registerText, { color: colors.textSecondary }]}>
                                    ¿No tienes cuenta?{' '}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleRegister}
                                    disabled={isLoading}
                                >
                                    <Text style={[loginFormStyles.registerLink, { color: colors.primary }]}>
                                        Regístrate
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
            
            <CustomAlert
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                buttons={alertState.buttons}
                onClose={hideAlert}
            />
        </KeyboardAvoidingView>
    );
}
