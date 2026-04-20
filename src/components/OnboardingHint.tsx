import React, { useEffect, useState } from 'react';
import { Hand } from 'lucide-react';

interface OnboardingHintProps {
  onDismiss: () => void;
}

export default function OnboardingHint({ onDismiss }: OnboardingHintProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Fade in
    const inTimer = setTimeout(() => setVisible(true), 50);
    // Auto fade out after 4s
    const outTimer = setTimeout(() => handleDismiss(), 4000);
    return () => {
      clearTimeout(inTimer);
      clearTimeout(outTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    if (fadingOut) return;
    setFadingOut(true);
    setVisible(false);
    setTimeout(() => onDismiss(), 500);
  };

  return (
    <div
      onClick={handleDismiss}
      onTouchStart={handleDismiss}
      className="fixed inset-0 z-40 pointer-events-auto"
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8 flex flex-col items-center gap-2 transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Hand
          className="text-primary drop-shadow-[0_2px_8px_rgba(218,165,32,0.6)] animate-tap-hint"
          size={44}
          strokeWidth={2}
        />
        <span className="text-sm font-medium text-primary bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
          Tap here to start
        </span>
      </div>
    </div>
  );
}
