import React from 'react';

export type MascotMood = 'happy' | 'celebrate' | 'sad' | 'thinking';

interface MascotProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({ mood = 'happy', size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-40 h-40',
    xl: 'w-52 h-52',
  }[size];

  return (
    <div className={`inline-flex items-center justify-center select-none ${sizeMap} ${className}`}>
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
        {/* Cuerpo / Cabeza redonda amigable */}
        <circle cx="60" cy="60" r="48" fill="#FBBF24" stroke="#D97706" strokeWidth="4" />

        {/* Mejillas sonrosadas */}
        <circle cx="34" cy="68" r="8" fill="#F87171" opacity="0.6" />
        <circle cx="86" cy="68" r="8" fill="#F87171" opacity="0.6" />

        {/* Ojos según el estado de ánimo */}
        {mood === 'celebrate' && (
          <>
            {/* Ojos de estrella brillantes */}
            <path
              d="M38 48 L41 54 L47 55 L42 59 L44 65 L38 62 L32 65 L34 59 L29 55 L35 54 Z"
              fill="#4338CA"
            />
            <path
              d="M82 48 L85 54 L91 55 L86 59 L88 65 L82 62 L76 65 L78 59 L73 55 L79 54 Z"
              fill="#4338CA"
            />
            {/* Sombrero de fiesta */}
            <polygon points="60,10 45,35 75,35" fill="#EC4899" stroke="#BE185D" strokeWidth="2" />
            <circle cx="60" cy="10" r="4" fill="#FDE047" />
          </>
        )}

        {mood === 'happy' && (
          <>
            {/* Ojos sonrientes cerrados */}
            <path
              d="M28 52 Q38 40 48 52"
              fill="none"
              stroke="#1E293B"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M72 52 Q82 40 92 52"
              fill="none"
              stroke="#1E293B"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        )}

        {mood === 'thinking' && (
          <>
            {/* Ojos abiertos curiosos */}
            <circle cx="38" cy="50" r="6" fill="#1E293B" />
            <circle cx="82" cy="50" r="6" fill="#1E293B" />
            <circle cx="40" cy="48" r="2" fill="#FFFFFF" />
            <circle cx="84" cy="48" r="2" fill="#FFFFFF" />
          </>
        )}

        {mood === 'sad' && (
          <>
            {/* Ojos comprensivos con lágrima pequeña */}
            <circle cx="38" cy="52" r="5" fill="#1E293B" />
            <circle cx="82" cy="52" r="5" fill="#1E293B" />
            {/* Cejas caídas */}
            <path d="M30 42 Q38 46 46 44" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <path d="M74 44 Q82 46 90 42" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            {/* Lagrimita */}
            <path d="M88 62 Q92 70 88 74 Q84 70 88 62" fill="#38BDF8" />
          </>
        )}

        {/* Boca según estado */}
        {mood === 'celebrate' && (
          <path
            d="M40 70 Q60 96 80 70 Z"
            fill="#EF4444"
            stroke="#1E293B"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}

        {mood === 'happy' && (
          <path
            d="M42 68 Q60 88 78 68"
            fill="none"
            stroke="#1E293B"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {mood === 'thinking' && (
          <ellipse cx="60" cy="74" rx="6" ry="8" fill="#1E293B" />
        )}

        {mood === 'sad' && (
          <path
            d="M44 80 Q60 68 76 80"
            fill="none"
            stroke="#1E293B"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
