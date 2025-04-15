
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { HandData } from '@/types/poker';
import CardDisplay from './CardDisplay';
import { format } from 'date-fns';

interface HandsListProps {
  hands: HandData[];
  onEditHand: (hand: HandData) => void;
  onDeleteHand: (handId: string) => void;
}

const HandsList: React.FC<HandsListProps> = ({ hands, onEditHand, onDeleteHand }) => {
  // Sort hands by createdAt date
  const sortedHands = [...hands].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="w-full overflow-auto">
      {sortedHands.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cards</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedHands.map((hand) => (
              <TableRow key={hand.id}>
                <TableCell>
                  <div className="flex items-center">
                    <CardDisplay cards={hand.cards} size="sm" />
                    {hand.pokercraftLink && (
                      <a 
                        href={hand.pokercraftLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-poker-feltGreen hover:text-poker-feltGreen/80"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-gray-200 rounded-full text-xs font-medium">
                    {hand.position}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-[180px] truncate" title={hand.action}>
                    {hand.action}
                    {hand.notes && (
                      <div className="text-xs text-gray-500 italic truncate" title={hand.notes}>
                        {hand.notes}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {hand.resultAmount !== undefined && (
                    <span className={hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {hand.resultAmount >= 0 ? '+' : ''}${hand.resultAmount.toFixed(2)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onEditHand(hand)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onDeleteHand(hand.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hands recorded yet. Click "Add Hand" to start tracking your hands.
        </div>
      )}
    </div>
  );
};

export default HandsList;
