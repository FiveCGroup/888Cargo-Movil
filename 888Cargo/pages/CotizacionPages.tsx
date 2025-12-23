import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import CotizacionForm from '../components/cotizacion/CotizacionForm';
import ResultadoCotizacion from '../components/cotizacion/ResultCotizacion';
import BotonDescargarCotizacion from '../components/cotizacion/DescargarCoti';
import ModalRegistroRequerido from '../components/cotizacion/ModalRegistro';
import { router } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

const CotizacionScreen = () => {

  const [usuarioLogueado, setUsuarioLogueado] = useState<boolean>(false);

  const [resultado, setResultado] = useState<any>(null);
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);

  // ============================================================
  // Comprobar si existe sesión guardada
  // ============================================================
  const verificarSesion = async () => {
    try {
      const token = await AsyncStorage.getItem('@auth:token'); // antes 'session_token'
      setUsuarioLogueado(!!token);
    } catch (e) {
      console.log('Error verificando sesión', e);
    }
  };

  useEffect(() => {
    verificarSesion();
  }, []);

  // ============================================================
  // Callbacks desde los componentes
  // ============================================================

  const handleCotizado = (data: any) => {
    setResultado(data);
  };

  const handleRequiereRegistro = () => {
    setMostrarModalRegistro(true);
  };

  const handleDescargar = () => {
    if (!usuarioLogueado) {
      setMostrarModalRegistro(true);
      return;
    }

    // Aquí implementarás PDF
    alert('Descarga implementada más adelante.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/888cargo-logo.png')}
          style={styles.logo}
        />
      </View>

      <Text style={styles.title}>Calcula el costo de tu envío</Text>
      <Text style={styles.subTitle}>Completa los datos y obtén el valor exacto</Text>

      {/* FORMULARIO */}
      <CotizacionForm
        usuarioLogueado={usuarioLogueado}
        onCotizado={handleCotizado}
        onRequiereRegistro={handleRequiereRegistro}
      />

      {/* RESULTADOS */}
      <ResultadoCotizacion resultado={resultado} />

      {/* DESCARGAR COTIZACIÓN */}
      {resultado && (
        <BotonDescargarCotizacion onPress={handleDescargar} />
      )}

      {/* MODAL REGISTRO */}
      <ModalRegistroRequerido
        visible={mostrarModalRegistro}
        onCerrar={() => setMostrarModalRegistro(false)}
        onIrRegistro={() => {
          setMostrarModalRegistro(false);
          router.push('/register');
        }}
      />

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10
  },
  logo: {
    width: 140,
    height: 70,
    resizeMode: 'contain'
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6
  },
  subTitle: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
    color: '#555'
  }
});

export default CotizacionScreen;
