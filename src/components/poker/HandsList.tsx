
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Video, CircleDollarSign } from 'lucide-react';
import { HandData } from '@/types/poker';
import CardDisplay from './CardDisplay';

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
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHands.map((hand) => (
                <TableRow key={hand.id} className="group">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-0.5">
                      <CardDisplay cards={hand.cards} size="sm" />
                      {hand.pokercraftLink && (
                        <a 
                          href={hand.pokercraftLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 text-poker-feltGreen hover:text-poker-feltGreen/80"
                          aria-label="View hand video"
                        >
                          <Video size={16} />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      {hand.position}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium line-clamp-2" title={hand.action}>
                        {hand.action}
                      </div>
                      {hand.notes && (
                        <div className="text-xs text-gray-500 italic line-clamp-1" title={hand.notes}>
                          {hand.notes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hand.resultAmount !== undefined && (
                      <div className="flex items-center gap-1">
                        <CircleDollarSign className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={hand.resultAmount >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {hand.resultAmount >= 0 ? '+' : ''}${Math.abs(hand.resultAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onEditHand(hand)}
                        className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100"
                        aria-label="Edit hand"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onDeleteHand(hand.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 opacity-70 group-hover:opacity-100"
                        aria-label="Delete hand"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
          <p className="mb-2">No hands recorded yet.</p>
          <p className="text-sm">Click "Add Hand" to start tracking your hands.</p>
        </div>
      )}
    </div>
  );
};

export default HandsList;
