import React from 'react'
import '../styles/pages/LoadingSpiner.css'

/**
 * @param {string} message
 * @param {string} size 
 */

const LoadingSpinner = ({message = 'Cargando...', size = 'medium'}) => {
    return (
        <div className = {`loadingSpinner-container loading-${size}`}>
            <div className = 'spinner'></div>
            <p className = 'loading-message'>{message}</p>
        </div>
    );
}

export default LoadingSpinner;