import React, { useEffect, useState } from 'react';
import { Button } from './Button';

interface CountdownBarProps {
  durationSeconds?: number;
  onComplete: () => void;
  className?: string;
}

export const CountdownBar: React.FC<CountdownBarProps> = ({
  durationSeconds = 3.5,
  onComplete,
  className = '',
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const durationMs = durationSeconds * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onComplete();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [durationSeconds, onComplete]);

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-4 w-full ${className}`}>
      <div className="flex-1 w-full bg-red-100 rounded-full h-3 overflow-hidden border border-red-200">
        <div
          className="bg-red-500 h-full rounded-full transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
      <Button variant="accent" size="md" onClick={onComplete} className="w-full sm:w-auto">
        Continuar ➔
      </Button>
    </div>
  );
};
