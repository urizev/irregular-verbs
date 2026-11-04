import React from 'react';

interface HeartCounterProps {
  maxHearts: number;
  currentHearts: number;
  className?: string;
}

export const HeartCounter: React.FC<HeartCounterProps> = ({
  maxHearts,
  currentHearts,
  className = '',
}) => {
  const hearts = Array.from({ length: maxHearts }, (_, i) => i < currentHearts);

  return (
    <div
      className={`flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md border border-pink-100 ${className}`}
      aria-label={`Vidas restantes: ${currentHearts} de ${maxHearts}`}
      role="status"
    >
      <span className="text-sm font-fun font-bold text-pink-600 mr-1">Vidas:</span>
      {hearts.map((isAlive, idx) => (
        <span
          key={idx}
          className={`inline-block text-xl transition-all duration-300 transform ${
            isAlive
              ? 'scale-100 opacity-100 text-pink-500 animate-pulse'
              : 'scale-75 opacity-25 grayscale'
          }`}
        >
          ❤️
        </span>
      ))}
    </div>
  );
};
