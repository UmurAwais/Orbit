import React from 'react';

const OrbitLogo = ({ size = 40, className = "" }) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
    >
      {/* The main Ring (Orbit) */}
      <div className="absolute inset-0 rounded-full border-[#2A2A2A] shadow-inner" 
           style={{ borderWidth: Math.max(2, size * 0.22) }}>
      </div>
      
      {/* The White Sphere (Bottom-Left) */}
      <div 
        className="absolute rounded-full bg-white shadow-lg"
        style={{ 
          width: size * 0.32, 
          height: size * 0.32,
          bottom: '15%',
          left: '15%',
          background: 'radial-gradient(circle at 30% 30%, #ffffff, #d1d1d1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(0,0,0,0.2)'
        }}
      />
      
      {/* The Grey Sphere (Top-Right) */}
      <div 
        className="absolute rounded-full bg-[#4A4A4A]"
        style={{ 
          width: size * 0.22, 
          height: size * 0.22,
          top: '25%',
          right: '25%',
          background: 'radial-gradient(circle at 30% 30%, #666666, #2a2a2a)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
};

export default OrbitLogo;
