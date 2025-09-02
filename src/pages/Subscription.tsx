import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Star, Zap, Crown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { detectPlatform } from '@/utils/platformDetection';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = usePremiumAccess();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const platform = detectPlatform();
  const isMobile = platform === 'ios' || platform === 'android';

  const handlePayPalPayment = async () => {
    if (!user) {
      toast.error('Please log in to continue');
      return;
    }

    setIsLoading('monthly');

    try {
      // Create PayPal order
      const { data, error } = await supabase.functions.invoke('create-paypal-order', {
        body: { planType: 'monthly' }
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

        {/* Subscription Status Card */}
        <Card className={`mb-8 ${isPremium ? 'border-green-500 bg-green-50/50' : 'border-orange-500 bg-orange-50/50'}`}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Crown className={`h-6 w-6 ${isPremium ? 'text-green-600' : 'text-orange-600'}`} />
              <div>
                <h3 className="font-semibold text-lg">
                  {isPremium ? 'Premium Account' : 'Free Account'}
                </h3>
                <p className="text-muted-foreground">
                  {isPremium 
                    ? 'You have access to all premium features'
                    : 'Upgrade to unlock all features'
                  }
                </p>
              </div>
            </div>
            {isPremium && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Check className="h-4 w-4 mr-1" />
                Active
              </Badge>
            )}
          </CardContent>
        </Card>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Premium (Developed Plan)
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Support development and unlock all premium features.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="flex justify-center max-w-2xl mx-auto">
          <Card className="relative border-2 border-primary shadow-xl w-full max-w-md">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1">
                <Star className="h-4 w-4 mr-1" />
                Premium Plan
              </Badge>
            </div>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl">Premium (Developed Plan)</CardTitle>
              </div>
              <div className="text-4xl font-bold text-primary mb-2">
                $9.99
                <span className="text-lg text-muted-foreground font-normal">/month</span>
              </div>
              <p className="text-muted-foreground">Support development and unlock all features</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>My Finance page (full analytics)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Unlimited coach connections</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Multiple currencies</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Real-time coach comments</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Full hand uploads (all streets)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Priority access to future features</span>
                </div>
              </div>
              {isMobile ? (
                <div className="space-y-3">
                  <Button 
                    onClick={() => toast.info('In-App Purchase functionality coming soon!')}
                    className="w-full py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    size="lg"
                  >
                    Subscribe for $9.99 / month
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => toast.info('Restore Purchases functionality coming soon!')}
                    className="w-full"
                    size="sm"
                  >
                    Restore Purchases
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handlePayPalPayment}
                  disabled={isLoading === 'monthly'}
                  className="w-full py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="lg"
                >
                  {isLoading === 'monthly' ? 'Processing...' : 'Subscribe for $9.99 / month'}
                </Button>
              )}
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
            {isMobile 
              ? 'Secure in-app purchases protected by your app store'
              : 'Secure payment processing powered by PayPal'
            }
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>🔒 SSL Encrypted</span>
            <span>•</span>
            <span>{isMobile ? '📱 App Store Protected' : '💳 PayPal Protected'}</span>
            <span>•</span>
            <span>↩️ Money Back Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;