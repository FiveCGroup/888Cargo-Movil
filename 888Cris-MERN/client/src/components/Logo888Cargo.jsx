import React, { useState } from 'react';
import logo888Cargo from '../assets/images/888cargo-logo.png';

const Logo888Cargo = ({ 
  variant = 'default', 
  size = 'medium',
  showText = true,
  className = '',
  style = {}
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    small: { width: '120px', height: 'auto' },
    medium: { width: '160px', height: 'auto' },
    large: { width: '200px', height: 'auto' },
    xlarge: { width: '240px', height: 'auto' }
  };

  const logoStyle = {
    ...sizeMap[size],
    objectFit: 'contain',
    filter: variant === 'white' ? 'brightness(0) invert(1)' : 'none',
    ...style
  };

  const fallbackStyle = {
    fontSize: size === 'small' ? '18px' : size === 'medium' ? '24px' : '32px',
    fontWeight: '900',
    fontFamily: 'Arial Black, sans-serif',
    color: variant === 'white' ? 'white' : 'var(--brand-primary)',
    display: 'flex',
    alignItems: 'center',
    height: sizeMap[size].width === '120px' ? '48px' : sizeMap[size].width === '160px' ? '64px' : '80px'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`logo-888cargo ${className}`} style={{ display: 'flex', alignItems: 'center', ...style }}>
      {!imageError ? (
        <img 
          src={logo888Cargo} 
          alt="888Cargo - Soluciones de Logística Internacional" 
          style={logoStyle}
          onError={handleImageError}
        />
      ) : (
        <div style={fallbackStyle}>
          888CARGO
        </div>
      )}
      {showText && (
        <div style={{ 
          marginLeft: '10px', 
          color: variant === 'white' ? 'rgba(255,255,255,0.9)' : 'var(--brand-primary)',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          Logística Internacional
        </div>
      )}
    </div>
  );
};

export default Logo888Cargo;
