import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCoachStudent } from '@/context/CoachStudentContext';
import Icon from '@/components/ui/Lucide';
import { CoachComment, CommentTag, StudentProfile } from '@/types/poker';

// Mock data for the demo
const createMockComments = () => {
  const comments: CoachComment[] = [];
  const tags: CommentTag[] = ['common_mistake', 'aggressive_play', 'good_decision', 'needs_review'];
  const statuses = ['unread', 'read', 'implemented', 'needs_clarification'] as const;
  
  for (let i = 0; i < 20; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i % 10);
    
    comments.push({
      id: `comment-${i}`,
      coachId: 'coach-1',
      studentId: `student-${i % 3}`,
      sessionId: `session-${i % 5}`,
      handId: i % 2 === 0 ? `hand-${i}` : undefined,
      content: i % 3 === 0 
        ? `When facing a 3bet from the button, you should be more selective with your calling range.` 
        : i % 3 === 1
        ? `Good job value betting the river. You sized it perfectly to get called by worse.`
        : `Consider using a smaller bet size on dry flops to get more value.`,
      tag: tags[i % tags.length],
      createdAt: date,
      status: statuses[i % statuses.length]
    });
  }
  
  return comments;
};

const CoachFeedbackArchive = () => {
  const navigate = useNavigate();
  const { students } = useCoachStudent();
  
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Mock data for the demo
  const allComments = createMockComments();
  
  // Apply filters
  const filteredComments = allComments.filter(comment => {
    // Text search
    if (search && !comment.content.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    // Tag filter
    if (selectedTag !== 'all' && comment.tag !== selectedTag) {
      return false;
    }
    
    // Student filter
    if (selectedStudent !== 'all' && comment.studentId !== selectedStudent) {
      return false;
    }
    
    // Status filter
    if (selectedStatus !== 'all' && comment.status !== selectedStatus) {
      return false;
    }
    
    return true;
  });
  
  // Sort by newest first
  const sortedComments = [...filteredComments].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const getTagBadgeClass = (tag: CommentTag | undefined) => {
    switch (tag) {
      case 'good_decision':
        return 'bg-green-100 text-green-700';
      case 'common_mistake':
        return 'bg-red-100 text-red-700';
      case 'aggressive_play':
        return 'bg-amber-100 text-amber-700';
      case 'needs_review':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'unread':
        return 'text-gray-500';
      case 'read':
        return 'text-blue-500';
      case 'implemented':
        return 'text-green-500';
      case 'needs_clarification':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Find student name by ID
  const getStudentName = (id: string) => {
    const student = students.find(s => s.id === id);
    return student ? student.displayName : `Student ${id.slice(-4)}`;
  };
  
  // Navigation handler for comments
  const handleNavigateToSession = (studentId: string, sessionId: string, handId?: string) => {
    const navigationUrl = handId
      ? `/coach/student/${studentId}/session/${sessionId}?handId=${handId}`
      : `/coach/student/${studentId}/session/${sessionId}`;
    
    navigate(navigationUrl);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate('/coach-dashboard')} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 className="text-2xl font-bold text-poker-black">Feedback Archive</h1>
          <p className="text-gray-500 text-sm mt-1">
            View and search all feedback you've provided to students
          </p>
        </header>
        
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="Search" />
              <span>Search & Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Search by content..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                  <Icon name="Search" className="absolute left-2 top-2.5 text-gray-400" size={16} />
                </div>
              </div>
              
              <div>
                <Label htmlFor="tag-filter">Tag</Label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger id="tag-filter">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    <SelectItem value="common_mistake">Common Mistake</SelectItem>
                    <SelectItem value="aggressive_play">Aggressive Play</SelectItem>
                    <SelectItem value="good_decision">Good Decision</SelectItem>
                    <SelectItem value="needs_review">Needs Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="implemented">Implemented</SelectItem>
                    <SelectItem value="needs_clarification">Needs Clarification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="MessageSquare" />
              <span>All Feedback</span>
              <span className="text-sm text-gray-500 font-normal ml-1">
                ({sortedComments.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedComments.length > 0 ? (
              <div className="space-y-4">
                {sortedComments.map(comment => (
                  <div key={comment.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getStudentName(comment.studentId)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleNavigateToSession(comment.studentId, comment.sessionId, comment.handId)}
                        className="flex items-center gap-1"
                        aria-label="View session"
                      >
                        <Icon name="external-link" size={14} />
                        <span>{comment.handId ? "View Hand" : "View Session"}</span>
                      </Button>
                    </div>
                    
                    <div className="text-sm mb-3">
                      <div className="text-xs text-gray-500 mb-1">
                        Session {comment.sessionId.slice(-8)}
                        {comment.handId && <span> • Hand {comment.handId.slice(-4)}</span>}
                      </div>
                      <div>{comment.content}</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        {comment.tag && (
                          <span className={`text-xs px-2 py-1 rounded-full ${getTagBadgeClass(comment.tag)}`}>
                            {comment.tag.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      
                      <div className={`text-xs ${getStatusClass(comment.status)}`}>
                        {comment.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No feedback found matching your search criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoachFeedbackArchive;
