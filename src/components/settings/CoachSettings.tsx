
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';

const CoachSettings: React.FC = () => {
  const navigate = useNavigate();
  const { connectionCode, generateConnectionCode, disableConnectionCode, loading } = useCoachStudent();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!connectionCode) return;
    
    navigator.clipboard.writeText(connectionCode);
    setCopied(true);
    
    toast({
      title: t('success'),
      description: "Connection code copied to clipboard",
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('coach_settings')}</h2>
        
        {/* Connection Code Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-medium">{t('connection_code')}</h3>
          
          {connectionCode ? (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-mono font-bold tracking-wider text-poker-gold mb-2">
                    {connectionCode}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-muted-foreground">
                    Share this code with your players to connect with them
                  </p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleCopyCode}
                    disabled={loading}
                  >
                    <Icon name={copied ? "Check" : "Copy"} className="mr-2 h-4 w-4" />
                    {copied ? t('success') : t('copy_code')}
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    className="w-full"
                    onClick={disableConnectionCode}
                    disabled={loading}
                  >
                    {loading ? (
                      <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="X" className="mr-2 h-4 w-4" />
                    )}
                    {loading ? 'Disabling...' : t('disable_code')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button 
              variant="poker"
              className="w-full"
              onClick={generateConnectionCode}
              disabled={loading}
            >
              {loading ? (
                <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icon name="Plus" className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Generating...' : t('generate_code')}
            </Button>
          )}
        </div>
        
        <Separator className="my-8" />
        
        {/* Student Management Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-medium">{t('manage_students')}</h3>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => navigate('/coach-dashboard')}
          >
            <Icon name="Users" className="mr-2 h-4 w-4" />
            {t('manage_students')}
          </Button>
        </div>
        
        <Separator className="my-8" />
        
        {/* Upgrade Plan Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('upgrade_plan')}</h3>
          <Button 
            variant="poker"
            className="w-full"
            onClick={() => navigate('/settings', { state: { tab: 'billing' } })}
          >
            <Icon name="CreditCard" className="mr-2 h-4 w-4" />
            {t('upgrade_plan')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CoachSettings;
