
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import Icon from '@/components/ui/Lucide';

import { Separator } from '@/components/ui/separator';
import PrivacyPolicyModal from '@/components/legal/PrivacyPolicyModal';
import TermsOfUseModal from '@/components/legal/TermsOfUseModal';
import CookiePolicyModal from '@/components/legal/CookiePolicyModal';

const SupportSettings: React.FC = () => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6">Support / Contact</h2>
        
        {/* Support Request Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>
              Get help with any issues or questions about the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="poker" 
              className="w-full"
              onClick={() => window.location.href = 'mailto:sessionmaster11@gmail.com'}
            >
              <Icon name="LifeBuoy" className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
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
                 onClick={() => setShowTermsModal(true)}
                 role="button"
                 aria-label="View terms of use">
              <div className="flex items-center">
                <Icon name="FileText" className="mr-3 text-gray-500 h-4 w-4" />
                <span>Terms of Use</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center justify-between pt-1" 
                 onClick={() => setShowCookieModal(true)}
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
      
      <TermsOfUseModal 
        open={showTermsModal} 
        onOpenChange={setShowTermsModal} 
      />
      
      <CookiePolicyModal 
        open={showCookieModal} 
        onOpenChange={setShowCookieModal} 
      />
    </div>
  );
};

export default SupportSettings;
