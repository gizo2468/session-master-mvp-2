import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = "https://wfmvvpbpuqbzidptxbqx.supabase.co";

/** Build a public URL for a file in the avatars bucket, with optional cache-bust */
export function buildAvatarPublicUrl(filePath: string, cacheBust = false): string {
  const base = `${SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;
  return cacheBust ? `${base}?t=${Date.now()}` : base;
}

/** Resolve a profile_picture value to a displayable URL.
 *  - If it's already a full URL, return as-is (backward compat).
 *  - If it's a relative path like "userId/avatar.jpg", build the public URL. */
function resolveProfilePicture(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith('http')) return value;
  return buildAvatarPublicUrl(value);
}
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
  role: string;
  country: string | null;
  default_currency: string | null;
  created_at: string;
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
  const [activeStudentsCount, setActiveStudentsCount] = useState<number>(0);

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
          .select('username, online_nickname, role, country, default_currency, created_at')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_private_data')
          .select('full_name, profile_picture')
          .eq('id', user.id)
          .single()
      ]);

      // If user is a coach, fetch active students count
      if (profileResult.data?.role === 'coach') {
        const { count } = await supabase
          .from('coach_student_connections')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', user.id)
          .eq('status', 'approved');
        setActiveStudentsCount(count || 0);
      }

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
        setProfile({
          username: profileResult.data.username,
          online_nickname: profileResult.data.online_nickname,
          role: profileResult.data.role,
          country: profileResult.data.country ?? null,
          default_currency: profileResult.data.default_currency ?? null,
          created_at: profileResult.data.created_at,
        });
      }

      if (privateResult.data) {
        setPrivateData({
          ...privateResult.data,
          profile_picture: resolveProfilePicture(privateResult.data.profile_picture),
        });
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

  const updateProfile = useCallback(async (updates: Partial<{ country: string; default_currency: string }>) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
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
      const filePath = `${user.id}/avatar.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Store the relative path in DB
      const { error: dbError } = await supabase
        .from('user_private_data')
        .update({ profile_picture: filePath })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Update local state with public URL + cache-bust for immediate display
      setPrivateData(prev => prev ? { ...prev, profile_picture: buildAvatarPublicUrl(filePath, true) } : null);

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
  }, [user?.id, toast]);

  const uploadPhotoFromDataUrl = useCallback(async (dataUrl: string) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Convert base64 data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Store the relative path in DB
      const { error: dbError } = await supabase
        .from('user_private_data')
        .update({ profile_picture: filePath })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Update local state with public URL + cache-bust for immediate display
      setPrivateData(prev => prev ? { ...prev, profile_picture: buildAvatarPublicUrl(filePath, true) } : null);

      toast({
        title: 'Photo updated',
        description: 'Your profile photo has been saved'
      });
    } catch (error) {
      console.error('Error uploading photo from data URL:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload photo. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, toast]);

  return {
    isLoading,
    isSaving,
    cardData,
    profile,
    privateData,
    yearsOfExperience,
    barcodeValue,
    userId: user?.id || '',
    activeStudentsCount,
    updateCardData,
    updatePrivateData,
    updateProfile,
    uploadPhoto,
    uploadPhotoFromDataUrl,
    refetch: fetchData,
    isFirstTimeUser
  };
}
