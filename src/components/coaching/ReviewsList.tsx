
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface TableReview {
  id: string;
  message: string;
  created_at: string;
  table_id: string;
  coach_name: string;
}

interface HandReview {
  id: string;
  message: string;
  created_at: string;
  hand_id: string;
  coach_name: string;
}

interface ReviewsListProps {
  sessionId: string;
  studentId: string;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ sessionId, studentId }) => {
  const [tableReviews, setTableReviews] = useState<TableReview[]>([]);
  const [handReviews, setHandReviews] = useState<HandReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadReviews();
    
    // Set up real-time subscriptions for review updates
    const tableReviewsChannel = supabase
      .channel(`table-reviews-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coach_to_table_reviews',
        filter: `session_id=eq.${sessionId}`
      }, () => loadReviews())
      .subscribe();

    const handReviewsChannel = supabase
      .channel(`hand-reviews-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'coach_to_hand_reviews',
        filter: `session_id=eq.${sessionId}`
      }, () => loadReviews())
      .subscribe();

    return () => {
      supabase.removeChannel(tableReviewsChannel);
      supabase.removeChannel(handReviewsChannel);
    };
  }, [sessionId]);

  const loadReviews = async () => {
    try {
      setLoading(true);

      // Load table reviews with separate coach query
      const { data: tableReviewsData, error: tableError } = await supabase
        .from('coach_to_table_reviews')
        .select('id, message, created_at, table_id, coach_id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (!tableError && tableReviewsData) {
        // Fetch coach names separately
        const coachIds = [...new Set(tableReviewsData.map(review => review.coach_id))];
        const { data: coachesData, error: coachError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', coachIds);

        if (!coachError && coachesData) {
          const coachMap = new Map(coachesData.map(coach => [coach.id, coach.full_name]));
          const enrichedTableReviews = tableReviewsData.map(review => ({
            id: review.id,
            message: review.message,
            created_at: review.created_at,
            table_id: review.table_id,
            coach_name: coachMap.get(review.coach_id) || 'Coach'
          }));
          setTableReviews(enrichedTableReviews);
        }
      }

      // Load hand reviews with separate coach query
      const { data: handReviewsData, error: handError } = await supabase
        .from('coach_to_hand_reviews')
        .select('id, message, created_at, hand_id, coach_id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (!handError && handReviewsData) {
        // Fetch coach names separately
        const coachIds = [...new Set(handReviewsData.map(review => review.coach_id))];
        const { data: coachesData, error: coachError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', coachIds);

        if (!coachError && coachesData) {
          const coachMap = new Map(coachesData.map(coach => [coach.id, coach.full_name]));
          const enrichedHandReviews = handReviewsData.map(review => ({
            id: review.id,
            message: review.message,
            created_at: review.created_at,
            hand_id: review.hand_id,
            coach_name: coachMap.get(review.coach_id) || 'Coach'
          }));
          setHandReviews(enrichedHandReviews);
        }
      }

    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">
            <Icon name="Loader" className="mx-auto mb-2 h-6 w-6 animate-spin" />
            <p>Loading reviews...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalReviews = tableReviews.length + handReviews.length;

  if (totalReviews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="MessageSquare" />
            <span>Coach Reviews</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Icon name="MessageSquare" className="mx-auto mb-3 h-8 w-8" />
            <p className="text-sm">No reviews have been left for this session yet.</p>
            <p className="text-xs mt-2 text-gray-400">
              Coach feedback on tables and hands will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="MessageSquare" />
          <span>Coach Reviews ({totalReviews})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Reviews */}
          {tableReviews.map(review => (
            <div key={review.id} className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Icon name="Layers" size={12} className="mr-1" />
                  Table Review
                </Badge>
                <span className="text-sm text-gray-600">
                  by {review.coach_name}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-800">{review.message}</p>
            </div>
          ))}

          {/* Hand Reviews */}
          {handReviews.map(review => (
            <div key={review.id} className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Icon name="Spade" size={12} className="mr-1" />
                  Hand Review
                </Badge>
                <span className="text-sm text-gray-600">
                  by {review.coach_name}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-800">{review.message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
