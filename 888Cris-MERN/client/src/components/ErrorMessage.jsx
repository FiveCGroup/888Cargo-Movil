import React from 'react';
import '../styles/components/ErrorMessage.css';

/**
 * @param {string} message
 * @param {function|null} onRetry 
 * @param {string} type
 * @param {boolean} showIcon
 * 
 */

const ErrorMessage = ({
    message,
    onRetry = null,
    type = 'error',
    showIcon = true
}) => {
    const icons = {
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    return (
        <div className={`error-message error-${type}`}>{message}
            {showIcon && (
                <div className='error-icon'>
                    {icons[type]}
                </div>
            )}
            <div className='error-content'>
                <p className='error-text'>{message}</p>
                {onRetry && (
                    <button className='error-retry-btn' onClick={onRetry}>Reintentar</button>
                )}
            </div>
        </div>
    );
};

export default ErrorMessage;
