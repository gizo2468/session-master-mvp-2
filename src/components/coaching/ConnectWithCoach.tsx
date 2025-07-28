
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';

const ConnectWithCoach = () => {
  const { connectWithCoach, connectedCoaches, loading } = useCoachStudent();
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
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
          {connectedCoaches.length > 0 
            ? "You can connect with multiple coaches for different aspects of your game"
            : "Enter the connection code provided by your coach"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono uppercase"
              disabled={loading}
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
    </Card>
  );
};

export default ConnectWithCoach;
