import React from 'react';
import { RotateCcw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Achievement } from '@/hooks/usePlayerCard';
import braceletImg from '@/assets/championship-bracelet.png';
import ringImg from '@/assets/championship-ring.png';
import trophyImg from '@/assets/championship-trophy.png';

interface PlayerCardBackProps {
  barcodeValue: string;
  isCoach: boolean;
  achievements: Achievement[];
  profilePicture: string | null;
  fullName: string | null;
  onFlip: () => void;
}

export function PlayerCardBack({ 
  barcodeValue, 
  isCoach,
  achievements,
  profilePicture,
  fullName,
  onFlip 
}: PlayerCardBackProps) {
  const achievementCounts = {
    trophy: achievements.filter(a => a.icon === 'trophy').length,
    ring: achievements.filter(a => a.icon === 'ring').length,
    bracelet: achievements.filter(a => a.icon === 'bracelet').length,
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-poker-gold/40 shadow-2xl overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-transparent via-poker-gold to-transparent" />
      
      <div className="p-5 flex flex-col h-full">
        {/* Header + Role */}
        <div className="text-center mb-1">
          <h3 className="text-poker-gold font-bold text-lg tracking-wider uppercase">
            Session Master ID
          </h3>
          <p className="text-zinc-400 text-sm mt-0.5">
            {isCoach ? 'Coach' : 'Player'}
          </p>
        </div>

        {/* Spacer top */}
        <div className="flex-1" />

        {/* Large Avatar */}
        <div className="flex justify-center">
          <div className="w-48 h-48 rounded-full border-[3px] border-poker-gold/60 overflow-hidden bg-zinc-800 flex items-center justify-center">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-20 h-20 text-zinc-500" />
            )}
          </div>
        </div>

        {/* Spacer bottom */}
        <div className="flex-1" />

        {/* Full name directly above achievements */}
        <div className="text-center mb-1">
          <p className="text-poker-gold font-bold text-lg">
            {fullName || 'Unknown Player'}
          </p>
        </div>

        {/* Achievements row (no title) */}
        <div className="mb-2">
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <img src={braceletImg} alt="Bracelet" className="w-7 h-7 object-contain" />
              <span className="text-poker-gold font-bold text-base mt-0.5">
                {achievementCounts.bracelet}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <img src={ringImg} alt="Ring" className="w-7 h-7 object-contain" />
              <span className="text-poker-gold font-bold text-base mt-0.5">
                {achievementCounts.ring}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <img src={trophyImg} alt="Trophy" className="w-7 h-7 object-contain" />
              <span className="text-poker-gold font-bold text-base mt-0.5">
                {achievementCounts.trophy}
              </span>
            </div>
          </div>
        </div>

        {/* Unique Player Code */}
        <div className="text-center mb-2">
          <p className="text-zinc-500 text-[8px] tracking-widest uppercase mb-0.5">Unique Player Code</p>
          <p className="text-poker-gold font-mono text-xs tracking-wider">
            {barcodeValue}
          </p>
        </div>

        {/* Flip button */}
        <div className="w-full flex justify-end pt-3 border-t border-zinc-700">
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
