
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface SessionComment {
  id: string;
  session_id: string;
  coach_id: string;
  student_id: string;
  comment: string;
  hand_number?: number;
  created_at: string;
}

interface PlayerReview {
  id: string;
  player_id: string;
  review_type: string;
  message: string;
  session_id?: string;
  created_at: string;
  read: boolean;
}

interface CoachDashboardData {
  recentReviews: SessionComment[];
  playerReviews: PlayerReview[];
  loading: boolean;
  error: string | null;
}

export const useCoachDashboardData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CoachDashboardData>({
    recentReviews: [],
    playerReviews: [],
    loading: true,
    error: null,
  });

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) {
      setData(prev => ({ ...prev, loading: false, error: 'User not authenticated' }));
      return;
    }

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔍 Loading coach dashboard data for:', user.id);

      // Execute both queries in parallel for better performance
      const [recentReviewsResult, playerReviewsResult] = await Promise.all([
        supabase
          .from('session_comments')
          .select('*')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('player_to_coach_reviews')
          .select('*')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Handle potential errors from either query
      if (recentReviewsResult.error) {
        console.error('❌ Error loading recent reviews:', recentReviewsResult.error);
        throw new Error('Failed to load recent reviews');
      }

      if (playerReviewsResult.error) {
        console.error('❌ Error loading player reviews:', playerReviewsResult.error);
        throw new Error('Failed to load player reviews');
      }

      console.log('✅ Dashboard data loaded successfully');
      console.log('Recent reviews:', recentReviewsResult.data?.length || 0);
      console.log('Player reviews:', playerReviewsResult.data?.length || 0);

      setData({
        recentReviews: recentReviewsResult.data || [],
        playerReviews: playerReviewsResult.data || [],
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));
    }
  }, [user?.id]);

  // Mark player review as read
  const markReviewAsRead = useCallback(async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('player_to_coach_reviews')
        .update({ read: true })
        .eq('id', reviewId);

      if (error) {
        console.error('Error marking review as read:', error);
        return false;
      }

      // Update local state immediately for better UX
      setData(prev => ({
        ...prev,
        playerReviews: prev.playerReviews.map(review => 
          review.id === reviewId 
            ? { ...review, read: true }
            : review
        )
      }));

      return true;
    } catch (error) {
      console.error('Error in markReviewAsRead:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...data,
    markReviewAsRead,
    refreshData: loadDashboardData,
  };
};
