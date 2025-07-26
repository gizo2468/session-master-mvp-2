
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';

const ConnectionCodeDisplay = () => {
  const { connectionCode } = useCoachStudent();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show the component only when we have a connection code
  useEffect(() => {
    setIsVisible(!!connectionCode);
  }, [connectionCode]);

  if (!isVisible) {
    return null;
  }

  const copyToClipboard = async () => {
    if (!connectionCode) return;
    
    try {
      await navigator.clipboard.writeText(connectionCode);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Connection code copied to clipboard"
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = connectionCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Connection code copied to clipboard"
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="mb-4 border-poker-gold/20 bg-gradient-to-br from-poker-gold/5 to-transparent">
      <CardContent className="pt-6">
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="Key" size={18} className="text-poker-gold" />
            <h3 className="text-sm font-medium text-gray-700">Active Connection Code</h3>
          </div>
          <div className="text-3xl font-mono font-bold tracking-wider text-poker-gold mb-1">
            {connectionCode}
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-green-600">
            <Icon name="CheckCircle" size={14} />
            <span>Code is active and ready to share</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 text-center mb-4">
          Share this code with players to allow them to connect with you
        </p>
        
        <Button 
          onClick={copyToClipboard} 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 hover:bg-poker-gold/10 hover:border-poker-gold/50"
        >
          <Icon name={copied ? "Check" : "Copy"} size={16} />
          {copied ? "Copied!" : "Copy Code"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionCodeDisplay;
