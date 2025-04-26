
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';

const ConnectWithCoach = () => {
  const { connectWithCoach, connectedCoach } = useCoachStudent();
  const [code, setCode] = useState('');
  
  if (connectedCoach) {
    return null; // Don't show if already connected to a coach
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length === 6) {
      connectWithCoach(code.trim().toUpperCase());
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name="link" />
          Connect with a Coach
        </CardTitle>
        <CardDescription>
          Enter the connection code provided by your coach
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono uppercase"
            />
          </div>
          <Button 
            type="submit" 
            variant="poker" 
            className="w-full"
            disabled={code.trim().length !== 6}
          >
            Connect
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ConnectWithCoach;
