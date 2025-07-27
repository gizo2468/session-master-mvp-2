import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Icon from '@/components/ui/Lucide';

interface ConnectedUser {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
}

const MyCoachingNetwork: React.FC = () => {
  const { user } = useAuth();
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isCoach = user?.role === 'coach';
  const isStudent = user?.role === 'student';
  
  // Load connected users on component mount and when user changes
  useEffect(() => {
    if (user?.id && (isCoach || isStudent)) {
      loadConnectedUsers();
    }
  }, [user?.id, isCoach, isStudent]);

  const loadConnectedUsers = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      let query;
      
      if (isCoach) {
        // Load connected students for coaches
        query = supabase
          .from('coach_student_connections')
          .select(`
            student_id,
            profiles!coach_student_connections_student_id_fkey (
              id,
              full_name,
              username,
              profile_picture
            )
          `)
          .eq('coach_id', user.id)
          .eq('status', 'approved');
      } else if (isStudent) {
        // Load connected coaches for students
        query = supabase
          .from('coach_student_connections')
          .select(`
            coach_id,
            profiles!coach_student_connections_coach_id_fkey (
              id,
              full_name,
              username,
              profile_picture
            )
          `)
          .eq('student_id', user.id)
          .eq('status', 'approved');
      }

      if (query) {
        const { data, error } = await query;
        
        if (error) {
          console.error('Error loading connected users:', error);
          return;
        }

        const users = data?.map((connection: any) => {
          const profile = isCoach 
            ? connection.profiles 
            : connection.profiles;
          return {
            id: profile.id,
            full_name: profile.full_name || '',
            username: profile.username || '',
            profile_picture: profile.profile_picture
          };
        }) || [];

        setConnectedUsers(users);
      }
    } catch (error) {
      console.error('Error in loadConnectedUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderConnections = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader" className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading connections...</span>
        </div>
      );
    }

    if (!isCoach && !isStudent) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="UserX" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Please set up your profile to view connections.</p>
        </div>
      );
    }

    if (connectedUsers.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {isCoach ? (
            <>
              <Icon name="Users" className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No connected players yet.</p>
            </>
          ) : (
            <>
              <Icon name="GraduationCap" className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No connected coaches yet.</p>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {connectedUsers.map((connectedUser) => (
          <div
            key={connectedUser.id}
            className="flex items-center space-x-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={connectedUser.profile_picture || ''} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(connectedUser.full_name || connectedUser.username || (isCoach ? 'Player' : 'Coach'))}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {connectedUser.full_name || connectedUser.username || (isCoach ? 'Player' : 'Coach')}
              </p>
              <p className="text-sm text-muted-foreground">
                {isCoach ? "Click to view player's shared content" : "Click to view shared sessions"}
              </p>
            </div>
            <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icon name="Network" className="h-5 w-5" />
          <span>My Coaching Network</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderConnections()}
      </CardContent>
    </Card>
  );
};

export default MyCoachingNetwork;