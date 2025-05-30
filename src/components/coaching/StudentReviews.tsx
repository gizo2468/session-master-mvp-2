
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/Lucide';
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

export const StudentReviews = ({ studentId }: { studentId: string }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [reviews, setReviews] = useState<SessionComment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load real reviews from the database
  useEffect(() => {
    loadReviews();
  }, [studentId, user?.id]);

  const loadReviews = async () => {
    if (!user?.id || !studentId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Loading real reviews for student:', studentId);
      
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

      console.log('✅ Real reviews loaded:', comments);
      setReviews(comments || []);
    } catch (error) {
      console.error('❌ Error in loadReviews:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredReviews = reviews.filter(comment => {
    if (search && !comment.comment.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  // Navigation handler for comments
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
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Archive" />
            <span>Review Archive</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
              <Icon name="Search" className="absolute left-2 top-2.5 text-gray-400" size={16} />
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-6 text-gray-500">
              <p>Loading reviews...</p>
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="space-y-3">
              {filteredReviews.map(comment => (
                <div key={comment.id} className="border rounded-md p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="text-sm font-medium">
                        Session {comment.session_id.slice(-8)}
                        {comment.hand_number && <span className="text-gray-500"> • Hand {comment.hand_number}</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleNavigateToSession(comment.session_id, comment.hand_number)}
                        className="h-7 w-7 p-0 rounded-full flex items-center justify-center"
                        aria-label="View session"
                      >
                        <Icon name="ExternalLink" size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm my-2">{comment.comment}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Coach review
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No reviews found.</p>
              <p className="text-sm mt-2">Real reviews will appear here when coaches review sessions.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
