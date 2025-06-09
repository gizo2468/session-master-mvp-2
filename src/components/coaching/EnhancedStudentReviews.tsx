
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Review {
  id: string;
  session_id: string;
  coach_id: string;
  student_id: string;
  comment: string;
  hand_number?: number;
  review_type: string;
  review_category: string;
  star_rating?: number;
  is_read: boolean;
  created_at: string;
  associated_hands?: AssociatedHand[];
}

interface AssociatedHand {
  hand_id: string;
  hand_number: number | null;
  position: string | null;
  hole_cards: string | null;
  amount_won: number;
  amount_invested: number;
}

export const EnhancedStudentReviews = ({ studentId }: { studentId: string }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadReviews();
  }, [studentId, user?.id]);

  const loadReviews = async () => {
    if (!user?.id || !studentId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Loading enhanced reviews for student:', studentId);
      
      // Load reviews with all new fields
      const { data: comments, error } = await supabase
        .from('session_comments')
        .select('*')
        .eq('student_id', studentId)
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading reviews:', error);
        return;
      }

      // For each review, load associated hands
      const reviewsWithHands = await Promise.all(
        (comments || []).map(async (comment) => {
          const { data: handAssociations, error: handsError } = await supabase
            .from('review_hand_associations')
            .select(`
              hand_id,
              session_hands!inner(
                hand_number,
                position,
                hole_cards,
                amount_won,
                amount_invested
              )
            `)
            .eq('review_id', comment.id);

          if (handsError) {
            console.error('❌ Error loading hand associations:', handsError);
          }

          const associatedHands: AssociatedHand[] = (handAssociations || []).map(assoc => ({
            hand_id: assoc.hand_id,
            hand_number: assoc.session_hands.hand_number,
            position: assoc.session_hands.position,
            hole_cards: assoc.session_hands.hole_cards,
            amount_won: assoc.session_hands.amount_won,
            amount_invested: assoc.session_hands.amount_invested,
          }));

          return {
            ...comment,
            associated_hands: associatedHands,
          };
        })
      );

      console.log('✅ Enhanced reviews loaded:', reviewsWithHands);
      setReviews(reviewsWithHands);
    } catch (error) {
      console.error('❌ Error in loadReviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('session_comments')
        .update({ is_read: true })
        .eq('id', reviewId);

      if (error) {
        console.error('❌ Error marking review as read:', error);
        return;
      }

      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, is_read: true } : review
      ));
    } catch (error) {
      console.error('❌ Error in markAsRead:', error);
    }
  };
  
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !search || review.comment.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || review.review_category === categoryFilter;
    const matchesReadStatus = filter === 'all' || 
      (filter === 'unread' && !review.is_read) || 
      (filter === 'read' && review.is_read);
    
    return matchesSearch && matchesCategory && matchesReadStatus;
  });
  
  const handleNavigateToSession = (sessionId: string, handNumber?: number) => {
    try {
      if (handNumber) {
        navigate(`/coach/student/${studentId}/session/${sessionId}?handId=hand-${handNumber}`);
      } else {
        navigate(`/coach/student/${studentId}/session/${sessionId}`);
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const renderStarRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            size={12}
            className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}
            fill={star <= rating ? 'currentColor' : 'none'}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating}/5</span>
      </div>
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'improvement': return 'bg-orange-100 text-orange-700';
      case 'strength': return 'bg-green-100 text-green-700';
      case 'question': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Archive" />
            <span>Review Archive</span>
            {reviews.filter(r => !r.is_read).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reviews.filter(r => !r.is_read).length} unread
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Input
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
              <Icon name="Search" className="absolute left-2 top-2.5 text-gray-400" size={16} />
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {loading ? (
            <div className="text-center py-6 text-gray-500">
              <Icon name="Loader" className="mx-auto mb-2 h-8 w-8 animate-spin" />
              <p>Loading reviews...</p>
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="space-y-3">
              {filteredReviews.map(review => (
                <div 
                  key={review.id} 
                  className={`border rounded-md p-3 ${!review.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Session {review.session_id.slice(-8)}
                        {review.hand_number && <span className="text-gray-500"> • Hand {review.hand_number}</span>}
                      </span>
                      <Badge className={getCategoryColor(review.review_category)} variant="secondary">
                        {review.review_category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {review.review_type}
                      </Badge>
                      {!review.is_read && (
                        <Badge variant="destructive" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStarRating(review.star_rating)}
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleNavigateToSession(review.session_id, review.hand_number)}
                        className="h-7 w-7 p-0 rounded-full flex items-center justify-center"
                        aria-label="View session"
                      >
                        <Icon name="ExternalLink" size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm my-2">{review.comment}</p>
                  
                  {review.associated_hands && review.associated_hands.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Associated Hands ({review.associated_hands.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {review.associated_hands.map(hand => (
                          <div key={hand.hand_id} className="bg-gray-100 rounded px-2 py-1 text-xs">
                            <span className="font-medium">Hand #{hand.hand_number || 'N/A'}</span>
                            {hand.position && <span className="text-gray-600"> ({hand.position})</span>}
                            {hand.hole_cards && <span className="text-gray-600"> - {hand.hole_cards}</span>}
                            <span className={`ml-1 ${(hand.amount_won - hand.amount_invested) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(hand.amount_won - hand.amount_invested) >= 0 ? '+' : ''}
                              ${(hand.amount_won - hand.amount_invested).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-xs text-gray-500">
                      Coach review
                    </div>
                    {!review.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(review.id)}
                        className="h-7 text-xs"
                      >
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Icon name="MessageSquare" className="mx-auto mb-2 h-8 w-8" />
              <p>No reviews found.</p>
              <p className="text-sm mt-2">
                {search || filter !== 'all' || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters.' 
                  : 'Reviews will appear here when coaches provide feedback.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
