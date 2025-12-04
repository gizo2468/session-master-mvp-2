
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Video, CircleDollarSign, Image, X, MessageSquare } from 'lucide-react';
import { HandData } from '@/types/poker';
import CardDisplay from './CardDisplay';
import { PokerChip } from '../Icons';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import HandDetailsDialog from './HandDetailsDialog';

interface HandsListProps {
  hands: HandData[];
  onEditHand: (hand: HandData) => void;
  onDeleteHand: (handId: string) => void;
  readOnly?: boolean; // Add readOnly prop
  sessionBuyIn?: number; // Buy-in amount for the session
  tables?: any[]; // Tables data to get table-specific buy-ins
  onViewHand?: (hand: HandData) => void; // Optional prop for viewing hand details
}

const HandsList: React.FC<HandsListProps> = ({ hands, onEditHand, onDeleteHand, readOnly = false, sessionBuyIn, tables = [], onViewHand }) => {
  // Sort hands by createdAt date
  const sortedHands = [...hands].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [handDetailsOpen, setHandDetailsOpen] = useState(false);
  const [selectedHand, setSelectedHand] = useState<HandData | null>(null);

  const openImageModal = (imageData: string) => {
    setSelectedImage(imageData);
    setImageModalOpen(true);
  };

  const handleRowClick = (hand: HandData) => {
    if (onViewHand) {
      onViewHand(hand);
    } else {
      setSelectedHand(hand);
      setHandDetailsOpen(true);
    }
  };

  return (
    <div className="w-full overflow-hidden">
      {sortedHands.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3 md:py-2">Cards</TableHead>
                <TableHead className="w-[15%] md:py-2">Position</TableHead>
                <TableHead className="w-[20%] md:py-2">Buy-In</TableHead>
                <TableHead className="w-1/4 md:py-2">Result</TableHead>
                {!readOnly && (
                  <TableHead className="w-[15%] text-right md:py-2">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHands.map((hand) => (
                <TableRow 
                  key={hand.id} 
                  className="group cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(hand)}
                >
                  <TableCell className="py-3 md:py-2">
                    <div className="flex items-center gap-0.5">
                      <CardDisplay cards={hand.cards} size="sm" />
                      <div className="ml-1 flex items-center space-x-1">
                        {hand.image && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageModal(hand.image as string);
                            }}
                            className="text-blue-500 hover:text-blue-600" 
                            title="View hand image"
                          >
                            <Image size={16} />
                          </button>
                        )}
                        {hand.pokercraftLink && hand.pokercraftLink.trim() !== '' && (
                          <a 
                            href={hand.pokercraftLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-poker-feltGreen hover:text-poker-feltGreen/80"
                            aria-label="View hand video"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Ensure we have a valid URL
                              if (!hand.pokercraftLink?.startsWith('http')) {
                                e.preventDefault();
                                return false;
                              }
                            }}
                          >
                            <Video size={16} />
                          </a>
                        )}
                        {hand.notes && (
                          <TooltipProvider>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-gray-500 hover:text-gray-700"
                                  aria-label="View hand notes"
                                >
                                  <MessageSquare size={16} />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Hand Notes</h4>
                                  <p className="text-sm text-gray-700">{hand.notes}</p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="md:py-2">
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      {hand.position}
                    </span>
                  </TableCell>
                  
                  <TableCell className="md:py-2">
                    {(() => {
                      // Find the table this hand belongs to
                      const handTable = tables.find(table => table.id === hand.tableId);
                      const buyIn = handTable?.buyIn || sessionBuyIn;
                      
                      return buyIn !== undefined ? (
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-medium">
                            ${buyIn.toFixed(2)}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </TableCell>
                  
                  <TableCell className="md:py-2">
                    {hand.resultAmount !== undefined && (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                          {hand.currencyType === 'currency' ? (
                            <CircleDollarSign className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                          ) : (
                            <PokerChip className={`h-4 w-4 ${hand.resultAmount >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                          )}
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
                  {!readOnly && (
                    <TableCell className="text-right md:py-2">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditHand(hand);
                          }}
                          className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100"
                          aria-label="Edit hand"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHand(hand.id);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 opacity-70 group-hover:opacity-100"
                          aria-label="Delete hand"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-3xl p-1 bg-transparent border-none">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70 rounded-full p-1 z-10"
              onClick={() => setImageModalOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Hand image" 
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <HandDetailsDialog
        open={handDetailsOpen}
        onOpenChange={setHandDetailsOpen}
        hand={selectedHand}
        sessionBuyIn={sessionBuyIn}
        tables={tables}
        onEdit={!readOnly ? onEditHand : undefined}
        readOnly={readOnly}
      />
    </div>
  );
};

export default HandsList;
