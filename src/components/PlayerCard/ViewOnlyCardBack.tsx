import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerCardBack } from './PlayerCardBack';
import { supabase } from '@/integrations/supabase/client';
import { resolveProfilePicture, Achievement } from '@/hooks/usePlayerCard';
import Icon from '@/components/ui/Lucide';

interface ViewOnlyCardBackProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewOnlyCardBack({ userId, open, onOpenChange }: ViewOnlyCardBackProps) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('student');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, privateRes, cardRes] = await Promise.all([
          supabase.from('profiles').select('role, created_at').eq('id', userId).single(),
          supabase.from('user_private_data').select('full_name, profile_picture').eq('id', userId).single(),
          supabase.from('player_cards').select('achievements').eq('user_id', userId).single(),
        ]);

        setRole(profileRes.data?.role || 'student');
        setCreatedAt(profileRes.data?.created_at || null);
        setFullName(privateRes.data?.full_name || null);
        setProfilePicture(resolveProfilePicture(privateRes.data?.profile_picture || null));

        if (cardRes.data?.achievements && Array.isArray(cardRes.data.achievements)) {
          setAchievements(cardRes.data.achievements as unknown as Achievement[]);
        } else {
          setAchievements([]);
        }
      } catch (err) {
        console.error('ViewOnlyCardBack fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, userId]);

  if (!open) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onOpenChange(false);
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClose}
    >
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-white hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div
        className="w-[320px] aspect-[3/4]"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="Loader" className="h-8 w-8 animate-spin text-poker-gold" />
          </div>
        ) : (
          <PlayerCardBack
            memberSince={createdAt}
            isCoach={role === 'coach'}
            achievements={achievements}
            profilePicture={profilePicture}
            fullName={fullName}
            onFlip={handleClose}
          />
        )}
      </div>
    </div>
  );
}
