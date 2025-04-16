
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';

const DonationCard = () => {
  // This would be linked to a payment processor in a real implementation
  const handleDonateClick = () => {
    // In a real implementation, this would open a payment modal or redirect to payment
    alert('Thank you for your support! This would normally open a payment option.');
  };

  return (
    <Card className="overflow-hidden border-2 border-poker-feltGreen/20 bg-white shadow-md">
      <CardHeader className="bg-gradient-to-r from-poker-feltGreen to-poker-feltGreen/80 text-white pb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Icon name="heart" className="text-poker-cream animate-pulse" />
          <CardTitle className="text-2xl font-serif text-center">Support SessionMaster</CardTitle>
          <Icon name="heart" className="text-poker-cream animate-pulse" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-4 text-center">
        <p className="text-gray-700">
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
          <Icon name="heart-handshake" size={18} />
          Donate Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DonationCard;
