import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/Lucide';
import { CoachComment, CommentTag } from '@/types/poker';

const createMockFeedback = (studentId: string) => {
  const feedback: CoachComment[] = [];
  const tags: CommentTag[] = ['common_mistake', 'aggressive_play', 'good_decision', 'needs_review'];
  const statuses = ['unread', 'read', 'implemented', 'needs_clarification'] as const;
  
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    feedback.push({
      id: `comment-${i}`,
      coachId: 'coach-1',
      studentId: studentId,
      sessionId: `session-${studentId}-${i % 5}`,
      handId: i % 2 === 0 ? `hand-${i}` : undefined,
      content: i % 2 === 0 
        ? `You should consider 3-betting more from the button against tight players.` 
        : `Overall good session. Your river decisions were sound and well-calculated.`,
      tag: tags[i % tags.length],
      createdAt: date,
      status: statuses[i % statuses.length]
    });
  }
  
  return feedback;
};

export const StudentFeedback = ({ studentId }: { studentId: string }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  
  const allFeedback = createMockFeedback(studentId);
  
  const filteredFeedback = allFeedback.filter(comment => {
    if (filter !== 'all' && comment.tag !== filter) {
      return false;
    }
    
    if (search && !comment.content.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  const getTagColor = (tag: CommentTag | undefined) => {
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
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <Icon name="check" size={14} className="text-blue-500" />;
      case 'implemented':
        return <Icon name="check" size={14} className="text-green-500" />;
      case 'needs_clarification':
        return <Icon name="alert-triangle" size={14} className="text-amber-500" />;
      default:
        return null;
    }
  };
  
  // Navigation handler for comments
  const handleNavigateToSession = (sessionId: string, handId?: string) => {
    if (handId) {
      navigate(`/session/${sessionId}?handId=${handId}`);
    } else {
      navigate(`/session/${sessionId}`);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Archive" />
            <span>Feedback Archive</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search feedback..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
              <Icon name="Search" className="absolute left-2 top-2.5 text-gray-400" size={16} />
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tag" />
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
          
          {filteredFeedback.length > 0 ? (
            <div className="space-y-3">
              {filteredFeedback.map(comment => (
                <div key={comment.id} className="border rounded-md p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="text-sm font-medium">
                        Session {comment.sessionId.slice(-8)}
                        {comment.handId && <span className="text-gray-500"> • Hand {comment.handId.slice(-4)}</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleNavigateToSession(comment.sessionId, comment.handId)}
                        className="h-7 w-7 p-0 rounded-full"
                        aria-label="View session"
                      >
                        <Icon name="external-link" size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm my-2">{comment.content}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      {comment.tag && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getTagColor(comment.tag)}`}>
                          {comment.tag.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {getStatusIcon(comment.status)}
                      <span>{comment.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No feedback found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
