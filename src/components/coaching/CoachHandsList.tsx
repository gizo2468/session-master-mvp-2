
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { HandData } from '@/types/poker';
import CardDisplay from '../poker/CardDisplay';
import { PokerChip } from '../Icons';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import Icon from '@/components/ui/Lucide';
import { useNavigate, useLocation } from 'react-router-dom';

interface CoachHandsListProps {
  hands: HandData[];
  onAddFeedback: (handId: string) => void;
  hasCommentAccess?: boolean;
}

const CoachHandsList: React.FC<CoachHandsListProps> = ({ 
  hands, 
  onAddFeedback,
  hasCommentAccess = true 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Sort hands by createdAt date
  const sortedHands = [...hands].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleFeedbackClick = (handId: string) => {
    if (hasCommentAccess) {
      onAddFeedback(handId);
    } else {
      // Store current location before navigating to upgrade page
      localStorage.setItem('previousLocation', location.pathname);
      navigate('/coach-upgrade');
    }
  };

  return (
    <div className="w-full overflow-hidden">
      {sortedHands.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Cards</TableHead>
                <TableHead className="w-[12%]">Position</TableHead>
                <TableHead className="w-1/3">Action</TableHead>
                <TableHead className="w-1/5">Result</TableHead>
                <TableHead className="w-[100px] text-right">Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHands.map((hand) => (
                <TableRow key={hand.id} className="group">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-0.5">
                      <CardDisplay cards={hand.cards} size="sm" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      {hand.position}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <AdaptiveTooltip content={<p>{hand.action}</p>}>
                        <div className="text-sm font-medium line-clamp-2">
                          {hand.action}
                        </div>
                      </AdaptiveTooltip>
                      
                      {hand.notes && (
                        <AdaptiveTooltip content={<p>{hand.notes}</p>}>
                          <div className="text-xs text-gray-500 italic line-clamp-1">
                            {hand.notes}
                          </div>
                        </AdaptiveTooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hand.resultAmount !== undefined && (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <PokerChip className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                          <span className={hand.resultAmount >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {hand.resultAmount >= 0 ? '+' : ''}
                            {hand.currencyType === 'currency' ? '$' : ''}
                            {Math.abs(hand.resultAmount).toFixed(2)}
                          </span>
                        </div>
                        {(hand.smallBlind !== undefined || hand.bigBlind !== undefined) && (hand.smallBlind || hand.bigBlind) !== 0 && (
                          <span className="text-xs text-gray-500 text-center">
                            (
                            {hand.currencyType === 'currency' ? '$' : ''}
                            {hand.smallBlind !== undefined ? Number(hand.smallBlind).toString() : '0'}
                            /
                            {hand.currencyType === 'currency' ? '$' : ''}
                            {hand.bigBlind !== undefined ? Number(hand.bigBlind).toString() : '0'}
                            )
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasCommentAccess ? (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleFeedbackClick(hand.id)}
                        className="h-8 w-8 p-0 relative"
                        aria-label="Add feedback"
                      >
                        <MessageSquare className="h-4 w-4 text-poker-feltGreen hover:text-poker-feltGreen/80" />
                      </Button>
                    ) : (
                      <AdaptiveTooltip content={<p>Upgrade to leave hand feedback</p>}>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleFeedbackClick(hand.id)}
                          className="h-8 w-8 p-0 bg-gray-200 hover:bg-gray-300 border border-gray-300 opacity-90"
                          aria-label="Locked feedback - upgrade required"
                        >
                          <div className="relative flex items-center justify-center w-full h-full">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            <Icon 
                              name="dollar-sign" 
                              size={10} 
                              className="absolute -top-1 -right-1 text-poker-gold bg-white rounded-full p-0.5 border border-poker-gold"
                            />
                          </div>
                        </Button>
                      </AdaptiveTooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
          <p className="mb-2">No hands recorded yet.</p>
        </div>
      )}
    </div>
  );
};

export default CoachHandsList;
