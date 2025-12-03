// app/register.tsx  (o donde lo tengas la pantalla de registro)

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    country: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async () => {
    // Validaciones rápidas
    if (!form.name || !form.lastname || !form.email || !form.password) {
      Alert.alert('Error', 'Completa todos los campos obligatorios');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: form.name.trim(),
        lastname: form.lastname.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone?.trim() || undefined,
        country: form.country?.trim() || undefined,
        password: form.password,
      });

      console.log('✅ Registro exitoso:', response);

      // El backend NO devuelve token en el registro, hay que hacer login
      Alert.alert(
        'Registro exitoso', 
        'Tu cuenta ha sido creada. Ahora debes iniciar sesión.',
        [
          { 
            text: 'Ir a Login', 
            onPress: () => router.replace('/login')
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Error registro:', error);
      const msg = error.message || 'Error al crear la cuenta';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Completa tu registro y descarga tu cotización</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre *"
          value={form.name}
          onChangeText={v => setForm({ ...form, name: v })}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Apellido *"
          value={form.lastname}
          onChangeText={v => setForm({ ...form, lastname: v })}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Correo *"
          value={form.email}
          onChangeText={v => setForm({ ...form, email: v })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Teléfono (opcional)"
          value={form.phone}
          onChangeText={v => setForm({ ...form, phone: v })}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="País (opcional)"
          value={form.country}
          onChangeText={v => setForm({ ...form, country: v })}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña *"
          value={form.password}
          onChangeText={v => setForm({ ...form, password: v })}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña *"
          value={form.confirmPassword}
          onChangeText={v => setForm({ ...form, confirmPassword: v })}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>CREAR CUENTA</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0b2032',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0b2032',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#e9ebef',
    color: '#0b2032',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  btn: {
    backgroundColor: '#0f77c5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#0f77c5',
    fontSize: 14,
  },
});