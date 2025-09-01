import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Star, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePayPalPayment = async (planType: 'monthly' | 'lifetime') => {
    if (!user) {
      toast.error('Please log in to continue');
      return;
    }

    setIsLoading(planType);

    try {
      // Create PayPal order
      const { data, error } = await supabase.functions.invoke('create-paypal-order', {
        body: { planType }
      });

      if (error) {
        throw error;
      }

      if (data.approval_url) {
        // Redirect to PayPal for payment
        window.location.href = data.approval_url;
      } else {
        throw new Error('No approval URL received from PayPal');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock premium features and take your poker tracking to the next level
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <Card className="relative border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Monthly</CardTitle>
              </div>
              <div className="text-4xl font-bold text-primary mb-2">
                $14.99
                <span className="text-lg text-muted-foreground font-normal">/month</span>
              </div>
              <p className="text-muted-foreground">Perfect for regular players</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Advanced analytics & reports</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Coaching features access</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Export capabilities</span>
                </div>
              </div>
              <Button 
                onClick={() => handlePayPalPayment('monthly')}
                disabled={isLoading === 'monthly'}
                className="w-full py-6 text-lg"
                size="lg"
              >
                {isLoading === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
              </Button>
            </CardContent>
          </Card>

          {/* Lifetime Plan */}
          <Card className="relative border-2 border-primary shadow-xl scale-105">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1">
                <Star className="h-4 w-4 mr-1" />
                Limited Offer
              </Badge>
            </div>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Lifetime Deal</CardTitle>
              </div>
              <div className="text-4xl font-bold text-primary mb-2">
                $199
                <span className="text-lg text-muted-foreground font-normal">/forever</span>
              </div>
              <p className="text-muted-foreground">Best value - pay once, use forever</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>All monthly features included</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Lifetime access to all updates</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>VIP support priority</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Future premium features</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="font-semibold text-primary">Save $980+ over 5 years!</span>
                </div>
              </div>
              <Button 
                onClick={() => handlePayPalPayment('lifetime')}
                disabled={isLoading === 'lifetime'}
                className="w-full py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                {isLoading === 'lifetime' ? 'Processing...' : 'Get Lifetime Deal'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8">What You Get With Premium</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Advanced Analytics</h3>
              <p className="text-muted-foreground text-sm">
                Deep insights into your game with detailed charts and statistics
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Coaching Features</h3>
              <p className="text-muted-foreground text-sm">
                Connect with coaches and access advanced learning tools
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Priority Support</h3>
              <p className="text-muted-foreground text-sm">
                Get help faster with our dedicated premium support team
              </p>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Secure payment processing powered by PayPal
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>🔒 SSL Encrypted</span>
            <span>•</span>
            <span>💳 PayPal Protected</span>
            <span>•</span>
            <span>↩️ Money Back Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;