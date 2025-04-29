
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const CoachingNav = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const isCoach = user?.role === 'coach';
  
  if (!user) return null;
  
  return (
    <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="font-extrabold text-xl tracking-tight mb-4">{t('coaching')}</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {isCoach ? (
          <>
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center py-6 h-auto"
              onClick={() => navigate('/coach-profile')}
            >
              <Icon name="Users" className="h-6 w-6 mb-2" />
              <span>{t('coach_profile')}</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center py-6 h-auto"
              onClick={() => navigate('/coach-dashboard')}
            >
              <Icon name="LayoutDashboard" className="h-6 w-6 mb-2" />
              <span>{t('coach_dashboard')}</span>
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center py-6 h-auto"
              onClick={() => navigate('/player-dashboard')}
            >
              <Icon name="LayoutDashboard" className="h-6 w-6 mb-2" />
              <span>{t('player_dashboard')}</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center py-6 h-auto"
              onClick={() => navigate('/connect-coach')}
            >
              <Icon name="UserPlus" className="h-6 w-6 mb-2" />
              <span>{t('connect_with_coach')}</span>
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default CoachingNav;
