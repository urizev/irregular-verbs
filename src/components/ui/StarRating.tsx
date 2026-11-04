import React from 'react';

interface StarRatingProps {
  stars: number; // 0 to 3
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  stars,
  maxStars = 3,
  size = 'md',
  className = '',
}) => {
  const sizeClass = {
    sm: 'text-base gap-0.5',
    md: 'text-2xl gap-1',
    lg: 'text-4xl gap-2',
    xl: 'text-6xl gap-3',
  }[size];

  const starArray = Array.from({ length: maxStars }, (_, i) => i < stars);

  return (
    <div
      className={`inline-flex items-center ${sizeClass} ${className}`}
      aria-label={`${stars} de ${maxStars} estrellas`}
    >
      {starArray.map((filled, idx) => (
        <span
          key={idx}
          className={`transition-all duration-300 transform inline-block ${
            filled
              ? 'text-amber-400 drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)] scale-110'
              : 'text-slate-300 grayscale opacity-40 scale-90'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
};
