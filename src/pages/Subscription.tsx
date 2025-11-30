import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Star, Zap, Crown, FileDown } from 'lucide-react';
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

  // Ensure we always land at the top when arriving on this page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>My Finance page (full analytics + PDF export)</span>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                      <FileDown className="h-3 w-3 mr-1" />
                      + PDF export
                    </Badge>
                  </div>
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

        {/* What's Coming Soon Section */}
        <div className="mt-16 flex justify-center max-w-2xl mx-auto">
          <Card className="relative border-2 border-muted-foreground/20 shadow-xl w-full max-w-md">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-muted-foreground to-muted-foreground/80 text-background px-4 py-1">
                <Zap className="h-4 w-4 mr-1" />
                Coming Soon
              </Badge>
            </div>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-2xl">What's Coming Soon</CardTitle>
              </div>
              <p className="text-muted-foreground">Exciting features in development</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  <span>Advanced Screenshot Hand Analysis</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  <span>Improved Graphs & Visual Charts</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  <span>Enhanced Coaching Features</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  <span>Expanded Tournament Support</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  <span>More exciting features are in development, upgrade to Premium to support our progress!</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  <span>We apologize for any bugs or issues, we're still in early release and constantly improving based on your feedback</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Section */}
        {!isMobile && (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              Secure payment processing powered by PayPal
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>🔒 SSL Encrypted</span>
              <span>•</span>
              <span>💳 PayPal Protected</span>
              <span>•</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;