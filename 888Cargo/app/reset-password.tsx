import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes } from '../constants/Colors';
import { createThemeStyles } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { API_CONFIG } from '../constants/API';
import { resetPasswordScreenStyles as styles } from '../styles/screens/ResetPasswordScreen.styles';
import CustomAlert from '../components/CustomAlert';

export default function ResetPasswordScreen() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPasswordFocused, setNewPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifyingToken, setIsVerifyingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'info' as 'info' | 'success' | 'warning' | 'error',
        title: '',
        message: ''
    });
    
    const router = useRouter();
    const params = useLocalSearchParams();
    const token = params.token as string;
    
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    // Verificar token al cargar la página
    useEffect(() => {
        verifyToken();
    }, []);

    const verifyToken = async () => {
        if (!token) {
            showAlert('error', 'Token Inválido', 'No se proporcionó un token de recuperación válido.');
            setIsVerifyingToken(false);
            setTokenValid(false);
            return;
        }

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/recuperacion/verificar-token/${token}`);
            const data = await response.json();

            if (data.valid) {
                setTokenValid(true);
            } else {
                showAlert('error', 'Token Expirado', 'El enlace de recuperación ha expirado o es inválido. Por favor, solicita uno nuevo.');
                setTokenValid(false);
            }
        } catch (error) {
            console.error('Error al verificar token:', error);
            showAlert('error', 'Error', 'No se pudo verificar el token. Intenta nuevamente.');
            setTokenValid(false);
        } finally {
            setIsVerifyingToken(false);
        }
    };

    const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];
        
        if (password.length < 8) {
            errors.push('Mínimo 8 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Al menos una letra mayúscula');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Al menos una letra minúscula');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Al menos un número');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    };

    const getPasswordRequirements = () => {
        const validation = validatePassword(newPassword);
        
        return [
            { text: 'Mínimo 8 caracteres', met: newPassword.length >= 8 },
            { text: 'Una letra mayúscula', met: /[A-Z]/.test(newPassword) },
            { text: 'Una letra minúscula', met: /[a-z]/.test(newPassword) },
            { text: 'Un número', met: /[0-9]/.test(newPassword) },
        ];
    };

    const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
        setAlertConfig({ type, title, message });
        setAlertVisible(true);
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim() || !confirmPassword.trim()) {
            showAlert('error', 'Campos Vacíos', 'Por favor completa todos los campos');
            return;
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            showAlert('error', 'Contraseña Débil', `La contraseña debe cumplir los siguientes requisitos:\n\n• ${passwordValidation.errors.join('\n• ')}`);
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('error', 'Error', 'Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/recuperacion/cambiar-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    newPassword: newPassword
                }),
            });

            const data = await response.json();

            if (data.success) {
                showAlert(
                    'success',
                    '✅ Contraseña Actualizada', 
                    'Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
                );
            } else {
                showAlert('error', 'Error', data.message || 'Error al actualizar la contraseña');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('error', 'Error de Conexión', 'No se pudo conectar con el servidor. Verifica tu conexión.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.replace('/login' as any);
    };

    const handleAlertClose = () => {
        setAlertVisible(false);
        // Si fue exitoso, volver al login
        if (alertConfig.type === 'success') {
            setTimeout(() => router.replace('/login' as any), 300);
        } else if (!tokenValid) {
            // Si el token no es válido, redirigir al login
            setTimeout(() => router.replace('/login' as any), 300);
        }
    };

    // Mostrar pantalla de carga mientras verifica el token
    if (isVerifyingToken) {
        return (
            <View style={[styles.container, themeStyles.loadingContainer, { backgroundColor: colors.authBackground }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[themeStyles.loadingText, { color: colors.textMuted }]}>
                    Verificando enlace...
                </Text>
            </View>
        );
    }

    // Si el token no es válido, mostrar mensaje de error
    if (!tokenValid) {
        return (
            <View style={[styles.container, { backgroundColor: colors.authBackground }]}>
                <View style={themeStyles.authContainer}>
                    <View style={themeStyles.authContent}>
                        <View style={styles.headerContainer}>
                            <Text style={{ fontSize: 64, textAlign: 'center' }}>❌</Text>
                            <Text style={[themeStyles.title, { color: colors.textLight, marginTop: 10 }]}>
                                Enlace Inválido
                            </Text>
                        </View>
                        
                        <View style={themeStyles.authCard}>
                            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                                El enlace de recuperación ha expirado o es inválido.
                                {'\n\n'}
                                Por favor, solicita un nuevo enlace de recuperación.
                            </Text>
                            
                            <TouchableOpacity
                                style={themeStyles.button}
                                onPress={handleBackToLogin}
                            >
                                <Text style={themeStyles.buttonText}>Volver al Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <CustomAlert
                    visible={alertVisible}
                    type={alertConfig.type}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={handleAlertClose}
                    buttons={[
                        { 
                            text: 'OK', 
                            style: 'default',
                            onPress: handleAlertClose
                        }
                    ]}
                />
            </View>
        );
    }

    // Pantalla principal de reseteo de contraseña
    return (
        <View style={[styles.container, { backgroundColor: colors.authBackground }]}>
            <KeyboardAvoidingView
                style={themeStyles.authContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={themeStyles.authContent}>
                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <Text style={[themeStyles.title, { color: colors.textLight, fontSize: 42 }]}>🔑</Text>
                            <Text style={[themeStyles.title, { color: colors.textLight, marginTop: 10 }]}>888 Cargo</Text>
                            <Text style={themeStyles.authSubtitle}>Nueva Contraseña</Text>
                        </View>

                        {/* Card de reseteo */}
                        <View style={themeStyles.authCard}>
                            <Text style={themeStyles.authTitle}>Crear Nueva Contraseña</Text>
                            
                            <Text style={[styles.instructionText, { color: colors.textSecondary, marginBottom: 20 }]}>
                                Ingresa tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
                            </Text>

                            {/* New Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    Nueva Contraseña
                                </Text>
                                <TextInput
                                    style={[
                                        themeStyles.input,
                                        newPasswordFocused && themeStyles.inputFocused
                                    ]}
                                    placeholder="Ingresa tu nueva contraseña"
                                    placeholderTextColor={colors.textMuted}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                    onFocus={() => setNewPasswordFocused(true)}
                                    onBlur={() => setNewPasswordFocused(false)}
                                />
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    Confirmar Contraseña
                                </Text>
                                <TextInput
                                    style={[
                                        themeStyles.input,
                                        confirmPasswordFocused && themeStyles.inputFocused,
                                        confirmPassword && confirmPassword !== newPassword && themeStyles.inputError,
                                        confirmPassword && confirmPassword === newPassword && newPassword.length >= 8 && themeStyles.inputValid
                                    ]}
                                    placeholder="Confirma tu nueva contraseña"
                                    placeholderTextColor={colors.textMuted}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!isLoading}
                                    onFocus={() => setConfirmPasswordFocused(true)}
                                    onBlur={() => setConfirmPasswordFocused(false)}
                                />
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <Text style={[styles.helperText, { color: colors.danger }]}>
                                        Las contraseñas no coinciden
                                    </Text>
                                )}
                            </View>

                            {/* Requisitos de contraseña */}
                            {newPassword.length > 0 && (
                                <View style={[styles.passwordRequirements, { backgroundColor: colors.inputBackground }]}>
                                    <Text style={[styles.inputLabel, { color: colors.text, marginBottom: Spacing.xs }]}>
                                        Requisitos de contraseña:
                                    </Text>
                                    {getPasswordRequirements().map((req, index) => (
                                        <View key={index} style={styles.requirementItem}>
                                            <Text style={[styles.requirementIcon, { color: req.met ? colors.success : colors.textMuted }]}>
                                                {req.met ? '✓' : '○'}
                                            </Text>
                                            <Text style={[styles.requirementText, { color: req.met ? colors.success : colors.textMuted }]}>
                                                {req.text}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Reset Button */}
                            <TouchableOpacity
                                style={[
                                    themeStyles.button,
                                    isLoading && themeStyles.buttonDisabled,
                                    { marginTop: 10 }
                                ]}
                                onPress={handleResetPassword}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={colors.textLight} />
                                ) : (
                                    <Text style={themeStyles.buttonText}>🔒 Actualizar Contraseña</Text>
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

            {/* Alert personalizada */}
            <CustomAlert
                visible={alertVisible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={handleAlertClose}
                buttons={[
                    { 
                        text: 'OK', 
                        style: 'default',
                        onPress: handleAlertClose
                    }
                ]}
            />
        </View>
    );
}
