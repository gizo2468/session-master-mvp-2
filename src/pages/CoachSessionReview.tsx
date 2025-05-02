
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';
import TableDetailsCard from '@/components/poker/TableDetailsCard';
import CoachHandsList from '@/components/coaching/CoachHandsList';
import { CommentForm } from '@/components/coaching/CommentForm';
import { CommentTag } from '@/types/poker';
import { HandData, TableData } from '@/types/poker';
import { useAuth } from '@/context/AuthContext';
import { hasFeatureAccess } from '@/utils/coachTiers';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import FeatureLockOverlay from '@/components/coaching/FeatureLockOverlay';

// Mock session data for the demo
const createMockSessionData = (sessionId: string) => {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - 3);
  
  const endTime = new Date();
  endTime.setHours(endTime.getHours() - 1);
  
  const table: TableData = {
    id: `table-${sessionId}`,
    format: 'Cash',
    gameType: 'NLH',
    location: 'Online Poker Site',
    buyIn: 200,
    initialBuyIn: 200,
    cashOut: 315.50,
    smallBlind: 1,
    bigBlind: 2,
    startTime: startTime,
    endTime: endTime,
    isActive: false
  };
  
  const hands: HandData[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `hand-${sessionId}-${i}`,
    cards: i === 0 ? 'AhKh' : i === 1 ? '7s8s' : i === 2 ? 'JcJd' : i === 3 ? '9dTd' : 'Ac2d',
    position: i === 0 ? 'BTN' : i === 1 ? 'SB' : i === 2 ? 'BB' : i === 3 ? 'MP' : 'CO',
    action: i === 0 
      ? 'Raised to 3BB, flop bet 6BB on A72r, turn check, river bet 12BB' 
      : i === 1 
      ? 'Called 3BB from SB, check-called flop on 986 two-spade, turn went check-check, river bet 8BB when flush completed'
      : 'Standard 3bet to 10BB, got 4bet and folded',
    resultAmount: i % 2 === 0 ? 45.5 : -22.25,
    currencyType: 'currency',
    createdAt: new Date()
  }));
  
  return { table, hands };
};

const CoachSessionReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { studentId, sessionId } = useParams<{ studentId: string; sessionId: string }>();
  const { user } = useAuth();
  
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [selectedHandId, setSelectedHandId] = useState<string | undefined>(undefined);
  
  // In a real app, we would fetch this data from API/database
  const { table, hands } = createMockSessionData(sessionId || '');
  
  // Check if user has access to comment feature
  const hasCommentAccess = hasFeatureAccess(user?.role, user?.coachTier, 'Comment Tagging');
  
  const handleAddComment = (content: string, tag: CommentTag | undefined) => {
    // In a real app, we would save this to the database
    toast({
      title: "Comment added",
      description: selectedHandId 
        ? "Your comment on this hand has been saved" 
        : "Your comment on this session has been saved"
    });
    
    setIsCommentFormOpen(false);
    setSelectedHandId(undefined);
  };
  
  const openCommentForm = (handId?: string) => {
    if (!hasCommentAccess) {
      // Store current location before navigating
      localStorage.setItem('previousLocation', location.pathname);
      // Navigate to coach upgrade page
      navigate('/coach-upgrade');
      return;
    }
    
    setSelectedHandId(handId);
    setIsCommentFormOpen(true);
  };
  
  // Check if we're returning from the upgrade page
  useEffect(() => {
    const previousLocation = localStorage.getItem('previousLocation');
    if (previousLocation === location.pathname) {
      // Clear the stored location to prevent this from running again
      localStorage.removeItem('previousLocation');
    }
  }, [location.pathname]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate(`/coach/student/${studentId}`)} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="arrow-left" size={16} />
            <span>Back to Student</span>
          </button>
          
          <h1 className="text-2xl font-serif font-bold text-poker-black">Session Review</h1>
          <p className="text-gray-500 text-sm mt-1">
            {table.gameType} {table.format} @ {table.location}
          </p>
        </header>
        
        <div className="space-y-6">
          {/* Session details */}
          <TableDetailsCard table={table} />
          
          {/* Session comment button */}
          <div className="flex justify-end">
            {hasCommentAccess ? (
              <Button 
                onClick={() => openCommentForm()}
                variant="poker"
                className="flex items-center gap-2"
              >
                <Icon name="message-square" size={16} />
                <span>Add Session Comment</span>
              </Button>
            ) : (
              <AdaptiveTooltip content={<p>Upgrade to leave session feedback</p>}>
                <Button 
                  onClick={() => openCommentForm()}
                  variant="outline"
                  className="bg-gray-200 hover:bg-gray-300 border border-gray-300 opacity-90 flex items-center gap-2 text-gray-700"
                >
                  <div className="relative">
                    <Icon name="message-square" size={16} className="text-gray-500" />
                    <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 border border-poker-gold">
                      <Icon 
                        name="dollar-sign" 
                        size={10} 
                        className="text-poker-gold"
                      />
                    </div>
                  </div>
                  <span>Add Session Comment</span>
                </Button>
              </AdaptiveTooltip>
            )}
          </div>
          
          {/* Hands section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="list" />
                <span>Hands</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <CoachHandsList 
                  hands={hands} 
                  onAddFeedback={openCommentForm}
                  hasCommentAccess={hasCommentAccess}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <CommentForm 
          open={isCommentFormOpen} 
          onOpenChange={setIsCommentFormOpen} 
          onSubmit={handleAddComment}
          context={selectedHandId ? 'hand' : 'session'}
        />
      </div>
    </div>
  );
};

export default CoachSessionReview;
