
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/Lucide';
import PrivacyPolicyModal from '@/components/legal/PrivacyPolicyModal';
import TermsOfUseModal from '@/components/legal/TermsOfUseModal';
import CookiePolicyModal from '@/components/legal/CookiePolicyModal';

const LegalSettings: React.FC = () => {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [cookieModalOpen, setCookieModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6">Legal</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Legal Information</CardTitle>
            <CardDescription>
              Review our terms and privacy policy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 cursor-pointer hover:bg-gray-50" 
                 onClick={() => setPrivacyModalOpen(true)}
                 role="button"
                 aria-label="View privacy policy">
              <div className="flex items-center">
                <Icon name="Shield" className="mr-3 text-gray-500 h-4 w-4" />
                <span>Privacy Policy</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center justify-between border-b pb-3 cursor-pointer hover:bg-gray-50" 
                 onClick={() => setTermsModalOpen(true)}
                 role="button"
                 aria-label="View terms of use">
              <div className="flex items-center">
                <Icon name="FileText" className="mr-3 text-gray-500 h-4 w-4" />
                <span>Terms of Use</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center justify-between pt-1 cursor-pointer hover:bg-gray-50" 
                 onClick={() => setCookieModalOpen(true)}
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

      {/* Modals */}
      <PrivacyPolicyModal open={privacyModalOpen} onOpenChange={setPrivacyModalOpen} />
      <TermsOfUseModal open={termsModalOpen} onOpenChange={setTermsModalOpen} />
      <CookiePolicyModal open={cookieModalOpen} onOpenChange={setCookieModalOpen} />
    </div>
  );
};

export default LegalSettings;
