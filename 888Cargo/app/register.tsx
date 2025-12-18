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
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { useCrossPlatformAlert } from '../hooks/useCrossPlatformAlert';

// Códigos de país para el dropdown
const COUNTRY_CODES = [
  { label: '🇨🇴 Colombia (+57)', code: '+57', country: 'Colombia' },
  { label: '🇵🇪 Perú (+51)', code: '+51', country: 'Perú' },
  { label: '🇪🇨 Ecuador (+593)', code: '+593', country: 'Ecuador' },
  { label: '🇨🇱 Chile (+56)', code: '+56', country: 'Chile' },
  { label: '🇦🇷 Argentina (+54)', code: '+54', country: 'Argentina' },
  { label: '🇧🇷 Brasil (+55)', code: '+55', country: 'Brasil' },
  { label: '🇲🇽 México (+52)', code: '+52', country: 'México' },
  { label: '🇪🇸 España (+34)', code: '+34', country: 'España' },
  { label: '🇺🇸 Estados Unidos (+1)', code: '+1', country: 'Estados Unidos' },
  { label: '🇨🇦 Canadá (+1)', code: '+1', country: 'Canadá' },
  { label: '🇻🇪 Venezuela (+58)', code: '+58', country: 'Venezuela' },
  { label: '🇬🇧 Reino Unido (+44)', code: '+44', country: 'Reino Unido' },
  { label: '🇦🇺 Australia (+61)', code: '+61', country: 'Australia' },
  { label: '🇯🇵 Japón (+81)', code: '+81', country: 'Japón' },
  { label: '🇨🇳 China (+86)', code: '+86', country: 'China' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { showAlert, AlertDialog } = useCrossPlatformAlert();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    lastname: '',
    email: '',
    countryCode: '+57', // Colombia por defecto
    phone: '',
    country: 'Colombia',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async () => {
    // Validaciones rápidas
    if (!form.name || !form.lastname || !form.email || !form.phone || !form.password) {
      showAlert({
        title: 'Error',
        message: 'Completa todos los campos obligatorios'
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      showAlert({
        title: 'Error',
        message: 'Las contraseñas no coinciden'
      });
      return;
    }
    if (form.password.length < 6) {
      showAlert({
        title: 'Error',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }
    // Validar que el teléfono tenga al menos 7 dígitos
    if (form.phone.replace(/\D/g, '').length < 7) {
      showAlert({
        title: 'Error',
        message: 'El teléfono debe tener al menos 7 dígitos'
      });
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `${form.countryCode}${form.phone.replace(/\D/g, '')}`;
      const response = await api.post('/auth/register', {
        username: form.name.trim(),
        full_name: `${form.name.trim()} ${form.lastname.trim()}`,
        email: form.email.trim().toLowerCase(),
        phone: fullPhone,
        country: form.country,
        password: form.password,
      });

      console.log('✅ Registro exitoso:', response);

      // El backend NO devuelve token en el registro, hay que hacer login
      showAlert({
        title: 'Registro exitoso',
        message: 'Tu cuenta ha sido creada. Ahora debes iniciar sesión.',
        buttons: [
          {
            text: 'Ir a Login',
            onPress: () => router.replace('/login')
          }
        ]
      });

    } catch (error: any) {
      console.error('❌ Error registro:', error);
      let msg = error.message || 'Error al crear la cuenta, email o número ya en uso';
      
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
      
      showAlert({
        title: 'Error',
        message: msg
      });
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

        <Text style={styles.label}>Código de País *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.countryCode}
            onValueChange={(value) => {
              const selected = COUNTRY_CODES.find(c => c.code === value);
              setForm({
                ...form,
                countryCode: value,
                country: selected?.country || form.country
              });
            }}
            style={styles.picker}
          >
            {COUNTRY_CODES.map((item) => (
              <Picker.Item
                key={item.code + item.country}
                label={item.label}
                value={item.code}
              />
            ))}
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Teléfono (solo números) *"
          value={form.phone}
          onChangeText={v => setForm({ ...form, phone: v.replace(/\D/g, '') })}
          keyboardType="phone-pad"
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
      <AlertDialog />
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0b2032',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#e9ebef',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#0b2032',
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