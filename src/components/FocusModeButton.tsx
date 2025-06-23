
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Focus } from '@/components/Icons';
import { FocusModeDialog } from '@/components/FocusMode/FocusModeDialog';

export default function FocusModeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set new timeout to hide after 3 seconds of no scrolling
      const timeout = setTimeout(() => {
        setIsScrolling(false);
      }, 3000);
      
      setScrollTimeout(timeout);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);
  
  return (
    <>
      <Button 
        variant="poker" 
        size="icon"
        className={`fixed bottom-6 left-6 w-14 h-14 rounded-full bg-poker-gold shadow-lg transition-opacity duration-300 ${
          isScrolling ? 'opacity-100' : 'opacity-30'
        }`}
        onClick={() => setIsOpen(true)}
        aria-label="Focus mode"
      >
        <Focus />
      </Button>
      
      <FocusModeDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
