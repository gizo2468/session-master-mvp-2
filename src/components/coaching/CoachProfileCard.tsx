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

  // Mock data for now - these will be editable by the coach later
  const mockCoachingFocus = ['Tournaments', 'Cash Games'];
  const mockYearsExperience = 5;
  const mockStarRating = 4.2;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center space-x-1">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Icon key={`full-${i}`} name="Star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Icon name="Star" className="h-4 w-4 text-muted-foreground" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Icon name="Star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Icon key={`empty-${i}`} name="Star" className="h-4 w-4 text-muted-foreground" />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      </div>
    );
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
            {mockCoachingFocus.map((focus) => (
              <Badge key={focus} variant="secondary" className="text-xs">
                {focus}
              </Badge>
            ))}
          </div>
        </div>

        {/* Years of Experience */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Icon name="Award" className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Experience</span>
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            {mockYearsExperience} years of coaching experience
          </p>
        </div>

        {/* Star Rating */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Icon name="Star" className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Rating</span>
          </div>
          <div className="ml-6">
            {renderStars(mockStarRating)}
          </div>
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