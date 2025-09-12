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

interface RegisterFormProps {
    onRegisterSuccess?: () => void;
    onNavigateToLogin?: () => void;
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
    onNavigateToLogin
}: RegisterFormProps) {
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
    
    const { register, isLoading, error, clearError } = useAuth();
    const colorScheme = useColorScheme();
    const themeStyles = createThemeStyles(colorScheme ?? 'light');
    const colors = Colors[colorScheme ?? 'light'];

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

        clearError();
        
        const registerData = {
            name: formData.name.trim(),
            lastname: formData.lastname.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            phone: formData.phone?.trim() || undefined,
            country: formData.country?.trim() || undefined
        };

        const result = await register(registerData);
        
        if (result.success) {
            Alert.alert(
                'Registro Exitoso', 
                'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
                [
                    { 
                        text: 'OK', 
                        onPress: () => {
                            if (onRegisterSuccess) {
                                onRegisterSuccess();
                            } else if (onNavigateToLogin) {
                                onNavigateToLogin();
                            }
                        }
                    }
                ]
            );
        } else {
            Alert.alert('Error', result.error || 'Error al registrar usuario');
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
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={[
                            themeStyles.input,
                            isFocused && themeStyles.inputFocused,
                            hasError && themeStyles.inputError,
                            options.showPasswordToggle && styles.passwordInput
                        ]}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textMuted}
                        value={formData[field] || ''}
                        onChangeText={(value) => handleInputChange(field, value)}
                        keyboardType={options.keyboardType || 'default'}
                        secureTextEntry={options.secureTextEntry}
                        autoCapitalize={options.autoCapitalize || 'sentences'}
                        autoCorrect={false}
                        editable={!isLoading}
                        onFocus={() => setFocusedField(field)}
                        onBlur={() => setFocusedField(null)}
                    />
                    
                    {options.showPasswordToggle && (
                        <TouchableOpacity
                            style={styles.showPasswordButton}
                            onPress={() => {
                                if (field === 'password') {
                                    setShowPassword(!showPassword);
                                } else if (field === 'confirmPassword') {
                                    setShowConfirmPassword(!showConfirmPassword);
                                }
                            }}
                            disabled={isLoading}
                        >
                            <Text style={styles.showPasswordText}>
                                {(field === 'password' ? showPassword : showConfirmPassword) ? '👁️' : '👁️‍🗨️'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                {hasError && (
                    <Text style={[themeStyles.errorText, styles.fieldError]}>
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
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={themeStyles.authContent}>
                    {/* Header con logo */}
                    <View style={styles.headerContainer}>
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

                        {/* Mensaje de error general */}
                        {error && (
                            <Text style={themeStyles.errorText}>{error}</Text>
                        )}

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
                                isLoading && themeStyles.buttonDisabled,
                                styles.registerButton
                            ]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={colors.textLight} />
                            ) : (
                                <Text style={themeStyles.buttonText}>Crear Cuenta</Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <View style={[styles.loginLinkContainer, { borderColor: colors.border }]}>
                                <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                                    ¿Ya tienes cuenta?{' '}
                                </Text>
                                <TouchableOpacity
                                    onPress={handleLogin}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.loginLink, { color: colors.primary }]}>
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
    inputWrapper: {
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
    fieldError: {
        marginTop: Spacing.xs,
        marginLeft: Spacing.sm,
    },
    registerButton: {
        marginTop: Spacing.lg,
    },
    loginContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        paddingTop: Spacing.md,
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        borderTopWidth: 1,
        paddingTop: Spacing.md,
    },
    loginText: {
        fontSize: FontSizes.sm,
    },
    loginLink: {
        fontSize: FontSizes.sm,
        fontWeight: '600',
    },
});
