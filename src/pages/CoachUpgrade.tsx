
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { useAuth } from '@/context/AuthContext';
import { coachTiers } from '@/utils/coachTiers';
import { CoachTier, CoachTierDetails } from '@/types/poker';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const CoachUpgrade = () => {
  const navigate = useNavigate();
  const { user, upgradeCoachTier, cancelCoachSubscription } = useAuth();
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Redirect to home if not a coach
  React.useEffect(() => {
    if (user && user.role !== 'coach') {
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleUpgrade = (tier: CoachTier) => {
    upgradeCoachTier(tier);
    navigate('/coach-dashboard');
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelCoachSubscription();
      setCancelDialogOpen(false);
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled. You'll have access until the end of your billing period.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "There was a problem cancelling your subscription. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (!user || user.role !== 'coach') {
    return null;
  }
  
  const currentTier = user.coachTier || 'free';
  const isOnFreePlan = currentTier === 'free';
  
  return (
    <div className="min-h-screen bg-gray-50 content-safe">
      <div className="container mx-auto max-w-5xl px-4 pt-4 pb-8">
        <header className="mb-8">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost"
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:bg-transparent hover:text-poker-green"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </Button>
          
          <h1 className="text-2xl font-bold text-poker-black mb-2">Coach Tier Upgrade</h1>
          <p className="text-gray-600">
            Upgrade your coaching capabilities with our tiered plans designed to grow with your coaching business
          </p>
        </header>
        
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {Object.values(coachTiers)
            .filter(plan => plan.tier !== 'free') // Don't show free plan as an upgrade option
            .map((plan) => (
              <Card 
                key={plan.tier} 
                className={`flex flex-col ${currentTier === plan.tier ? 'border-poker-gold ring-2 ring-poker-gold' : 'border-gray-200'}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-2xl font-bold">${plan.price}</span>
                        <span className="ml-1 text-sm text-gray-500">/month</span>
                      </div>
                    </div>
                    {currentTier === plan.tier && (
                      <Badge className="bg-poker-gold hover:bg-poker-darkGold">Current Plan</Badge>
                    )}
                    {plan.tier === 'pro' && currentTier !== 'pro' && (
                      <Badge className="bg-blue-500 hover:bg-blue-600">Popular</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    Up to {plan.maxStudents} students
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <Icon name="check" className="h-4 w-4 mr-2 text-poker-gold" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="border-t p-4">
                  <Button 
                    variant={currentTier === plan.tier ? "outline" : "poker"}
                    className="w-full"
                    disabled={currentTier === plan.tier}
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {currentTier === plan.tier ? "Current Plan" : "Upgrade"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
        </div>
        
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Current Plan: {coachTiers[currentTier].name}</h2>
          <p className="text-gray-600 mb-4">
            {currentTier === 'free' 
              ? "You are currently on the free coaching plan with limited features and student capacity." 
              : "Thank you for supporting Session Master! Your paid subscription helps us build better tools for poker coaches."}
          </p>
          
          <div className="flex flex-wrap gap-3 items-center">
            {currentTier === 'free' && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-md w-full mb-3">
                <Icon name="alert-triangle" size={16} />
                <span>
                  Free plan is limited to {coachTiers.free.maxStudents} students and basic management features only.
                </span>
              </div>
            )}
            
            {!isOnFreePlan && (
              <Button 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1 text-xs px-2 py-1 h-8"
                onClick={() => setCancelDialogOpen(true)}
              >
                <Icon name="X" size={14} />
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Cancellation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Your Subscription?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll retain access to all premium features until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2">
            <div className="flex gap-2 items-start">
              <Icon name="AlertTriangle" className="text-amber-600 mt-0.5" size={16} />
              <span className="text-sm text-amber-800">
                After cancellation, your account will revert to the free plan with limited features at the end of your billing cycle.
              </span>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              className="sm:mt-0"
            >
              Keep My Plan
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachUpgrade;
