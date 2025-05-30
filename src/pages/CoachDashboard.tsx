
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface SessionComment {
  id: string;
  session_id: string;
  coach_id: string;
  student_id: string;
  comment: string;
  hand_number?: number;
  created_at: string;
}

interface PlayerFeedback {
  id: string;
  player_id: string;
  feedback_type: string;
  message: string;
  session_id?: string;
  created_at: string;
  read: boolean;
}

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { isCoach, coachProfile, students } = useCoachStudent();
  const { user } = useAuth();
  const [recentFeedback, setRecentFeedback] = useState<SessionComment[]>([]);
  const [playerFeedback, setPlayerFeedback] = useState<PlayerFeedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  if (!isCoach || !coachProfile || !user) {
    navigate('/coach-profile');
    return null;
  }

  // Load recent feedback from the database
  useEffect(() => {
    loadRecentFeedback();
    loadPlayerFeedback();
  }, [user?.id]);

  const loadRecentFeedback = async () => {
    if (!user?.id) return;
    
    setLoadingFeedback(true);
    try {
      console.log('🔍 Loading recent feedback for coach:', user.id);
      
      const { data: comments, error } = await supabase
        .from('session_comments')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Error loading recent feedback:', error);
        return;
      }

      console.log('✅ Recent feedback loaded:', comments);
      setRecentFeedback(comments || []);
    } catch (error) {
      console.error('❌ Error in loadRecentFeedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const loadPlayerFeedback = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔍 Loading player feedback for coach:', user.id);
      
      const { data: feedback, error } = await supabase
        .from('player_to_coach_feedback')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Error loading player feedback:', error);
        return;
      }

      console.log('✅ Player feedback loaded:', feedback);
      setPlayerFeedback(feedback || []);
    } catch (error) {
      console.error('❌ Error in loadPlayerFeedback:', error);
    }
  };

  // Coach tier details - default to free for new users
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

  // Mark player feedback as read
  const markFeedbackAsRead = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('player_to_coach_feedback')
        .update({ read: true })
        .eq('id', feedbackId);

      if (error) {
        console.error('Error marking feedback as read:', error);
        return;
      }

      // Update local state
      setPlayerFeedback(prev => 
        prev.map(feedback => 
          feedback.id === feedbackId 
            ? { ...feedback, read: true }
            : feedback
        )
      );
    } catch (error) {
      console.error('Error in markFeedbackAsRead:', error);
    }
  };

  // Check if there's any feedback to show
  const totalFeedback = recentFeedback.length + playerFeedback.length;
  
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
              
              {/* Recent Feedback - Only show if feedback exists */}
              {totalFeedback > 0 && (
                <div className="relative">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="message-square" />
                        <span>Recent Feedback</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Player to Coach Feedback */}
                        {playerFeedback.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700">From Players</h4>
                            {playerFeedback.map(feedback => (
                              <div key={feedback.id} className="border rounded-md p-3 bg-blue-50">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <span className="text-sm font-medium">
                                      {getStudentName(feedback.player_id)}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {feedback.feedback_type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {new Date(feedback.created_at).toLocaleDateString()}
                                    </span>
                                    {!feedback.read && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markFeedbackAsRead(feedback.id)}
                                        className="h-6 px-2 text-xs"
                                      >
                                        Mark Read
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                <p className="text-sm my-2">{feedback.message}</p>
                                
                                <div className="flex justify-between items-center">
                                  <div className="text-xs text-gray-500">
                                    Player feedback
                                  </div>
                                  {!feedback.read && (
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
                        {recentFeedback.length > 0 && (
                          <div className="space-y-3">
                            {playerFeedback.length > 0 && <Separator />}
                            <h4 className="text-sm font-medium text-gray-700">Session Comments</h4>
                            {recentFeedback.map(comment => (
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
                                    Coach feedback
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  {!hasFeedbackAccess && (
                    <FeatureLockOverlay featureName="Feedback System" />
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
