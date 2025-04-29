
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/ui/Lucide';

const SupportSettings: React.FC = () => {
  const { t } = useLanguage();

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
        
        {/* Legal Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Information</CardTitle>
            <CardDescription>
              Review our terms and policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              <Icon name="FileText" className="mr-2 h-4 w-4" />
              {t('terms_of_service')}
            </Button>
            <Button variant="outline" className="w-full">
              <Icon name="Shield" className="mr-2 h-4 w-4" />
              {t('privacy_policy')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportSettings;
