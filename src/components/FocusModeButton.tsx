
import React from 'react';
import { Button } from '@/components/ui/button';
import { Focus } from '@/components/Icons';
import { FocusModeDialog } from '@/components/FocusMode/FocusModeDialog';
import { useState } from 'react';

export default function FocusModeButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button 
        variant="poker" 
        size="icon"
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-poker-gold shadow-lg"
        onClick={() => setIsOpen(true)}
        aria-label="Focus mode"
      >
        <Focus />
      </Button>
      
      <FocusModeDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
