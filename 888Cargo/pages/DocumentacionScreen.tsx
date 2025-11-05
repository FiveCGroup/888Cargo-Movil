import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG } from '@/constants/API';

/**
 * Tipo de icono de Ionicons
 */
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Interfaz para los enlaces de documentación
 */
interface DocumentationLink {
  id: string;
  name: string;
  icon: IoniconsName;
  description: string;
  path: string;
  color: string;
}

/**
 * Pantalla de documentación técnica para la aplicación móvil
 * Proporciona acceso a la documentación generada con TypeDoc
 * @component
 */
export default function DocumentacionScreen() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');

  // Obtener la URL base del API (sin el /api al final)
  useEffect(() => {
    const apiUrl = API_CONFIG.BASE_URL.replace('/api', '');
    setBaseUrl(apiUrl);
  }, []);

  const documentationLinks: DocumentationLink[] = [
    {
      id: 'index',
      name: 'Inicio General',
      icon: 'home-outline' as IoniconsName,
      description: 'Página principal de toda la documentación',
      path: '/code-docs/index.html',
      color: '#4facfe',
    },
    {
      id: 'web',
      name: 'Frontend Web',
      icon: 'globe-outline' as IoniconsName,
      description: 'Documentación de la aplicación web React',
      path: '/code-docs/web/index.html',
      color: '#667eea',
    },
    {
      id: 'backend',
      name: 'Backend API',
      icon: 'server-outline' as IoniconsName,
      description: 'Documentación de la API Node.js/Express',
      path: '/code-docs/backend/index.html',
      color: '#764ba2',
    },
    {
      id: 'mobile',
      name: 'Mobile App',
      icon: 'phone-portrait-outline' as IoniconsName,
      description: 'Documentación de la aplicación móvil React Native',
      path: '/code-docs/mobile/index.html',
      color: '#f093fb',
    },
  ];

  /**
   * Abre la documentación en el navegador externo
   * @param {DocumentationLink} doc - Objeto con la información del documento
   */
  const openDocumentation = async (doc: DocumentationLink) => {
    try {
      const fullUrl = `${baseUrl}${doc.path}`;
      const supported = await Linking.canOpenURL(fullUrl);
      
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert(
          'Error',
          `No se puede abrir la URL: ${fullUrl}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Ocurrió un error al intentar abrir la documentación. Verifica que el backend esté ejecutándose.',
        [{ text: 'OK' }]
      );
      console.error('Error opening documentation:', error);
    }
  };

  /**
   * Muestra información sobre cómo acceder a la documentación
   */
  const showInfo = () => {
    Alert.alert(
      'Acerca de la Documentación',
      `La documentación técnica está generada automáticamente con TypeDoc.\n\n` +
      `Se abrirá en tu navegador web predeterminado.\n\n` +
      `URL del servidor: ${baseUrl}\n\n` +
      `Asegúrate de que el backend esté ejecutándose para acceder a la documentación.`,
      [{ text: 'Entendido' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Documentación Técnica</Text>
        <Text style={styles.headerSubtitle}>
          Documentación generada automáticamente con TypeDoc
        </Text>
        <TouchableOpacity style={styles.infoButton} onPress={showInfo}>
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Módulos del Sistema</Text>
        
        {documentationLinks.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={[
              styles.docCard,
              selectedDoc === doc.id && styles.docCardSelected,
              { borderLeftColor: doc.color }
            ]}
            onPress={() => {
              setSelectedDoc(doc.id);
              openDocumentation(doc);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: doc.color }]}>
              <Ionicons name={doc.icon} size={28} color="#fff" />
            </View>
            
            <View style={styles.docInfo}>
              <Text style={styles.docName}>{doc.name}</Text>
              <Text style={styles.docDescription}>{doc.description}</Text>
            </View>
            
            <Ionicons name="open-outline" size={24} color={doc.color} />
          </TouchableOpacity>
        ))}

        <View style={styles.instructionsCard}>
          <Ionicons name="bulb-outline" size={24} color="#f59e0b" />
          <Text style={styles.instructionsTitle}>Instrucciones</Text>
          <Text style={styles.instructionsText}>
            • Toca cualquier módulo para abrir su documentación{'\n'}
            • La documentación se abrirá en tu navegador{'\n'}
            • Puedes navegar entre módulos desde el navegador{'\n'}
            • Para desarrollo local, configura las URLs correctas
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Para regenerar la documentación, ejecuta:{'\n'}
            <Text style={styles.codeText}>npm run docs</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  infoButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  docCardSelected: {
    backgroundColor: '#f8f9ff',
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  docDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  instructionsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
    marginTop: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 22,
  },
  footer: {
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#3730a3',
    lineHeight: 22,
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
