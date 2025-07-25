
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/ui/Lucide';
import DonationCard from '@/components/DonationCard';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import PrivacyPolicyModal from '@/components/legal/PrivacyPolicyModal';

const SupportSettings: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('help')}</h2>
        
        {/* Support Request Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('support_request')}</CardTitle>
            <CardDescription>
              Get help with any issues or questions about the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="poker" className="w-full">
              <Icon name="LifeBuoy" className="mr-2 h-4 w-4" />
              {t('support_request')}
            </Button>
          </CardContent>
        </Card>
        
        {/* Donation Card */}
        <DonationCard />
        
        <Separator className="my-8" />
        
        {/* Legal Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Information</CardTitle>
            <CardDescription>
              Review our terms and policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3" 
                 onClick={() => setShowPrivacyModal(true)}
                 role="button"
                 aria-label="View privacy policy">
              <div className="flex items-center">
                <Icon name="Shield" className="mr-3 text-gray-500 h-4 w-4" />
                <span>Privacy Policy</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center justify-between border-b pb-3" 
                 onClick={() => navigate('/legal/terms')}
                 role="button"
                 aria-label="View terms of use">
              <div className="flex items-center">
                <Icon name="FileText" className="mr-3 text-gray-500 h-4 w-4" />
                <span>Terms of Use</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center justify-between pt-1" 
                 onClick={() => navigate('/legal/cookie')}
                 role="button"
                 aria-label="View cookie policy">
              <div className="flex items-center">
                <Icon name="Cookie" className="mr-3 text-gray-500 h-4 w-4" />
                <span>Cookie Policy</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <PrivacyPolicyModal 
        open={showPrivacyModal} 
        onOpenChange={setShowPrivacyModal} 
      />
    </div>
  );
};

export default SupportSettings;
