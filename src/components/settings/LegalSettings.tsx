
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/ui/Lucide';

const LegalSettings: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

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
            <div className="flex items-center justify-between border-b pb-3" 
                 onClick={() => navigate('/legal/privacy')}
                 role="button"
                 aria-label="View privacy policy">
              <div className="flex items-center">
                <Icon name="Shield" className="mr-3 text-gray-500 dark:text-muted-foreground h-4 w-4" />
                <span>Privacy Policy</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between border-b pb-3" 
                 onClick={() => navigate('/legal/terms')}
                 role="button"
                 aria-label="View terms of use">
              <div className="flex items-center">
                <Icon name="FileText" className="mr-3 text-gray-500 dark:text-muted-foreground h-4 w-4" />
                <span>Terms of Use</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between pt-1" 
                 onClick={() => navigate('/legal/cookie')}
                 role="button"
                 aria-label="View cookie policy">
              <div className="flex items-center">
                <Icon name="Cookie" className="mr-3 text-gray-500 dark:text-muted-foreground h-4 w-4" />
                <span>Cookie Policy</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LegalSettings;
