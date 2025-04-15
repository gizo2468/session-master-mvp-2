
import React from 'react';
import { Focus } from '@/components/Icons';

export default function FocusModeButton() {
  return (
    <button
      className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-poker-gold shadow-lg flex items-center justify-center"
      aria-label="Focus mode"
    >
      <Focus />
    </button>
  );
}
