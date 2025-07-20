import { useState, useEffect, useCallback } from 'react';
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

      // Note: Mock data since review tables don't exist yet
      console.log('📋 Using mock data - review system not implemented yet');
      
      setData({
        recentReviews: [],
        playerReviews: [],
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
      // Note: Review system not implemented yet
      console.log('📋 Review system not implemented yet');
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