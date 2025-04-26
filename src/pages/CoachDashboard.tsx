
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';
import StudentList from '@/components/coaching/StudentList';
import { Separator } from '@/components/ui/separator';
import LiveSessionIndicators from '@/components/coaching/LiveSessionIndicators';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { isCoach, coachProfile } = useCoachStudent();
  
  if (!isCoach || !coachProfile) {
    navigate('/coach-profile');
    return null;
  }

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
              onClick={() => navigate('/coach-profile')} 
              variant="outline"
              size="sm"
            >
              Coach Profile
            </Button>
          </div>
        </header>
        
        <div className="grid grid-cols-1 gap-6 mb-6">
          <LiveSessionIndicators />
          
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
                  >
                    View All Feedback
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
