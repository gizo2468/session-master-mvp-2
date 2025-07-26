import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LockKeyhole, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PokerTips } from '@/components/FocusMode/PokerTips';

interface LocationState {
  duration: number;
}

const FocusModePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { duration = 10 } = (location.state as LocationState) || {};
  
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  
  useEffect(() => {
    // Prevent navigation using back button
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Set up timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(timer);
    };
  }, []);
  
  useEffect(() => {
    // When timer reaches 0, exit focus mode
    if (timeLeft === 0) {
      navigate('/');
    }
  }, [timeLeft, navigate]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleEmergencyUnlock = () => {
    if (window.confirm('Are you sure you want to exit Focus Mode?')) {
      navigate('/');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto max-w-md px-4 py-8 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center mb-8">
          <LockKeyhole className="h-20 w-20 text-poker-gold mb-4" />
          <h1 className="text-3xl font-bold text-center mb-2">Focus Mode Active</h1>
          <div className="text-5xl font-bold mb-6 text-poker-black">{formatTime(timeLeft)}</div>
          <p className="text-center text-gray-500 mb-8">
            This is your break from the phone, it's time to play your best game.<br />
            Stay off the phone. Stay in the zone.
          </p>
          
          <Button 
            variant="destructive" 
            className="mt-4"
            onClick={handleEmergencyUnlock}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Emergency Unlock
          </Button>
        </div>
        
        <div className="mb-4">
          <h2 className="font-medium text-xl mb-4">Strategic Tips</h2>
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <PokerTips />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default FocusModePage;
