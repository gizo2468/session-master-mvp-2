import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * SubscriptionSuccess page - Legacy redirect handler
 * 
 * This page previously handled PayPal payment callbacks.
 * Now it simply redirects users to the subscription page
 * since payments are processed through mobile IAP only.
 */
const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to subscription page after a brief delay
    const timer = setTimeout(() => {
      navigate('/subscription', { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center content-safe">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 pt-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Redirecting...</h2>
          <p className="text-muted-foreground text-center">
            Please use the mobile app for subscription purchases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;