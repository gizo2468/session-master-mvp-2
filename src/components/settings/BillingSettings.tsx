
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/ui/Lucide';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

// Mock subscription data
const mockSubscription = {
  plan: 'Pro Coach',
  price: '$19.99',
  billingCycle: 'monthly',
  studentSlots: 20,
  nextBillingDate: new Date('2025-05-29'),
};

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99',
    billingCycle: '/month',
    description: 'Perfect for new coaches',
    features: [
      '10 Student Slots',
      'All Basic Features',
    ],
    studentSlots: 10,
    current: false,
  },
  {
    id: 'pro',
    name: 'Pro Coach',
    price: '$19.99',
    billingCycle: '/month',
    description: 'For established coaches',
    features: [
      '20 Student Slots',
      'All Pro Features',
      'Priority Support',
    ],
    studentSlots: 20,
    current: true,
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite Coach',
    price: '$39.99',
    billingCycle: '/month',
    description: 'For professional coaches',
    features: [
      '50 Student Slots',
      'All Elite Features',
      'Priority Support',
      'Custom Branding',
    ],
    studentSlots: 50,
    current: false,
  },
];

const BillingSettings: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { cancelCoachSubscription } = useAuth();
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Handle plan badge click
  const handlePlanBadgeClick = () => {
    navigate('/coach-upgrade');
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelCoachSubscription();
      setCancelDialogOpen(false);
      toast({
        title: t('subscription_cancelled'),
        description: t('subscription_cancelled_description'),
        variant: "default",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: t('error'),
        description: t('subscription_cancel_error'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('billing')}</h2>
        
        {/* Current Plan Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-medium">{t('current_plan')}</h3>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{mockSubscription.plan}</CardTitle>
                  <CardDescription className="mt-1">
                    {mockSubscription.price} {t('per_month')}
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        onClick={handlePlanBadgeClick}
                        className="bg-poker-gold hover:bg-poker-darkGold cursor-pointer transition-colors"
                      >
                        {t('current_plan')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('click_to_change_plan')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('student_slots')}</span>
                  <span className="font-medium">{mockSubscription.studentSlots}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('next_billing')}</span>
                  <span className="font-medium">{mockSubscription.nextBillingDate.toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t pt-4">
              <Button 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1 text-xs px-2 py-1 h-8"
                onClick={() => setCancelDialogOpen(true)}
              >
                <Icon name="X" size={14} />
                {t('cancel_subscription')}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <Separator className="my-8" />
        
        {/* Available Plans Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">{t('available_plans')}</h3>
          
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map(plan => (
              <Card key={plan.id} className={`flex flex-col ${plan.current ? 'border-poker-gold' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-2xl font-bold">{plan.price}</span>
                        <span className="ml-1 text-sm text-gray-500">{plan.billingCycle}</span>
                      </div>
                    </div>
                    {plan.popular && (
                      <Badge className="bg-poker-gold hover:bg-poker-darkGold">Popular</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <Icon name="Check" className="h-4 w-4 mr-2 text-poker-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-4">
                  <Button 
                    variant={plan.current ? "outline" : "poker"} 
                    className="w-full"
                    disabled={plan.current}
                    onClick={() => navigate('/coach-upgrade')}
                  >
                    {plan.current ? t('current_plan') : t('upgrade')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Cancellation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('cancel_subscription_title')}</DialogTitle>
            <DialogDescription>
              {t('cancel_subscription_confirmation')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2">
            <div className="flex gap-2 items-start">
              <Icon name="AlertTriangle" className="text-amber-600 mt-0.5" size={16} />
              <span className="text-sm text-amber-800">
                {t('cancel_subscription_warning')}
              </span>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              className="sm:mt-0"
            >
              {t('keep_plan')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('confirm_cancel_subscription')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingSettings;
