import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  title: string;
  icon?: string;
}

export interface PlayerCardData {
  id?: string;
  user_id: string;
  primary_format: 'cash' | 'tournaments' | 'both';
  specialization: string;
  improvement_goals: string;
  year_started_playing: number | null;
  achievements: Achievement[];
  poker_background: string[];
  coaching_experience: string | null;
}

export interface PlayerProfile {
  username: string | null;
  online_nickname: string | null;
}

export interface PlayerPrivateData {
  full_name: string | null;
  profile_picture: string | null;
}

export function usePlayerCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cardData, setCardData] = useState<PlayerCardData | null>(null);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [privateData, setPrivateData] = useState<PlayerPrivateData | null>(null);

  // Calculate years of experience
  const yearsOfExperience = cardData?.year_started_playing 
    ? new Date().getFullYear() - cardData.year_started_playing 
    : null;

  // Generate unique barcode string from user ID
  const barcodeValue = user?.id ? `SMPLAYER-${user.id.slice(0, 8).toUpperCase()}` : '';

  // Detect first-time user (no profile data set yet)
  const isFirstTimeUser = !cardData?.poker_background?.length && 
                          (!cardData?.achievements || cardData.achievements.length === 0) &&
                          !privateData?.full_name;

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      const [cardResult, profileResult, privateResult] = await Promise.all([
        supabase
          .from('player_cards')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('username, online_nickname')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_private_data')
          .select('full_name, profile_picture')
          .eq('id', user.id)
          .single()
      ]);

      if (cardResult.data) {
        const data = cardResult.data;
        setCardData({
          id: data.id,
          user_id: data.user_id,
          primary_format: (data.primary_format as 'cash' | 'tournaments' | 'both') || 'both',
          specialization: data.specialization || '',
          improvement_goals: data.improvement_goals || '',
          year_started_playing: data.year_started_playing,
          achievements: Array.isArray(data.achievements) ? (data.achievements as unknown as Achievement[]) : [],
          poker_background: Array.isArray(data.poker_background) ? data.poker_background : [],
          coaching_experience: data.coaching_experience || null
        });
      } else {
        // Create default card data
        setCardData({
          user_id: user.id,
          primary_format: 'both',
          specialization: '',
          improvement_goals: '',
          year_started_playing: null,
          achievements: [],
          poker_background: [],
          coaching_experience: null
        });
      }

      if (profileResult.data) {
        setProfile(profileResult.data);
      }

      if (privateResult.data) {
        setPrivateData(privateResult.data);
      }
    } catch (error) {
      console.error('Error fetching player card data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateCardData = useCallback(async (updates: Partial<PlayerCardData>) => {
    if (!user?.id || !cardData) return;

    setIsSaving(true);
    try {
      const updatedData = { ...cardData, ...updates };
      
      const { error } = await supabase
        .from('player_cards')
        .upsert([{
          user_id: user.id,
          primary_format: updatedData.primary_format,
          specialization: updatedData.specialization || null,
          improvement_goals: updatedData.improvement_goals || null,
          year_started_playing: updatedData.year_started_playing,
          achievements: JSON.parse(JSON.stringify(updatedData.achievements)),
          poker_background: updatedData.poker_background || [],
          coaching_experience: updatedData.coaching_experience || null
        }], { onConflict: 'user_id' });

      if (error) throw error;

      setCardData(updatedData);
    } catch (error) {
      console.error('Error updating player card:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, cardData, toast]);

  const updatePrivateData = useCallback(async (updates: Partial<PlayerPrivateData>) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_private_data')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setPrivateData(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating private data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, toast]);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updatePrivateData({ profile_picture: publicUrl });

      toast({
        title: 'Photo updated',
        description: 'Your profile photo has been saved'
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload photo. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, updatePrivateData, toast]);

  return {
    isLoading,
    isSaving,
    cardData,
    profile,
    privateData,
    yearsOfExperience,
    barcodeValue,
    userId: user?.id || '',
    updateCardData,
    updatePrivateData,
    uploadPhoto,
    refetch: fetchData,
    isFirstTimeUser
  };
}
