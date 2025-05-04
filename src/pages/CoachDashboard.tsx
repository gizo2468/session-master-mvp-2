
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';
import StudentList from '@/components/coaching/StudentList';
import { Separator } from '@/components/ui/separator';
import FeatureLockOverlay from '@/components/coaching/FeatureLockOverlay';
import { coachTiers, hasFeatureAccess, getMaxStudents } from '@/utils/coachTiers';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ConnectionCodeDisplay from '@/components/coaching/ConnectionCodeDisplay';
import GenerateCodeButton from '@/components/coaching/GenerateCodeButton';
import PendingRequestsList from '@/components/coaching/PendingRequestsList';
import StudentsList from '@/components/coaching/StudentsList';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { isCoach, coachProfile, students } = useCoachStudent();
  const { user } = useAuth();
  
  if (!isCoach || !coachProfile || !user) {
    navigate('/coach-profile');
    return null;
  }

  // Coach tier details
  const coachTier = user.coachTier || 'free';
  const tierDetails = coachTiers[coachTier];
  const maxStudents = getMaxStudents(coachTier);
  const studentCount = students.length;
  const studentPercentage = maxStudents > 0 ? (studentCount / maxStudents) * 100 : 0;
  const atStudentLimit = (maxStudents > 0 && studentCount >= maxStudents);

  // Check for feature access
  const hasStudentManagement = true; // Free tier has this
  const hasFeedbackAccess = hasFeatureAccess(user.role, coachTier, 'Session Feedback');
  const hasAnalyticsAccess = hasFeatureAccess(user.role, coachTier, 'Advanced Analytics');
  const hasCommentTagging = hasFeatureAccess(user.role, coachTier, 'Comment Tagging');
  const hasNotifications = hasFeatureAccess(user.role, coachTier, 'Notification System');

  // Handle plan badge click
  const handlePlanBadgeClick = () => {
    navigate('/coach-upgrade');
  };

  // Helper function to get the appropriate plan badge variant
  const getPlanBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'free': return 'planFree';
      case 'starter': return 'planStarter';
      case 'pro': return 'planPro';
      case 'elite': return 'planElite';
      default: return 'planFree';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-poker-black">Coach Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your students and provide feedback</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    onClick={handlePlanBadgeClick}
                    variant={getPlanBadgeVariant(coachTier)}
                  >
                    {tierDetails.name}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to change plan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>
        
        {/* Main tab interface */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Icon name="BarChart2" size={16} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Icon name="User" size={16} />
              Coach Profile
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard">
            {/* Coach tier indicator */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Current Plan:</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span 
                            onClick={handlePlanBadgeClick}
                            className={`cursor-pointer hover:underline font-medium ${
                              coachTier === 'free' ? 'text-gray-600' : 
                              coachTier === 'starter' ? 'text-blue-600' :
                              coachTier === 'pro' ? 'text-poker-gold' : 'text-purple-600'
                            }`}
                          >
                            {tierDetails.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to change plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-sm text-gray-600">
                    Students: {studentCount} / {maxStudents}
                  </div>
                </div>
                <Progress 
                  value={studentPercentage} 
                  className={`h-2 ${
                    studentPercentage > 90 ? 'bg-red-100' : 
                    studentPercentage > 70 ? 'bg-amber-100' : 'bg-gray-100'
                  }`} 
                />
                <div className="flex justify-between mt-4">
                  <div className="text-xs text-gray-500">
                    {coachTier === 'free' ? (
                      <span className="flex items-center gap-1">
                        <Icon name="alert-circle" size={14} />
                        Limited features available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Icon name="check" size={14} className="text-poker-gold" />
                        Full access to coach features
                      </span>
                    )}
                  </div>
                  {coachTier === 'free' && (
                    <Button 
                      variant="link" 
                      onClick={handlePlanBadgeClick}
                      className="text-xs p-0 h-auto"
                    >
                      View available plans
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 gap-6 mb-6">
              {/* Student Management - Always available */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="users" />
                    <span>Student Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StudentList />
                </CardContent>
              </Card>
              
              {/* Recent Feedback - Locked for free tier */}
              <div className="relative">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="message-square" />
                      <span>Recent Feedback</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {coachProfile.comments && coachProfile.comments.length > 0 ? (
                        <div className="space-y-3">
                          {coachProfile.comments.slice(0, 5).map(comment => (
                            <div key={comment.id} className="border rounded-md p-3 text-sm">
                              <div className="flex justify-between mb-1">
                                <span className="font-medium">Session {comment.sessionId.slice(0, 8)}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700">{comment.content}</p>
                              <div className="flex justify-between items-center mt-2">
                                <div>
                                  {comment.tag && (
                                    <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                                      comment.tag === 'good_decision' ? 'bg-green-100 text-green-700' :
                                      comment.tag === 'common_mistake' ? 'bg-red-100 text-red-700' :
                                      comment.tag === 'aggressive_play' ? 'bg-amber-100 text-amber-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {comment.tag.replace('_', ' ')}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs ${
                                  comment.status === 'unread' ? 'text-gray-500' :
                                  comment.status === 'read' ? 'text-blue-500' :
                                  comment.status === 'implemented' ? 'text-green-500' :
                                  'text-amber-500'
                                }`}>
                                  {comment.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <p>No feedback comments yet.</p>
                          <p className="text-sm mt-2">Review your students' sessions to provide feedback.</p>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-center">
                        <Button 
                          onClick={() => navigate('/coach/feedback-archive')} 
                          variant="outline" 
                          size="sm"
                          disabled={!hasFeedbackAccess}
                        >
                          View All Feedback
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {!hasFeedbackAccess && (
                  <FeatureLockOverlay featureName="Feedback System" />
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Profile Tab Content */}
          <TabsContent value="profile">
            {/* Coach tier info card */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{coachProfile.displayName}</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          onClick={handlePlanBadgeClick}
                          variant={getPlanBadgeVariant(coachTier)}
                        >
                          {tierDetails.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to change plan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {coachProfile.bio && (
                  <p className="text-gray-500 mt-1 text-sm">{coachProfile.bio}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Student Capacity</span>
                      <span className={atStudentLimit ? "text-red-600 font-medium" : ""}>
                        {studentCount} / {maxStudents} students
                      </span>
                    </div>
                    <Progress 
                      value={studentPercentage} 
                      className={`h-2 ${
                        studentPercentage > 90 ? 'bg-red-100' : 
                        studentPercentage > 70 ? 'bg-amber-100' : 'bg-gray-100'
                      }`} 
                    />
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <GenerateCodeButton />
                    {coachTier === 'free' && (
                      <Button 
                        onClick={handlePlanBadgeClick}
                        variant="default"
                        className="w-full bg-poker-gold hover:bg-poker-darkGold h-7 text-xs px-2.5"
                      >
                        <Icon name="package-plus" size={14} className="mr-1.5" />
                        Upgrade Plan
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Connection Code Component wrapped with overlay if at student limit */}
            <div className="relative">
              <ConnectionCodeDisplay />
              {atStudentLimit && (
                <FeatureLockOverlay featureName="Additional Students" />
              )}
            </div>
            
            {/* Pending Requests Component */}
            <PendingRequestsList />
            
            {/* Students List Component */}
            <StudentsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CoachDashboard;
