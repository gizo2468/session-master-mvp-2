
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/context/LanguageContext';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/Lucide';
import { useTutorial } from '@/context/TutorialContext'; // Add this import

interface AppSettingsFormValues {
  language: Language;
  liveSessionNotifications: boolean;
  newFeedbackNotifications: boolean;
}

const AppSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { startTutorial } = useTutorial(); // Add this hook
  
  const form = useForm<AppSettingsFormValues>({
    defaultValues: {
      language: language,
      liveSessionNotifications: user?.notificationPreferences?.liveSessionStart || true,
      newFeedbackNotifications: user?.notificationPreferences?.newFeedback || true,
    },
  });

  const onSubmit = (values: AppSettingsFormValues) => {
    if (values.language !== language) {
      setLanguage(values.language);
    }
    
    updateUser({
      notificationPreferences: {
        liveSessionStart: values.liveSessionNotifications,
        newFeedback: values.newFeedbackNotifications,
      },
    });
  };

  const handleLanguageChange = (value: Language) => {
    form.setValue('language', value);
    setLanguage(value);
  };

  const handleRestartTutorial = () => {
    updateUser({ isNewUser: true });
    startTutorial();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('app_settings')}</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Language Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('language')}</h3>
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      value={field.value}
                      onValueChange={(value) => handleLanguageChange(value as Language)}
                    >
                      <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">
                          <div className="flex items-center">
                            <Icon name="Globe" className="mr-2 h-4 w-4" />
                            <span>English</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="he">
                          <div className="flex items-center">
                            <Icon name="Globe" className="mr-2 h-4 w-4" />
                            <span>עברית (Hebrew)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            {/* Notification Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('notifications')}</h3>
              <FormField
                control={form.control}
                name="liveSessionNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>{t('session_notifications')}</FormLabel>
                      <FormDescription>
                        Receive notifications when live sessions start
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="newFeedbackNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>{t('feedback_notifications')}</FormLabel>
                      <FormDescription>
                        Receive notifications when new feedback is provided
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">
                {t('save')}
              </Button>
            </div>
          </form>
        </Form>
        
        {/* Tutorial Settings - Added Section */}
        <Separator className="my-6" />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tutorial</h3>
          <Card>
            <CardHeader>
              <CardTitle>App Tutorial</CardTitle>
              <CardDescription>
                Restart the app tutorial to learn about the main features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleRestartTutorial} 
                variant="outline"
                className="w-full"
              >
                <Icon name="HelpCircle" className="mr-2 h-4 w-4" />
                Restart Tutorial
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Separator className="my-6" />
        
        {/* Support & Help Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">{t('help')}</h3>
          
          {/* Support Request Section */}
          <Card className="mb-6">
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
    </div>
  );
};

export default AppSettings;
