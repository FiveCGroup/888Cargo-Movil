import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import cotizacionService from '../../services/cotizacionService';

interface Props {
  usuarioLogueado: boolean;
  onCotizado: (data: any) => void;
  onRequiereRegistro: () => void;
}

const CotizacionForm: React.FC<Props> = ({ usuarioLogueado, onCotizado, onRequiereRegistro }) => {
  const [tipoEnvio, setTipoEnvio] = useState<'maritimo' | 'aereo'>('maritimo');

  const [largo, setLargo] = useState('');
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [peso, setPeso] = useState('');

  const [cargando, setCargando] = useState(false);

  const validarCampos = () => {
    if (!largo || !ancho || !alto || !peso) return false;
    if (Number(largo) <= 0 || Number(ancho) <= 0 || Number(alto) <= 0 || Number(peso) <= 0) return false;
    return true;
  };

  const handleCotizar = async () => {
    if (!validarCampos()) {
      alert('Completa correctamente todos los campos.');
      return;
    }

    setCargando(true);

    const payload = {
      largo_cm: Number(largo),
      ancho_cm: Number(ancho),
      alto_cm: Number(alto),
      peso_kg: Number(peso)
    };

    try {
      console.log('[CotizacionForm] usuarioLogueado:', usuarioLogueado);

      // Si el usuario no está logueado, guardar borrador y pedir registro
      if (!usuarioLogueado) {
        try {
          await cotizacionService.guardarDatosTemporales(tipoEnvio, payload, null);
        } catch (e) {
          console.warn('[CotizacionForm] No se pudo guardar borrador:', e);
        }
        onRequiereRegistro();
        setCargando(false);
        return;
      }

      const resp = await cotizacionService.cotizarEnvio(tipoEnvio, payload, usuarioLogueado);

      // Manejar primeramente el caso en que el servicio requiere registro
      if (resp && resp.requiereRegistro) {
        onRequiereRegistro();
        // el servicio ya guardó borrador; no llamar onCotizado con datos incompletos
        setCargando(false);
        return;
      }

      if (!resp || resp.success === false) {
        const r = resp as any;
        const msg = (r && r.error && typeof r.error === 'object' && 'message' in r.error) ? r.error.message : (r?.error || 'Error al obtener cotización');
        alert(msg);
        setCargando(false);
        return;
      }

      // sólo llamar onCotizado si hay data válida
      if (resp.data) {
        onCotizado(resp.data);
      } else {
        alert('Cotización recibida sin datos.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error inesperado');
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.selectorTipo}>
        <TouchableOpacity
          onPress={() => setTipoEnvio('maritimo')}
          style={[styles.opcionTipo, tipoEnvio === 'maritimo' && styles.opcionActiva]}
        >
          <Text style={[styles.textoOpcion, tipoEnvio === 'maritimo' && { color: '#fff' }]}>Marítimo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTipoEnvio('aereo')}
          style={[styles.opcionTipo, tipoEnvio === 'aereo' && styles.opcionActiva]}
        >
          <Text style={[styles.textoOpcion, tipoEnvio === 'aereo' && { color: '#fff' }]}>Aéreo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filaInputs}>
        <TextInput
          keyboardType="numeric"
          placeholder="Largo (cm)"
          style={styles.input}
          value={largo}
          onChangeText={setLargo}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Ancho (cm)"
          style={styles.input}
          value={ancho}
          onChangeText={setAncho}
        />
      </View>

      <View style={styles.filaInputs}>
        <TextInput
          keyboardType="numeric"
          placeholder="Alto (cm)"
          style={styles.input}
          value={alto}
          onChangeText={setAlto}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Peso (kg)"
          style={styles.input}
          value={peso}
          onChangeText={setPeso}
        />
      </View>

      <TouchableOpacity style={styles.btnCotizar} onPress={handleCotizar} disabled={cargando}>
        {cargando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnTexto}>Cotizar envío</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 18 },
  selectorTipo: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18
  },
  opcionTipo: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1b4ea3',
    marginHorizontal: 5,
    backgroundColor: '#fff'
  },
  opcionActiva: {
    backgroundColor: '#1b4ea3'
  },
  textoOpcion: {
    color: '#1b4ea3',
    fontWeight: '700'
  },
  filaInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  input: {
    width: '48%',
    backgroundColor: '#e3e6ef',
    padding: 10,
    borderRadius: 12,
  },
  btnCotizar: {
    backgroundColor: '#1b4ea3',
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 12,
    alignItems: 'center'
  },
  btnTexto: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold'
  },
});

export default CotizacionForm;
