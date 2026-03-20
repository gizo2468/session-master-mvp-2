
import React, { useEffect } from 'react';
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
import CoachDashboardSkeleton from '@/components/coaching/CoachDashboardSkeleton';
import { useCoachDashboardData } from '@/hooks/useCoachDashboardData';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { Skeleton } from '@/components/ui/skeleton';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { isCoach, coachProfile, students, profileLoading } = useCoachStudent();
  const { user } = useAuth();
  const { recentReviews, playerReviews, loading: dashboardLoading, markReviewAsRead } = useCoachDashboardData();
  const swipeBackRef = useSwipeBack({ fallbackPath: '/', screenName: 'CoachDashboard' });
  
  // Redirect non-coaches safely via useEffect
  const shouldRedirect = !profileLoading && user && !isCoach;
  
  useEffect(() => {
    if (shouldRedirect) {
      navigate('/player-dashboard');
    }
  }, [shouldRedirect, navigate]);

  // Show skeleton while profile is loading, user not available, or redirecting
  if (profileLoading || !user || !isCoach || !coachProfile) {
    return <CoachDashboardSkeleton />;
  }

  // Coach tier details - default to free for new users
  const coachTier = user?.coachTier || 'free';
  const tierDetails = coachTiers[coachTier];
  const maxStudents = getMaxStudents(coachTier);
  const studentCount = students.length;
  const studentPercentage = maxStudents > 0 ? (studentCount / maxStudents) * 100 : 0;
  const atStudentLimit = (maxStudents > 0 && studentCount >= maxStudents);

  // Check for feature access
  const hasStudentManagement = true; // Free tier has this
  const hasReviewAccess = hasFeatureAccess(user?.role, coachTier, 'Session Feedback');
  const hasAnalyticsAccess = hasFeatureAccess(user?.role, coachTier, 'Advanced Analytics');
  const hasCommentTagging = hasFeatureAccess(user?.role, coachTier, 'Comment Tagging');
  const hasNotifications = hasFeatureAccess(user?.role, coachTier, 'Notification System');

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

  // Get student name by ID
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.displayName : `Student ${studentId.slice(-4)}`;
  };

  // Navigation handler for comments
  const handleNavigateToSession = (studentId: string, sessionId: string, handNumber?: number) => {
    try {
      if (handNumber) {
        navigate(`/coach/student/${studentId}/session/${sessionId}?handId=hand-${handNumber}`);
      } else {
        navigate(`/coach/student/${studentId}/session/${sessionId}`);
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Check if there's any reviews to show
  const totalReviews = recentReviews.length + playerReviews.length;
  
  return (
    <div ref={swipeBackRef} className="min-h-screen bg-gray-50 content-safe">
      <div className="container mx-auto max-w-4xl px-4 pb-8">
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
              <p className="text-gray-500 text-sm mt-1">Manage your students and provide reviews</p>
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
              <Icon name="BarChart" size={16} />
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
              
              {/* Recent Reviews - Show loading state or content */}
              {(dashboardLoading || totalReviews > 0) && (
                <div className="relative">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="message-square" />
                        <span>Recent Reviews</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashboardLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="border rounded-md p-3">
                              <div className="flex justify-between items-start mb-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-20" />
                              </div>
                              <Skeleton className="h-4 w-full mb-2" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Player to Coach Reviews */}
                          {playerReviews.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-gray-700">From Players</h4>
                              {playerReviews.map(review => (
                                <div key={review.id} className="border rounded-md p-3 bg-blue-50">
                                  <div className="flex justify-between items-start mb-1">
                                    <div>
                                      <span className="text-sm font-medium">
                                        {getStudentName(review.player_id)}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-2">
                                        {review.review_type}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {new Date(review.created_at).toLocaleDateString()}
                                      </span>
                                      {!review.read && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => markReviewAsRead(review.id)}
                                          className="h-6 px-2 text-xs"
                                        >
                                          Mark Read
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm my-2">{review.message}</p>
                                  
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                      Player review
                                    </div>
                                    {!review.read && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        New
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Session Comments */}
                          {recentReviews.length > 0 && (
                            <div className="space-y-3">
                              {playerReviews.length > 0 && <Separator />}
                              <h4 className="text-sm font-medium text-gray-700">Session Comments</h4>
                              {recentReviews.map(comment => (
                                <div key={comment.id} className="border rounded-md p-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <div>
                                      <span className="text-sm font-medium">
                                        {getStudentName(comment.student_id)}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-2">
                                        Session {comment.session_id.slice(-8)}
                                        {comment.hand_number && <span> • Hand {comment.hand_number}</span>}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                      </span>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleNavigateToSession(comment.student_id, comment.session_id, comment.hand_number)}
                                        className="h-7 w-7 p-0 rounded-full flex items-center justify-center"
                                        aria-label="View session"
                                      >
                                        <Icon name="ExternalLink" size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <p className="text-sm my-2">{comment.comment}</p>
                                  
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                      Coach review
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {!hasReviewAccess && (
                    <FeatureLockOverlay featureName="Review System" />
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Profile Tab Content */}
          <TabsContent value="profile">
            {/* Coach tier info card */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{coachProfile?.displayName}</CardTitle>
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
                {coachProfile?.bio && (
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
