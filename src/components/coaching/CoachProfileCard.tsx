import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';

interface CoachProfileCardProps {
  coach: {
    id: string;
    full_name: string;
    username: string;
    profile_picture?: string;
    bio?: string;
    students_coached_count?: number;
    coaching_focus?: string[];
    experience?: string;
  };
}

const CoachProfileCard: React.FC<CoachProfileCardProps> = ({ coach }) => {

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Coach Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coach Avatar and Basic Info */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={coach.profile_picture || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {getInitials(coach.full_name || coach.username || 'Coach')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {coach.full_name || coach.username}
            </h3>
            <p className="text-sm text-muted-foreground">
              @{coach.username}
            </p>
          </div>
        </div>

        {/* Coaching Focus */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Icon name="Target" className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Coaching Focus</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {coach.coaching_focus && coach.coaching_focus.length > 0 ? (
              coach.coaching_focus.map((focus) => (
                <Badge key={focus} variant="secondary" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                  {focus}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground ml-6">No coaching focus areas set</span>
            )}
          </div>
        </div>

        {/* Experience */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Icon name="Award" className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Experience</span>
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            {coach.experience || "No experience information provided"}
          </p>
        </div>

        {/* Students Coached */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Icon name="Users" className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Student Count</span>
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            {coach.students_coached_count || 0}
          </p>
        </div>

        {/* Bio/Tagline */}
        {coach.bio && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Icon name="Quote" className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">About</span>
            </div>
            <p className="text-sm text-muted-foreground ml-6 leading-relaxed">
              {coach.bio}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoachProfileCard;