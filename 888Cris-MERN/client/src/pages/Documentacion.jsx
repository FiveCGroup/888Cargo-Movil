import { useState } from 'react';
import '../styles/Documentacion.css';

/**
 * Componente de página para visualizar la documentación técnica del sistema
 * @component
 * @returns {JSX.Element} Página de documentación con iframe integrado
 */
const Documentacion = () => {
  const [selectedDoc, setSelectedDoc] = useState('index');

  const documentationLinks = [
    { id: 'index', name: 'Inicio', path: '/code-docs/index.html' },
    { id: 'web', name: 'Frontend Web', path: '/code-docs/web/index.html' },
    { id: 'backend', name: 'Backend API', path: '/code-docs/backend/index.html' },
    { id: 'mobile', name: 'Mobile App', path: '/code-docs/mobile/index.html' },
  ];

  const currentDoc = documentationLinks.find(doc => doc.id === selectedDoc);

  const isDev = import.meta.env.MODE === 'development';
  const backendBase = isDev ? 'http://localhost:4000' : '';
  // Fallback local path (served by Vite) en desarrollo
  const viteDocsBase = isDev ? '' : '';

  // En desarrollo preferimos cargar desde el frontend público si existe
  const iframeSrc = isDev ? `/tutoriales/${currentDoc.id === 'index' ? 'index.html' : currentDoc.path.split('/').pop()}`.replace('//','/') : `${backendBase}${currentDoc.path}`;

  return (
    <div className="documentacion-container">
      <iframe
        src={iframeSrc}
        title={`Documentación - ${currentDoc.name}`}
        className="documentacion-iframe-fullscreen"
      />
      <div style={{position:'absolute', right:20, bottom:20}}>
        <a href={iframeSrc} target="_blank" rel="noreferrer" style={{color:'#fff',background:'#0366d6',padding:'8px 12px',borderRadius:6,textDecoration:'none'}}>Abrir en nueva pestaña</a>
      </div>
    </div>
  );
};

export default Documentacion;
