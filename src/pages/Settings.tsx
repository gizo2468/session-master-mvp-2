
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AccountSettings from '@/components/settings/AccountSettings';
import CoachSettings from '@/components/settings/CoachSettings';
import StudentSettings from '@/components/settings/StudentSettings';
import AppSettings from '@/components/settings/AppSettings';
import BillingSettings from '@/components/settings/BillingSettings';
import SupportSettings from '@/components/settings/SupportSettings';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const isCoach = user?.role === 'coach';
  const isStudent = user?.role === 'student';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost"
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:bg-transparent hover:text-poker-green"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>{t('back')}</span>
          </Button>
          <h1 className="text-2xl font-serif font-bold text-poker-black">{t('settings')}</h1>
        </header>
        
        <Tabs defaultValue="account" dir={dir as "ltr" | "rtl"} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2">
            <TabsTrigger value="account">{t('account_settings')}</TabsTrigger>
            <TabsTrigger value="app">{t('app_settings')}</TabsTrigger>
            {isCoach && <TabsTrigger value="coach">{t('coach_settings')}</TabsTrigger>}
            {isStudent && <TabsTrigger value="student">{t('student_settings')}</TabsTrigger>}
            {isCoach && <TabsTrigger value="billing">{t('billing')}</TabsTrigger>}
            <TabsTrigger value="support">{t('help')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account">
            <Card className="p-6">
              <AccountSettings />
            </Card>
          </TabsContent>
          
          <TabsContent value="app">
            <Card className="p-6">
              <AppSettings />
            </Card>
          </TabsContent>
          
          {isCoach && (
            <TabsContent value="coach">
              <Card className="p-6">
                <CoachSettings />
              </Card>
            </TabsContent>
          )}
          
          {isStudent && (
            <TabsContent value="student">
              <Card className="p-6">
                <StudentSettings />
              </Card>
            </TabsContent>
          )}
          
          {isCoach && (
            <TabsContent value="billing">
              <Card className="p-6">
                <BillingSettings />
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="support">
            <Card className="p-6">
              <SupportSettings />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
