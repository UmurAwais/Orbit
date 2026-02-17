import React from 'react';
import orbitTransparent from '../assets/orbit logo.png';
import orbitIcon from '../assets/orbit.png';

const OrbitLogo = ({ size = 40, className = "", variant = "logo" }) => {
  const isIcon = variant === "icon";
  
  return (
    <div 
      className={`relative flex items-center justify-center ${!isIcon ? '' : 'overflow-hidden rounded-full'} ${className}`} 
      style={{ width: size, height: size }}
    >
      <img 
        src={isIcon ? orbitIcon : orbitTransparent} 
        alt="Orbit Logo" 
        className={`w-full h-full ${isIcon ? 'object-cover scale-[1.4]' : 'object-contain'}`}
      />
    </div>
  );
};

export default OrbitLogo;
