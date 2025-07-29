import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';
import CoachProfileCard from '@/components/coaching/CoachProfileCard';
import PageContainer from '@/components/ui/PageContainer';

interface CoachData {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
  bio?: string;
}

const CoachProfile: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCoachData = async () => {
      if (!coachId || !user?.id) return;

      try {
        // Verify the user is connected to this coach
        const { data: connection, error: connectionError } = await supabase
          .from('coach_student_connections')
          .select('id')
          .eq('coach_id', coachId)
          .eq('student_id', user.id)
          .eq('status', 'approved')
          .single();

        if (connectionError || !connection) {
          toast({
            title: "Access denied",
            description: "You don't have access to view this coach's profile.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        // Load coach profile data
        const { data: coachProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, username, profile_picture, bio')
          .eq('id', coachId)
          .eq('role', 'coach')
          .single();

        if (profileError || !coachProfile) {
          console.error('Error loading coach profile:', profileError);
          toast({
            title: "Error",
            description: "Failed to load coach profile.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        setCoach(coachProfile);
      } catch (error) {
        console.error('Error in loadCoachData:', error);
        toast({
          title: "Error",
          description: "Something went wrong loading the coach profile.",
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadCoachData();
  }, [coachId, user?.id, navigate]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader" className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading coach profile...</span>
        </div>
      </PageContainer>
    );
  }

  if (!coach) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <Icon name="UserX" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Coach not found</h2>
          <p className="text-muted-foreground mb-4">
            The coach profile you're looking for could not be found.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2"
        >
          <Icon name="ArrowLeft" className="h-4 w-4" />
          <span>Back</span>
        </Button>
      </div>

      {/* Coach Profile Card */}
      <div className="mb-8">
        <CoachProfileCard coach={coach} />
      </div>

      {/* Placeholder sections for future content */}
      <div className="space-y-6">
        {/* Placeholder: Reviewed Sessions */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <Icon name="FileText" className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Reviewed Sessions</h3>
              <p className="text-sm">
                Session reviews and feedback from your coach will appear here.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder: Coach Feedback */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <Icon name="MessageSquare" className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Coach Feedback</h3>
              <p className="text-sm">
                Personal feedback and coaching notes will be displayed here.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder: Learning Progress */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <Icon name="TrendingUp" className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Learning Progress</h3>
              <p className="text-sm">
                Your progress tracking and improvement insights will be shown here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default CoachProfile;