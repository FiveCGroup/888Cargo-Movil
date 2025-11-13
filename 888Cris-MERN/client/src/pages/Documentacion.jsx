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

  return (
    <div className="documentacion-container">
      <iframe
        src={currentDoc.path}
        title={`Documentación - ${currentDoc.name}`}
        className="documentacion-iframe-fullscreen"
      />
    </div>
  );
};

export default Documentacion;
