
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';
import TableDetailsCard from '@/components/poker/TableDetailsCard';
import HandsList from '@/components/poker/HandsList';
import { CommentForm } from '@/components/coaching/CommentForm';
import { CommentTag } from '@/types/poker';
import { HandData, TableData } from '@/types/poker';

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
  const { toast } = useToast();
  const { studentId, sessionId } = useParams<{ studentId: string; sessionId: string }>();
  
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [selectedHandId, setSelectedHandId] = useState<string | undefined>(undefined);
  
  // In a real app, we would fetch this data from API/database
  const { table, hands } = createMockSessionData(sessionId || '');
  
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
    setSelectedHandId(handId);
    setIsCommentFormOpen(true);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate(`/coach/student/${studentId}`)} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
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
            <Button 
              onClick={() => openCommentForm()} 
              variant="poker"
              className="flex items-center gap-2"
            >
              <Icon name="MessageSquare" size={16} />
              <span>Add Session Comment</span>
            </Button>
          </div>
          
          {/* Hands section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="List" />
                <span>Hands</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-3 font-medium text-gray-600">Cards</th>
                      <th className="p-3 font-medium text-gray-600">Position</th>
                      <th className="p-3 font-medium text-gray-600">Action</th>
                      <th className="p-3 font-medium text-gray-600">Result</th>
                      <th className="p-3 font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {hands.map(hand => (
                      <tr key={hand.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{hand.cards}</td>
                        <td className="p-3">{hand.position}</td>
                        <td className="p-3 max-w-sm truncate" title={hand.action}>{hand.action}</td>
                        <td className={`p-3 font-medium ${
                          hand.resultAmount && hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {hand.resultAmount && hand.resultAmount >= 0 ? '+' : ''}
                          ${hand.resultAmount && Math.abs(Number(hand.resultAmount)).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            onClick={() => openCommentForm(hand.id)}
                            variant="ghost"
                            size="sm"
                          >
                            <Icon name="MessageSquare" size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
