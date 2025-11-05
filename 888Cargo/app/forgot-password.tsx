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
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/Colors';
import { createThemeStyles } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { API_CONFIG } from '../constants/API';
import { forgotPasswordScreenStyles as styles } from '../styles/screens/ForgotPasswordScreen.styles';
import CustomAlert from '../components/CustomAlert';

export default function ForgotPasswordScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'info' as 'info' | 'success' | 'warning' | 'error',
        title: '',
        message: ''
    });
    
    const router = useRouter();
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

    const validatePhoneNumber = (phone: string) => {
        // Validar formato con código de país - 10 a 15 dígitos
        const phoneRegex = /^[0-9]{10,15}$/;
        return phoneRegex.test(phone.trim());
    };

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        setAlertConfig({ type, title, message });
        setAlertVisible(true);
    };

    const handleSendRecoveryLink = async () => {
        if (!phoneNumber.trim()) {
            showAlert('error', 'Error', 'Por favor ingresa tu número de WhatsApp');
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            showAlert('error', 'Error', 'Por favor ingresa un número válido (10-15 dígitos con código de país, ej: 573001234567)');
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/recuperacion/enviar-enlace`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    telefono: phoneNumber.trim()
                }),
            });

            const data = await response.json();

            if (data.success) {
                showAlert(
                    'success',
                    '✅ Enlace Enviado', 
                    'Hemos enviado un enlace de recuperación a tu WhatsApp. El enlace expirará en 30 minutos.'
                );
                // Limpiar el campo después de enviar exitosamente
                setPhoneNumber('');
            } else {
                showAlert('error', 'Error', data.message || 'Error al enviar enlace de recuperación');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('error', 'Error de Conexión', 'No se pudo conectar con el servidor. Verifica tu conexión.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.back();
    };

    const handleAlertClose = () => {
        setAlertVisible(false);
        // Si fue exitoso, volver al login
        if (alertConfig.type === 'success') {
            setTimeout(() => router.back(), 300);
        }
    };

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
                            <Text style={[themeStyles.title, { color: colors.textLight, fontSize: 42 }]}>🔐</Text>
                            <Text style={[themeStyles.title, { color: colors.textLight, marginTop: 10 }]}>888 Cargo</Text>
                            <Text style={themeStyles.authSubtitle}>Recuperar Contraseña</Text>
                        </View>

                        {/* Card de recuperación */}
                        <View style={themeStyles.authCard}>
                            <Text style={themeStyles.authTitle}>¿Olvidaste tu contraseña?</Text>
                            
                            <Text style={[styles.instructionText, { color: colors.textSecondary, marginBottom: 20 }]}>
                                No te preocupes, te ayudaremos a restablecerla.{'\n\n'}
                                Ingresa el número de WhatsApp asociado a tu cuenta (con código de país) y te enviaremos un enlace para crear una nueva contraseña.
                            </Text>

                            {/* Phone Input */}
                            <View style={styles.inputContainer}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    Número de WhatsApp (con código de país)
                                </Text>
                                <View style={{ position: 'relative' }}>
                                    <View style={{
                                        position: 'absolute',
                                        left: 15,
                                        top: 0,
                                        bottom: 0,
                                        justifyContent: 'center',
                                        zIndex: 1,
                                        pointerEvents: 'none'
                                    }}>
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: 'bold',
                                            color: colors.textMuted,
                                        }}>
                                            +
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={[
                                            themeStyles.input,
                                            phoneFocused && themeStyles.inputFocused,
                                            { paddingLeft: 30 }
                                        ]}
                                        placeholder="573001234567 (Colombia) o 8613800000000 (China)"
                                        placeholderTextColor={colors.textMuted}
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        keyboardType="phone-pad"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                        onFocus={() => setPhoneFocused(true)}
                                        onBlur={() => setPhoneFocused(false)}
                                        maxLength={15}
                                    />
                                </View>
                                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                                    Incluye el código de país sin el símbolo + (ej: 57 para Colombia, 86 para China)
                                </Text>
                            </View>

                            {/* Send Button */}
                            <TouchableOpacity
                                style={[
                                    themeStyles.button,
                                    isLoading && themeStyles.buttonDisabled,
                                    { marginTop: 10 }
                                ]}
                                onPress={handleSendRecoveryLink}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={colors.textLight} />
                                ) : (
                                    <Text style={themeStyles.buttonText}>📱 Enviar Enlace por WhatsApp</Text>
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
