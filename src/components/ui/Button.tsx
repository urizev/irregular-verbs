import React from 'react';
import { audioService } from '../../services/audioService';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'success' | 'heart' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  playSound?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  playSound = true,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (playSound && !disabled) {
      audioService.playClick();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles =
    'font-fun font-bold select-none transition-all duration-150 inline-flex items-center justify-center rounded-2xl active:translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm shadow-bouncy',
    md: 'px-5 py-2.5 text-base shadow-bouncy',
    lg: 'px-7 py-3.5 text-lg shadow-bouncy',
    xl: 'px-8 py-4 text-xl shadow-bouncy',
  }[size];

  const variantStyles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-bouncy-primary active:shadow-bouncy-active focus-visible:ring-indigo-400',
    accent:
      'bg-amber-500 hover:bg-amber-400 text-white shadow-bouncy-accent active:shadow-bouncy-active focus-visible:ring-amber-400',
    success:
      'bg-emerald-500 hover:bg-emerald-400 text-white shadow-bouncy-success active:shadow-bouncy-active focus-visible:ring-emerald-400',
    heart:
      'bg-pink-500 hover:bg-pink-400 text-white shadow-bouncy-heart active:shadow-bouncy-active focus-visible:ring-pink-400',
    secondary:
      'bg-slate-200 hover:bg-slate-100 text-slate-800 shadow-bouncy active:shadow-bouncy-active focus-visible:ring-slate-400',
    outline:
      'bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-700 shadow-bouncy active:shadow-bouncy-active focus-visible:ring-slate-400',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
