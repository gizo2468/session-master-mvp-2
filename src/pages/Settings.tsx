
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
              <div className="container px-4 py-2">
                <TabsList className="flex flex-wrap gap-2 justify-start w-full">
                  <TabsTrigger value="account">{t('account_settings')}</TabsTrigger>
                  <TabsTrigger value="app">{t('app_settings')}</TabsTrigger>
                  {isCoach && <TabsTrigger value="coach">{t('coach_settings')}</TabsTrigger>}
                  {isStudent && <TabsTrigger value="student">{t('student_settings')}</TabsTrigger>}
                  {isCoach && <TabsTrigger value="billing">{t('billing')}</TabsTrigger>}
                  <TabsTrigger value="support">{t('help')}</TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <div className="p-6">
              <TabsContent value="account" className="mt-6">
                <AccountSettings />
              </TabsContent>
              
              <TabsContent value="app" className="mt-6">
                <AppSettings />
              </TabsContent>
              
              {isCoach && (
                <TabsContent value="coach" className="mt-6">
                  <CoachSettings />
                </TabsContent>
              )}
              
              {isStudent && (
                <TabsContent value="student" className="mt-6">
                  <StudentSettings />
                </TabsContent>
              )}
              
              {isCoach && (
                <TabsContent value="billing" className="mt-6">
                  <BillingSettings />
                </TabsContent>
              )}
              
              <TabsContent value="support" className="mt-6">
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
