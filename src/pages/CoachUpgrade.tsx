
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { useAuth } from '@/context/AuthContext';
import { coachTiers } from '@/utils/coachTiers';
import { CoachTier, CoachTierDetails } from '@/types/poker';

const CoachUpgrade = () => {
  const navigate = useNavigate();
  const { user, upgradeCoachTier } = useAuth();
  
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
  
  if (!user || user.role !== 'coach') {
    return null;
  }
  
  const currentTier = user.coachTier || 'free';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost"
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:bg-transparent hover:text-poker-green"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </Button>
          
          <h1 className="text-2xl font-serif font-bold text-poker-black mb-2">Coach Tier Upgrade</h1>
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
          {currentTier === 'free' && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-md">
              <Icon name="alert-triangle" size={16} />
              <span>
                Free plan is limited to {coachTiers.free.maxStudents} students and basic management features only.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachUpgrade;
