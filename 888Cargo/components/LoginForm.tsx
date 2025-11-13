import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    ScrollView,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/Colors';
import { createThemeStyles } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
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
            style={loginFormStyles.container}
            behavior={Platform.OS === 'ios' ? 'position' : undefined}
            keyboardVerticalOffset={0}
        >
            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Parte superior - Tarjeta azul con logo y campos */}
                <View style={loginFormStyles.upperCard}>
                {/* Logo */}
                <View style={loginFormStyles.logoContainer}>
                    <Image
                        source={require('../assets/images/888cargo-logo.png')}
                        style={{ width: 350, height: 350, resizeMode: 'contain' }}
                    />
                </View>

                {/* Campos de entrada */}
                <View style={loginFormStyles.inputsContainer}>
                    {/* Email Input */}
                    <View style={loginFormStyles.inputContainer}>
                        <TextInput
                            style={[
                                loginFormStyles.input,
                                emailFocused && loginFormStyles.inputFocused
                            ]}
                            placeholder="Email"
                            placeholderTextColor="rgba(255, 255, 255, 0.7)"
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
                                    loginFormStyles.input,
                                    loginFormStyles.passwordInput,
                                    passwordFocused && loginFormStyles.inputFocused
                                ]}
                                placeholder="Contraseña"
                                placeholderTextColor="rgba(255, 255, 255, 0.7)"
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
                                <MaterialIcons 
                                    name={showPassword ? 'visibility' : 'visibility-off'} 
                                    size={24} 
                                    color="rgba(255, 255, 255, 0.7)" 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Parte inferior - Fondo blanco con botones */}
            <View style={loginFormStyles.lowerSection}>
                {/* Mensaje de error */}
                {error && (
                    <Text style={loginFormStyles.errorText}>{error}</Text>
                )}

                {/* Login Button */}
                <TouchableOpacity
                    style={[
                        loginFormStyles.loginButton,
                        isLoading && loginFormStyles.loginButtonDisabled
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={loginFormStyles.loginButtonText}>Iniciar Sesión</Text>
                    )}
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity
                    style={loginFormStyles.forgotPasswordButton}
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                >
                    <Text style={loginFormStyles.forgotPasswordText}>
                        ¿Olvidaste tu contraseña?
                    </Text>
                </TouchableOpacity>

                {/* Register Button */}
                <TouchableOpacity
                    style={[
                        loginFormStyles.registerButton,
                        isLoading && loginFormStyles.registerButtonDisabled
                    ]}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    <Text style={loginFormStyles.registerButtonText}>
                        Registrarse
                    </Text>
                </TouchableOpacity>

                {/* Módulo de cotización */}
                <TouchableOpacity
                    style={loginFormStyles.quotationModule}
                    onPress={() => showInfo('Cotización', 'Módulo de cotización próximamente disponible')}
                    disabled={isLoading}
                    activeOpacity={0.7}
                >
                    <View style={loginFormStyles.quotationIcon}>
                        <Image 
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11449/11449753.png' }} 
                            style={{ width: 75, height: 75 }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={loginFormStyles.quotationTitle}>
                        Cotizar envío
                    </Text>
                </TouchableOpacity>

                {/* Grupo de contacto: ícono + botón */}
                <View style={loginFormStyles.contactContainer}>
                    {/* Ícono de contacto (20%) */}
                    <TouchableOpacity
                        style={loginFormStyles.contactIcon}
                        onPress={() => showInfo('Teléfono', 'Próximamente: llamada directa')}
                        disabled={isLoading}
                    >
                        <MaterialIcons 
                            name="phone" 
                            size={24} 
                            color="#FFFFFF" 
                        />
                    </TouchableOpacity>
                    
                    {/* Espaciador (10%) */}
                    <View style={loginFormStyles.contactSpacer} />
                    
                    {/* Botón de contacto (70%) */}
                    <TouchableOpacity
                        style={[
                            loginFormStyles.contactButton,
                            isLoading && loginFormStyles.contactButtonDisabled
                        ]}
                        onPress={() => showInfo('Contacto', 'Próximamente: contacto directo por WhatsApp')}
                        disabled={isLoading}
                    >
                        <Text style={loginFormStyles.contactButtonText}>
                            Contáctanos
                        </Text>
                    </TouchableOpacity>
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