
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/context/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTutorial } from '@/hooks/useTutorial';
import { useToast } from '@/hooks/use-toast';

const AppSettings = () => {
  const { language, setLanguage, t } = useLanguage();
  const { resetTutorial, hasCompletedTutorial, hasSeenTutorial } = useTutorial();
  const { toast } = useToast();

  // Define available languages directly in the component
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'he', name: 'Hebrew (עברית)' }
  ];

  const handleResetTutorial = async () => {
    try {
      await resetTutorial();
      toast({
        title: "Tutorial Reset",
        description: "The tutorial will start now",
      });
    } catch (error) {
      console.error('Error resetting tutorial:', error);
      toast({
        title: "Error",
        description: "Failed to reset tutorial. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Settings</CardTitle>
        <CardDescription>Customize your app experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="language">Language</Label>
            <Select
              value={language}
              onValueChange={(value) => {
                setLanguage(value as 'en' | 'he');
              }}
            >
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode" className="block mb-1">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </div>
            <Switch id="dark-mode" disabled />
          </div>

          <div className="pt-4 border-t">
            <Label className="block mb-2">Tutorial</Label>
            <Button
              variant="outline"
              onClick={handleResetTutorial}
              className="w-full"
            >
              Replay Tutorial
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {hasCompletedTutorial 
                ? "You've completed the tutorial. You can replay it anytime."
                : hasSeenTutorial 
                ? "You've seen the tutorial but didn't complete it. You can replay it anytime."
                : "Complete the tutorial to learn how to use this app."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppSettings;
