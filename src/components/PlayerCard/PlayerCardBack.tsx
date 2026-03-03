import React from 'react';
import { RotateCcw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Achievement } from '@/hooks/usePlayerCard';
import braceletImg from '@/assets/championship-bracelet.png';
import ringImg from '@/assets/championship-ring.png';
import trophyImg from '@/assets/championship-trophy.png';

interface PlayerCardBackProps {
  barcodeValue: string;
  primaryFormat: 'cash' | 'tournaments' | 'both' | null;
  isCoach: boolean;
  coachingExperience: string | null;
  activeStudentsCount: number;
  achievements: Achievement[];
  profilePicture: string | null;
  onFlip: () => void;
}

function getFormatLabel(format: 'cash' | 'tournaments' | 'both' | null): string {
  switch (format) {
    case 'cash':
      return 'Cash Games';
    case 'tournaments':
      return 'Tournaments';
    case 'both':
    default:
      return 'Cash & MTT';
  }
}

function getCoachingExperienceLabel(experience: string | null): string {
  switch (experience) {
    case '1-5':
      return '1–5 Years';
    case '5-10':
      return '5–10 Years';
    case '10+':
      return '10+ Years';
    default:
      return '';
  }
}

export function PlayerCardBack({ 
  barcodeValue, 
  primaryFormat,
  isCoach,
  coachingExperience,
  activeStudentsCount,
  achievements,
  profilePicture,
  onFlip 
}: PlayerCardBackProps) {
  // Count achievements by type
  const achievementCounts = {
    trophy: achievements.filter(a => a.icon === 'trophy').length,
    ring: achievements.filter(a => a.icon === 'ring').length,
    bracelet: achievements.filter(a => a.icon === 'bracelet').length,
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-poker-gold/40 shadow-2xl overflow-hidden">
      {/* Gold accent line at top */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-poker-gold to-transparent" />
      
      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="text-center mb-3">
          <h3 className="text-poker-gold font-bold text-lg tracking-wider uppercase">
            Session Master ID
          </h3>
          <p className="text-zinc-500 text-xs tracking-widest">CAREER SNAPSHOT</p>
        </div>

        {/* Large Avatar */}
        <div className="flex justify-center mb-3">
          <div className="w-20 h-20 rounded-full border-2 border-poker-gold/60 overflow-hidden bg-zinc-800 flex items-center justify-center">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-zinc-500" />
            )}
          </div>
        </div>

        {/* Playing Focus */}
        <div className="mb-3">
          <p className="text-zinc-500 text-[10px] tracking-widest uppercase mb-1.5">Playing Focus</p>
          <div className="inline-block px-3 py-1.5 rounded-full border border-poker-gold/30 bg-zinc-800/50">
            <span className="text-poker-gold text-sm font-medium">
              {getFormatLabel(primaryFormat)}
            </span>
          </div>
        </div>

        {/* Coach Information - Only for coaches */}
        {isCoach && (
          <div className="mb-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
            <p className="text-zinc-500 text-[10px] tracking-widest uppercase mb-2">Coach Info</p>
            
            {coachingExperience && (
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2.5 py-1 rounded-md bg-poker-gold/10 border border-poker-gold/30">
                  <span className="text-poker-gold text-xs font-medium">
                    {getCoachingExperienceLabel(coachingExperience)}
                  </span>
                </div>
              </div>
            )}
            
            <p className="text-zinc-400 text-sm">
              Coaching <span className="text-poker-gold font-semibold">{activeStudentsCount}</span> player{activeStudentsCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Achievements Summary - Always visible */}
        <div className="mb-3">
          <p className="text-zinc-500 text-[10px] tracking-widest uppercase mb-2">Achievements</p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <img src={braceletImg} alt="Bracelet" className="w-10 h-10 object-contain" />
              <span className="text-poker-gold font-bold text-lg mt-1">
                {achievementCounts.bracelet}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <img src={ringImg} alt="Ring" className="w-10 h-10 object-contain" />
              <span className="text-poker-gold font-bold text-lg mt-1">
                {achievementCounts.ring}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <img src={trophyImg} alt="Trophy" className="w-10 h-10 object-contain" />
              <span className="text-poker-gold font-bold text-lg mt-1">
                {achievementCounts.trophy}
              </span>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Unique Player Code */}
        <div className="text-center mb-4">
          <p className="text-zinc-500 text-[10px] tracking-widest uppercase mb-1">Unique Player Code</p>
          <p className="text-poker-gold font-mono text-sm tracking-wider">
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
