
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/context/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTutorial } from '@/hooks/useTutorial';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AppSettings = () => {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const { startTutorial, hasCompletedTutorial } = useTutorial();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleResetTutorial = async () => {
    if (!user?.id) return;

    try {
      // Reset the tutorial completion status in the database
      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_tutorial: false })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Tutorial Reset",
        description: "The tutorial will be shown the next time you visit the home page",
      });

      // Show tutorial immediately
      startTutorial();
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
              onValueChange={(value) => setLanguage(value)}
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
              View Tutorial Again
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {hasCompletedTutorial 
                ? "You've completed the tutorial. You can view it again anytime."
                : "Complete the tutorial to learn how to use this app."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppSettings;
