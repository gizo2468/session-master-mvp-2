
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/ui/Lucide';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Mock coach data for demo
const mockCoaches = [
  {
    id: 'coach-1',
    displayName: 'Coach Demo',
    bio: 'Experienced poker coach specializing in tournament strategy',
  },
  {
    id: 'coach-2',
    displayName: 'Sarah Johnson',
    bio: 'Cash game specialist with 10+ years experience',
  }
];

const StudentSettings: React.FC = () => {
  const navigate = useNavigate();
  const { disconnectFromCoach } = useCoachStudent();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('student_settings')}</h2>
        
        {/* Connected Coaches Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-medium">{t('connected_coaches')}</h3>
          
          {mockCoaches.length > 0 ? (
            <div className="space-y-4">
              {mockCoaches.map(coach => (
                <Card key={coach.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-lg">{coach.displayName}</h4>
                        {coach.bio && <p className="text-sm text-gray-500">{coach.bio}</p>}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Icon name="UserMinus" className="mr-2 h-4 w-4" />
                            {t('disconnect')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirm')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('disconnect_confirmation')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => disconnectFromCoach()}
                            >
                              {t('disconnect')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('no_connected_coaches')}
            </div>
          )}
        </div>
        
        <Separator className="my-8" />
        
        {/* Upgrade to Coach Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t('upgrade_to_coach')}</h3>
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-lg font-medium mb-2">{t('become_coach')}</h4>
              <p className="text-sm text-gray-500 mb-4">
                {t('upgrade_to_coach_description')}
              </p>
              <Button 
                variant="poker"
                className="w-full"
                onClick={() => navigate('/coach-profile')}
              >
                <Icon name="Star" className="mr-2 h-4 w-4" />
                {t('upgrade_to_coach')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;
