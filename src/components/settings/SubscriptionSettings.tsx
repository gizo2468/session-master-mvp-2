import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Calendar, Infinity, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionData {
  isPremium: boolean;
  subscription: {
    plan_type: string;
    status: string;
    start_date: string;
    end_date?: string;
  } | null;
}

const SubscriptionSettings: React.FC = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.functions.invoke('verify-subscription-status');
        
        if (error) {
          throw error;
        }

        setSubscriptionData(data);
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        toast.error('Failed to load subscription status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Failed to load subscription data</p>
        </CardContent>
      </Card>
    );
  }

  const { isPremium, subscription } = subscriptionData;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className={`h-5 w-5 ${isPremium ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPremium && subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Crown className="h-3 w-3 mr-1" />
                Premium Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Plan</span>
              <div className="flex items-center gap-2">
                {subscription.plan_type === 'lifetime' ? (
                  <>
                    <Infinity className="h-4 w-4 text-primary" />
                    <span>Lifetime Deal</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Monthly Subscription</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Started</span>
              <span>{formatDate(subscription.start_date)}</span>
            </div>

            {subscription.end_date && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Next Billing</span>
                <span>{formatDate(subscription.end_date)}</span>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-sm mb-2">Premium Benefits Active:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Advanced analytics & reports</li>
                <li>• Coaching features access</li>
                <li>• Priority support</li>
                <li>• Export capabilities</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              <Badge variant="secondary">
                Free Plan
              </Badge>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade to Premium to unlock advanced features and take your poker tracking to the next level.
              </p>
              <Button className="w-full" onClick={() => window.location.href = '/subscription'}>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionSettings;