import React from 'react';
import orbitTransparent from '../assets/orbit logo.png';
import orbitIcon from '../assets/orbit.png';

const OrbitLogo = ({ size = 40, className = "", variant = "logo", theme = "color" }) => {
  const isIcon = variant === "icon";
  const isMonochrome = theme === "monochrome";
  
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
    >
      <img 
        src={isIcon ? orbitIcon : orbitTransparent} 
        alt="Orbit Logo" 
        className={`w-full h-full object-contain ${isMonochrome ? 'brightness-0 opacity-80' : ''}`}
      />
    </div>
  );
};

export default OrbitLogo;
