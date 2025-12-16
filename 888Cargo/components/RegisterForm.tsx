import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { createThemeStyles } from '../constants/Theme';
import { useColorScheme } from '../hooks/useColorScheme';
import Logo888Cargo from './Logo888Cargo';
import { registerFormStyles } from '../styles/components/RegisterForm.styles';
import { IconSizes, IconColors } from '../constants/Icons';
import { api } from '../services/api';

interface RegisterFormProps {
    onRegisterSuccess?: (userData: any) => void;
    onNavigateToLogin?: () => void;
    loading?: boolean;
}

interface RegisterData {
    name: string;
    lastname: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    country?: string;
}

export default function RegisterForm({
    onRegisterSuccess,
    onNavigateToLogin,
    loading: externalLoading
}: RegisterFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<RegisterData>({
        name: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        country: ''
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Partial<RegisterData>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];
    
    const isProcessing = isLoading || externalLoading;

    const validateForm = (): boolean => {
        const errors: Partial<RegisterData> = {};

        // Validar nombre
        if (!formData.name.trim()) {
            errors.name = 'El nombre es requerido';
        } else if (formData.name.trim().length < 2) {
            errors.name = 'El nombre debe tener al menos 2 caracteres';
        }

        // Validar apellido
        if (!formData.lastname.trim()) {
            errors.lastname = 'El apellido es requerido';
        } else if (formData.lastname.trim().length < 2) {
            errors.lastname = 'El apellido debe tener al menos 2 caracteres';
        }

        // Validar email
        if (!formData.email.trim()) {
            errors.email = 'El email es requerido';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                errors.email = 'El email no es válido';
            }
        }

        // Validar contraseña
        if (!formData.password) {
            errors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 6) {
            errors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        // Validar confirmación de contraseña
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Confirma tu contraseña';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden';
        }

        // Validar teléfono (opcional)
        if (formData.phone && formData.phone.trim()) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(formData.phone.trim())) {
                errors.phone = 'El teléfono no es válido';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field: keyof RegisterData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleRegister = async () => {
        if (!validateForm()) {
            Alert.alert('Error', 'Por favor corrige los errores en el formulario');
            return;
        }

        setIsLoading(true);
        
        try {
            // Transformar los datos al formato que espera el backend
            const registerData = {
                username: formData.name.trim(),
                full_name: `${formData.name.trim()} ${formData.lastname.trim()}`,
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                phone: formData.phone?.trim() || undefined,
                country: formData.country?.trim() || 'Colombia'
            };

            const result = await api.post('/auth/register', registerData);
            
            Alert.alert(
                'Registro Exitoso', 
                'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
                [
                    { 
                        text: 'OK', 
                        onPress: () => {
                            if (onNavigateToLogin) {
                                onNavigateToLogin();
                            } else {
                                router.replace('/login');
                            }
                        }
                    }
                ]
            );
        } catch (error: any) {
            console.error('❌ Error registro:', error);
            let msg = error.message || 'Error al crear la cuenta';
            
            // Si el mensaje contiene "HTTP", extraer solo el JSON
            if (msg.includes('HTTP')) {
                try {
                    const jsonMatch = msg.match(/\{.*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        msg = parsed.message || msg;
                    }
                } catch (e) {
                    // Si no se puede parsear, usar el mensaje original
                }
            }
            
            Alert.alert('Error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = () => {
        if (onNavigateToLogin) {
            onNavigateToLogin();
        } else {
            Alert.alert('Información', 'Funcionalidad de login pendiente');
        }
    };

    const renderInput = (
        field: keyof RegisterData,
        placeholder: string,
        options: {
            keyboardType?: 'default' | 'email-address' | 'phone-pad';
            secureTextEntry?: boolean;
            showPasswordToggle?: boolean;
            autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
        } = {}
    ) => {
        const hasError = !!formErrors[field];
        const isFocused = focusedField === field;
        
        return (
            <View style={registerFormStyles.inputContainer}>
                <View style={registerFormStyles.inputWrapper}>
                    <TextInput
                        style={[
                            themeStyles.input,
                            isFocused && themeStyles.inputFocused,
                            hasError && themeStyles.inputError,
                            options.showPasswordToggle && registerFormStyles.passwordInput
                        ]}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textMuted}
                        value={formData[field] || ''}
                        onChangeText={(value) => handleInputChange(field, value)}
                        keyboardType={options.keyboardType || 'default'}
                        secureTextEntry={options.secureTextEntry}
                        autoCapitalize={options.autoCapitalize || 'sentences'}
                        autoCorrect={false}
                        editable={!isProcessing}
                        onFocus={() => setFocusedField(field)}
                        onBlur={() => setFocusedField(null)}
                    />
                    
                    {options.showPasswordToggle && (
                        <TouchableOpacity
                            style={registerFormStyles.showPasswordButton}
                            onPress={() => {
                                if (field === 'password') {
                                    setShowPassword(!showPassword);
                                } else if (field === 'confirmPassword') {
                                    setShowConfirmPassword(!showConfirmPassword);
                                }
                            }}
                            disabled={isProcessing}
                        >
                            <Text style={registerFormStyles.showPasswordText}>
                                <MaterialIcons 
                                    name={(field === 'password' ? showPassword : showConfirmPassword) ? 'visibility' : 'visibility-off'} 
                                    size={24} 
                                    color={IconColors.secondary} 
                                />
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                {hasError && (
                    <Text style={[themeStyles.errorText, registerFormStyles.fieldError]}>
                        {formErrors[field]}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={themeStyles.authContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={registerFormStyles.scrollContainer}>
                <View style={themeStyles.authContent}>
                    {/* Header con logo */}
                    <View style={registerFormStyles.headerContainer}>
                        <Logo888Cargo 
                            size="large" 
                            showText={true}
                            textStyle={{ color: colors.textLight }}
                        />
                        <Text style={themeStyles.authSubtitle}>Únete a nuestra plataforma logística</Text>
                    </View>

                    {/* Card de registro con estilo web */}
                    <View style={themeStyles.authCard}>
                        <Text style={themeStyles.authTitle}>Crear Cuenta</Text>

                        {/* Campos del formulario */}
                        {renderInput('name', 'Nombre')}
                        
                        {renderInput('lastname', 'Apellido')}
                        
                        {renderInput('email', 'Email', {
                            keyboardType: 'email-address',
                            autoCapitalize: 'none'
                        })}
                        
                        {renderInput('phone', 'Teléfono (opcional)', {
                            keyboardType: 'phone-pad'
                        })}
                        
                        {renderInput('country', 'País (opcional)')}
                        
                        {renderInput('password', 'Contraseña', {
                            secureTextEntry: !showPassword,
                            showPasswordToggle: true,
                            autoCapitalize: 'none'
                        })}
                        
                        {renderInput('confirmPassword', 'Confirmar contraseña', {
                            secureTextEntry: !showConfirmPassword,
                            showPasswordToggle: true,
                            autoCapitalize: 'none'
                        })}

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[
                                themeStyles.button,
                                isProcessing && themeStyles.buttonDisabled,
                                registerFormStyles.registerButton
                            ]}
                            onPress={handleRegister}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color={colors.textLight} />
                            ) : (
                                <Text style={themeStyles.buttonText}>Crear Cuenta</Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={registerFormStyles.loginContainer}>
                            <View style={[registerFormStyles.loginLinkContainer, { borderColor: colors.border }]}>
                                <Text style={[registerFormStyles.loginText, { color: colors.textSecondary }]}>
                                    ¿Ya tienes cuenta?{' '}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={isProcessing}
                                >
                                    <Text style={[registerFormStyles.loginLink, { color: colors.primary }]}>
                                        Iniciar Sesión
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
