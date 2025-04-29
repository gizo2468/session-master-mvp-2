
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
          <h1 className="text-2xl font-serif font-bold text-poker-black mb-6">{t('settings')}</h1>
        </header>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Tabs defaultValue="account" dir={dir as "ltr" | "rtl"} className="w-full">
            <div className="border-b">
              <div className="container px-4">
                <TabsList className="flex w-full overflow-x-auto no-scrollbar">
                  <TabsTrigger value="account" className="flex-1">{t('account_settings')}</TabsTrigger>
                  <TabsTrigger value="app" className="flex-1">{t('app_settings')}</TabsTrigger>
                  {isCoach && <TabsTrigger value="coach" className="flex-1">{t('coach_settings')}</TabsTrigger>}
                  {isStudent && <TabsTrigger value="student" className="flex-1">{t('student_settings')}</TabsTrigger>}
                  {isCoach && <TabsTrigger value="billing" className="flex-1">{t('billing')}</TabsTrigger>}
                  <TabsTrigger value="support" className="flex-1">{t('help')}</TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <div className="p-6">
              <TabsContent value="account">
                <AccountSettings />
              </TabsContent>
              
              <TabsContent value="app">
                <AppSettings />
              </TabsContent>
              
              {isCoach && (
                <TabsContent value="coach">
                  <CoachSettings />
                </TabsContent>
              )}
              
              {isStudent && (
                <TabsContent value="student">
                  <StudentSettings />
                </TabsContent>
              )}
              
              {isCoach && (
                <TabsContent value="billing">
                  <BillingSettings />
                </TabsContent>
              )}
              
              <TabsContent value="support">
                <SupportSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
