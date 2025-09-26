
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import Icon from '@/components/ui/Lucide';
import CoachConnectionLimitDialog from './CoachConnectionLimitDialog';

const ConnectWithCoach = () => {
  const { connectWithCoach, connectedCoaches, loading } = useCoachStudent();
  const { isPremium, getConnectionLimits } = usePremiumAccess();
  const [code, setCode] = useState('');
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
  const limits = getConnectionLimits();
  const maxConnections = limits.maxCoachesForStudent;
  const isAtLimit = !isPremium && connectedCoaches.length >= maxConnections;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
      // Check if user is at connection limit
      if (isAtLimit) {
        setShowLimitDialog(true);
        return;
      }
      
      connectWithCoach(code.trim().toUpperCase());
      setCode(''); // Clear the input after submission
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="Link" />
          Connect with a Coach
        </CardTitle>
        <CardDescription>
          {isPremium ? (
            connectedCoaches.length > 0 
              ? "You can connect with unlimited coaches for different aspects of your game"
              : "Enter the connection code provided by your coach"
          ) : (
            connectedCoaches.length > 0 
              ? `You are connected to ${connectedCoaches.length}/${maxConnections} coach${maxConnections > 1 ? 'es' : ''} (Free limit). Upgrade to Premium for unlimited connections.`
              : "Enter the connection code provided by your coach"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Connection ID"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono uppercase"
              disabled={loading}
              autoComplete="one-time-code"
              inputMode="text"
              data-form-type="other"
            />
          </div>
          <Button 
            type="submit" 
            variant="poker" 
            className="w-full"
            disabled={code.trim().length !== 6 || loading}
          >
            {loading ? (
              <>
                <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Icon name="Link" className="mr-2 h-4 w-4" />
                Connect with Coach
              </>
            )}
          </Button>
        </form>
      </CardContent>
      
      <CoachConnectionLimitDialog
        open={showLimitDialog}
        onOpenChange={setShowLimitDialog}
      />
    </Card>
  );
};

export default ConnectWithCoach;
