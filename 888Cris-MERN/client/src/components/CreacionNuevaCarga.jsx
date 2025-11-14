import React from 'react';
import '../styles/global/buttons.css';

const CreacionNuevaCarga = ({ 
    onDescargarFormato, 
    onSubirArchivo, 
    onGuardarCarga, 
    onGuardarPackingList,
    loading, 
    datosExcel, 
    codigoCarga 
}) => {
    return (
        <div>
            <h3>Crear Nuevo Packing List</h3>
            <div>
                <button className="btn btn-outline" onClick={onDescargarFormato} disabled={loading}>
                    <i className="fas fa-file-download btn-icon"></i>
                    {loading ? 'Descargando...' : 'Descargar formato packing list'}
                </button>
                <button className="btn btn-primary" onClick={onSubirArchivo} disabled={loading}>
                    <i className="fas fa-cloud-upload-alt btn-icon"></i>
                    {loading ? 'Procesando...' : 'Subir packing list'}
                </button>
                {datosExcel.length > 0 && (
                    <button className="btn btn-success" onClick={onGuardarPackingList} disabled={loading}>
                        <i className="fas fa-save btn-icon"></i>
                        Guardar como Packing List
                    </button>
                )}
            </div>
        </div>
    );
};

export default CreacionNuevaCarga;
