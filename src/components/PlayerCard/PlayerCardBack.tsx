import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayerCardBackProps {
  barcodeValue: string;
  userId: string;
  onFlip: () => void;
}

// Simple QR-like pattern generator (creates a visual barcode pattern)
function BarcodePattern({ value }: { value: string }) {
  // Generate a deterministic pattern from the value
  const pattern = [];
  for (let i = 0; i < value.length * 3; i++) {
    const charCode = value.charCodeAt(i % value.length);
    pattern.push((charCode + i) % 2 === 0);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Barcode lines */}
      <div className="flex items-end h-24 gap-[2px]">
        {pattern.map((filled, i) => (
          <div
            key={i}
            className={`w-1 transition-all ${filled ? 'bg-poker-gold' : 'bg-zinc-600'}`}
            style={{ 
              height: `${40 + (Math.sin(i * 0.5) * 20 + 20)}%`,
            }}
          />
        ))}
      </div>
      {/* QR-like square pattern */}
      <div className="grid grid-cols-8 gap-1 mt-4">
        {Array.from({ length: 64 }).map((_, i) => {
          const charSum = value.split('').reduce((sum, c, idx) => sum + c.charCodeAt(0) * (idx + 1), 0);
          const filled = ((charSum + i) * 7) % 3 !== 0;
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${filled ? 'bg-poker-gold' : 'bg-zinc-700'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function PlayerCardBack({ barcodeValue, userId, onFlip }: PlayerCardBackProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-poker-gold/40 shadow-2xl overflow-hidden">
      {/* Gold accent line at top */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-poker-gold to-transparent" />
      
      <div className="p-6 flex flex-col h-full items-center justify-center">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h3 className="text-poker-gold font-bold text-lg tracking-wider uppercase">
            Session Master
          </h3>
          <p className="text-zinc-500 text-xs tracking-widest">PLAYER ID</p>
        </div>

        {/* Barcode Pattern */}
        <div className="bg-zinc-800/50 p-6 rounded-xl border border-poker-gold/20">
          <BarcodePattern value={barcodeValue} />
        </div>

        {/* ID Display */}
        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-xs mb-1">UNIQUE PLAYER CODE</p>
          <p className="text-poker-gold font-mono text-sm tracking-wider">
            {barcodeValue}
          </p>
        </div>

        {/* User ID (truncated) */}
        <div className="mt-4 text-center">
          <p className="text-zinc-600 text-xs font-mono">
            ID: {userId.slice(0, 8)}...{userId.slice(-4)}
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Flip button */}
        <div className="w-full flex justify-end pt-4 border-t border-zinc-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={onFlip}
            className="text-poker-gold hover:text-poker-darkGold hover:bg-poker-gold/10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Flip Card
          </Button>
        </div>
      </div>
    </div>
  );
}
