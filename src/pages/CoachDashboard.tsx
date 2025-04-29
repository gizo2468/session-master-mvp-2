
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';
import StudentList from '@/components/coaching/StudentList';
import { Separator } from '@/components/ui/separator';
import LiveSessionIndicators from '@/components/coaching/LiveSessionIndicators';
import FeatureLockOverlay from '@/components/coaching/FeatureLockOverlay';
import { coachTiers, hasFeatureAccess, getMaxStudents } from '@/utils/coachTiers';
import { Progress } from '@/components/ui/progress';

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

  // Check for feature access
  const hasStudentManagement = true; // Free tier has this
  const hasFeedbackAccess = hasFeatureAccess(user.role, coachTier, 'Session Feedback');
  const hasAnalyticsAccess = hasFeatureAccess(user.role, coachTier, 'Advanced Analytics');
  
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
              <h1 className="text-2xl font-serif font-bold text-poker-black">Coach Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your students and provide feedback</p>
            </div>
            <Button
              onClick={() => navigate('/coach-upgrade')} 
              variant={coachTier === 'free' ? 'poker' : 'outline'}
              size="sm"
              className="flex items-center gap-1"
            >
              {coachTier === 'free' ? (
                <>
                  <Icon name="Star" size={16} />
                  <span>Upgrade</span>
                </>
              ) : (
                <>
                  <Icon name="Star" size={16} />
                  <span>{tierDetails.name}</span>
                </>
              )}
            </Button>
          </div>
        </header>
        
        {/* Coach tier indicator */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Current Plan:</span>
                <span className={`${coachTier === 'free' ? 'text-gray-700' : 'text-poker-gold font-medium'}`}>
                  {tierDetails.name}
                </span>
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
                    <Icon name="AlertCircle" size={14} />
                    Limited features available
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Icon name="Check" size={14} className="text-poker-gold" />
                    Full access to coach features
                  </span>
                )}
              </div>
              {coachTier === 'free' && (
                <Button 
                  variant="link" 
                  onClick={() => navigate('/coach-upgrade')}
                  className="text-xs p-0 h-auto"
                >
                  View available plans
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Users" />
                <span>Student Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentList />
            </CardContent>
          </Card>
          
          <div className="relative">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Activity" />
                  <span>Live Sessions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LiveSessionIndicators />
              </CardContent>
            </Card>
            {!hasAnalyticsAccess && (
              <FeatureLockOverlay featureName="Live Session Tracking" />
            )}
          </div>
          
          <div className="relative">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MessageSquare" />
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
      </div>
    </div>
  );
};

export default CoachDashboard;
