
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { HandData } from '@/types/poker';
import CardDisplay from '../poker/CardDisplay';
import { PokerChip } from '../Icons';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import FeatureLockOverlay from '@/components/coaching/FeatureLockOverlay';
import Icon from '@/components/ui/Lucide';
import { useNavigate } from 'react-router-dom';

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
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  // Sort hands by createdAt date
  const sortedHands = [...hands].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleFeedbackClick = (handId: string) => {
    if (hasCommentAccess) {
      onAddFeedback(handId);
    } else {
      setIsUpgradeModalOpen(true);
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
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleFeedbackClick(hand.id)}
                      className={`h-8 w-8 p-0 ${hasCommentAccess ? 'text-poker-feltGreen hover:text-poker-feltGreen/80' : 'text-gray-400'}`}
                      aria-label="Add feedback"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {!hasCommentAccess && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-poker-gold rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">$</span>
                        </div>
                      )}
                    </Button>
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

      {/* Upgrade Modal */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center text-center p-4">
            <div className="mb-6">
              <div className="w-16 h-16 bg-poker-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="lock" size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold">Unlock Hand Feedback</h2>
              <p className="text-gray-600 mt-2">
                Upgrade your coach tier to provide detailed feedback on specific hands to help your students improve.
              </p>
            </div>
            
            <div className="w-full space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-1">Pro Coach</h3>
                <p className="text-sm text-gray-600 mb-3">Unlock hand-level feedback for up to 10 students</p>
                <Button
                  variant="poker"
                  className="w-full"
                  onClick={() => navigate('/coach-upgrade')}
                >
                  Upgrade to Pro
                </Button>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-1">Elite Coach</h3>
                <p className="text-sm text-gray-600 mb-3">Unlimited feedback and premium features</p>
                <Button
                  variant="felt"
                  className="w-full"
                  onClick={() => navigate('/coach-upgrade')}
                >
                  Upgrade to Elite
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setIsUpgradeModalOpen(false)}
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachHandsList;
