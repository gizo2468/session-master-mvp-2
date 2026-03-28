
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AppSettings = () => {
  const { language, setLanguage, t } = useLanguage();

  // Define available languages directly in the component
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'he', name: 'Hebrew (עברית)' }
  ];

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
        </div>
      </CardContent>
    </Card>
  );
};

export default AppSettings;
