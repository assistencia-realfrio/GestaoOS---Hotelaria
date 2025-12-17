import React from 'react';

interface BrandLogoProps {
  variant?: 'dark' | 'light';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'dark', className = '', size = 'md' }) => {
  const textColor = variant === 'dark' ? 'text-gray-600' : 'text-gray-100';
  const starColor = variant === 'dark' ? 'text-red-800' : 'text-red-400';
  const subTextColor = variant === 'dark' ? 'text-red-900' : 'text-red-300';
  
  // Dynamic sizing
  const textSizeClass = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }[size];

  const iconSize = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  }[size];

  const subTextSize = {
    sm: 'text-[0.4rem]',
    md: 'text-[0.5rem]',
    lg: 'text-[0.7rem]',
    xl: 'text-sm'
  }[size];

  return (
    <div className={`flex flex-col items-center select-none leading-none ${className}`}>
      <div className="flex items-center gap-3">
        <span className={`font-light tracking-tight ${textSizeClass} ${textColor}`}>Real</span>
        {/* 6-Pointed Star Icon */}
        <svg 
          width={iconSize} 
          height={iconSize} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`mb-1 ${starColor}`}
        >
          <path d="M12 3L14.5 8.5H20.5L15.5 12.5L17.5 18L12 15L6.5 18L8.5 12.5L3.5 8.5H9.5L12 3Z" />
        </svg>
        <span className={`font-light tracking-tight ${textSizeClass} ${textColor}`}>Frio</span>
      </div>
      <span className={`font-bold tracking-[0.25em] ${subTextColor} uppercase text-center mt-1 ${subTextSize}`}>
        Equipamentos Hoteleiros
      </span>
    </div>
  );
};

export default BrandLogo;