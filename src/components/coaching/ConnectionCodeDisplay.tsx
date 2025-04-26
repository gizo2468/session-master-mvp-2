
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';

const ConnectionCodeDisplay = () => {
  const { connectionCode } = useCoachStudent();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!connectionCode) {
    return null;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectionCode);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Connection code copied to clipboard"
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="text-center mb-2">
          <h3 className="text-sm text-gray-500 mb-1">Connection Code</h3>
          <div className="text-3xl font-mono font-bold tracking-wider text-poker-gold">
            {connectionCode}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 text-center mb-4">
          Share this code with your students to connect with them
        </p>
        
        <Button 
          onClick={copyToClipboard} 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
        >
          <Icon name="Copy" size={16} />
          {copied ? "Copied!" : "Copy Code"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionCodeDisplay;
