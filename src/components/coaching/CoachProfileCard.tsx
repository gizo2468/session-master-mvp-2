import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/Lucide';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { IconMenuButton } from '@/components/ui/IconMenuButton';

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
  onAvatarClick?: () => void;
}

const CoachProfileCard: React.FC<CoachProfileCardProps> = ({ coach, onAvatarClick }) => {
  const { disconnectFromCoach } = useCoachStudent();

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
        <CardTitle className="text-2xl font-bold text-poker-gold">Coach Profile</CardTitle>
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
          <div className="ml-auto">
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconMenuButton aria-label="More options">
                    <Icon name="EllipsisVertical" className="h-5 w-5" />
                  </IconMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Icon name="UserMinus" className="mr-2 h-4 w-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your connection. You can reconnect later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => disconnectFromCoach(coach.id)}>
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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