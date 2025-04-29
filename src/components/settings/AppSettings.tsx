
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/context/LanguageContext';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/Lucide';

interface AppSettingsFormValues {
  language: Language;
  liveSessionNotifications: boolean;
  newFeedbackNotifications: boolean;
}

const AppSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  
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
                        <SelectValue placeholder={t('language')} />
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
                  <FormItem className="flex flex-row items-center justify-between rtl-component-fix">
                    <div className="space-y-0.5">
                      <FormLabel>{t('session_notifications')}</FormLabel>
                      <FormDescription>
                        {t('session_notifications')}
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
                  <FormItem className="flex flex-row items-center justify-between rtl-component-fix">
                    <div className="space-y-0.5">
                      <FormLabel>{t('feedback_notifications')}</FormLabel>
                      <FormDescription>
                        {t('feedback_notifications')}
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
      </div>
    </div>
  );
};

export default AppSettings;
