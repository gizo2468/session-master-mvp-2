import React from 'react';
import { RotateCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';

interface PlayerCardBackProps {
  barcodeValue: string;
  userId: string;
  onFlip: () => void;
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

        {/* QR Code */}
        <div className="bg-zinc-800/50 p-6 rounded-xl border border-poker-gold/20">
          <QRCodeSVG
            value={`${window.location.origin}/player/${userId}`}
            size={150}
            bgColor="transparent"
            fgColor="#D4AF37"
            level="M"
          />
        </div>

        {/* Unique Player Code Display */}
        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-xs mb-1">UNIQUE PLAYER CODE</p>
          <p className="text-poker-gold font-mono text-sm tracking-wider">
            {barcodeValue}
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
