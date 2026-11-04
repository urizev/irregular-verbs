import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border-4 border-indigo-100 transform transition-all animate-scale-up ${className}`}
      >
        {title && (
          <h2 id="modal-title" className="text-2xl font-fun font-bold text-slate-800 text-center mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};
