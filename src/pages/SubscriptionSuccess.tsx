import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUserProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentData, setPaymentData] = useState<{
    planType: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      const token = searchParams.get('token');
      const payerID = searchParams.get('PayerID');

      if (!token || !payerID) {
        toast.error('Invalid payment parameters');
        navigate('/subscription');
        return;
      }

      try {
        // Capture the payment
        const { data, error } = await supabase.functions.invoke('capture-paypal-payment', {
          body: { orderId: token }
        });

        if (error) {
          throw error;
        }

        setPaymentData({
          planType: data.planType,
          amount: data.amount
        });

        // Refresh user profile to get updated premium status
        await refreshUserProfile();

        toast.success('Payment successful! Welcome to Premium!');
      } catch (error) {
        console.error('Payment processing error:', error);
        toast.error('Failed to process payment. Please contact support.');
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, navigate, refreshUserProfile]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Processing Payment...</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we confirm your payment with PayPal.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-lg font-semibold">
              Welcome to Premium! 🎉
            </p>
            {paymentData && (
              <div className="space-y-1">
                <p className="text-muted-foreground">
                  Plan: {paymentData.planType === 'monthly' ? 'Monthly Subscription' : 'Lifetime Deal'}
                </p>
                <p className="text-muted-foreground">
                  Amount: ${paymentData.amount}
                </p>
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Your premium features are now active! You can access advanced analytics, 
              coaching features, and priority support.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/settings')}
              className="w-full"
            >
              View Subscription Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;