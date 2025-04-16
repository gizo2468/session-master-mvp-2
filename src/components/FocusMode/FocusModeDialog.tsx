
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Timer } from 'lucide-react';

interface FocusModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FocusModeDialog({ open, onOpenChange }: FocusModeDialogProps) {
  const navigate = useNavigate();
  
  const handleFocusStart = (minutes: number) => {
    onOpenChange(false);
    navigate('/focus-mode', { state: { duration: minutes } });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-center">Select Focus Duration</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Card 
            className="cursor-pointer hover:border-poker-gold transition-colors"
            onClick={() => handleFocusStart(10)}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Timer className="h-10 w-10 mb-2 text-poker-gold" />
              <span className="font-serif text-xl">10 minutes</span>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:border-poker-gold transition-colors"
            onClick={() => handleFocusStart(15)}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Timer className="h-10 w-10 mb-2 text-poker-gold" />
              <span className="font-serif text-xl">15 minutes</span>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
