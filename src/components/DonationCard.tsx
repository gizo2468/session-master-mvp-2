
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useSessionContext } from '@/context/SessionContext';
import { detectPlatform } from '@/utils/platformDetection';
import { useToast } from '@/hooks/use-toast';

const DonationCard = () => {
  const { user } = useAuth();
  const { activeSession } = useSessionContext();
  const { toast } = useToast();
  
  // PayPal donation link
  const DONATION_URL = "https://paypal.me/sessionmasterapp";
  
  const handleDonateClick = async () => {
    try {
      // Identify platform
      const platform = detectPlatform();
      
      // Log donation click to Supabase
      await supabase.from('donation_logs').insert({
        user_id: user?.id, // Will be null if user is not logged in
        session_id: activeSession?.id, // Will be null if no active session
        platform,
        // We don't include IP address as it's better handled server-side
      });
      
      // Open donation link in new tab
      window.open(DONATION_URL, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error logging donation click:', error);
      // Even if logging fails, still open the donation link
      window.open(DONATION_URL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-poker-feltGreen/20 bg-white dark:bg-card shadow-md">
      <CardHeader className="bg-gradient-to-r from-poker-feltGreen to-poker-feltGreen/80 text-white pb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Icon name="Heart" className="text-poker-cream animate-pulse" />
          <CardTitle className="text-2xl font-extrabold tracking-tight text-center">Support SessionMaster</CardTitle>
          <Icon name="Heart" className="text-poker-cream animate-pulse" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-4 text-center">
        <p className="text-gray-700 dark:text-gray-300">
          Help us grow this app and bring more value to the poker community. Every donation, big or small, 
          helps us build better tools for your sessions.
        </p>
      </CardContent>
      
      <CardFooter className="flex justify-center pb-6">
        <Button 
          onClick={handleDonateClick}
          className="px-8 py-2 bg-poker-gold hover:bg-poker-darkGold text-white font-medium rounded-full shadow-md flex items-center gap-2"
          variant="poker"
        >
          <Icon name="HeartHandshake" size={18} />
          Donate Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DonationCard;
