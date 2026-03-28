
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/Lucide';
import { Separator } from '@/components/ui/separator';
import PrivacyPolicyModal from '@/components/legal/PrivacyPolicyModal';
import TermsOfUseModal from '@/components/legal/TermsOfUseModal';
import CookiePolicyModal from '@/components/legal/CookiePolicyModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const SupportSettings: React.FC = () => {
  const navigate = useNavigate();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to submit feedback.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          feedback_text: feedbackText.trim()
        });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback! We'll review it soon."
      });

      setFeedbackText('');
      setShowFeedbackForm(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission failed",
        description: "Unable to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        
        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
            <CardDescription className="text-center">
              Review our terms and policies or get help
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3" 
                 onClick={() => setShowPrivacyModal(true)}
                 role="button"
                 aria-label="View privacy policy">
              <div className="flex items-center">
                <Icon name="Shield" className="mr-3 text-gray-500 dark:text-muted-foreground h-4 w-4" />
                <span>Privacy Policy</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between border-b pb-3" 
                 onClick={() => setShowTermsModal(true)}
                 role="button"
                 aria-label="View terms of use">
              <div className="flex items-center">
                <Icon name="FileText" className="mr-3 text-gray-500 dark:text-muted-foreground h-4 w-4" />
                <span>Terms of Use</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between border-b pb-3" 
                 onClick={() => setShowCookieModal(true)}
                 role="button"
                 aria-label="View cookie policy">
              <div className="flex items-center">
                <Icon name="Cookie" className="mr-3 text-gray-500 dark:text-muted-foreground h-4 w-4" />
                <span>Cookie Policy</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between border-b pb-3" 
                 onClick={() => navigate('/help')}
                 role="button"
                 aria-label="View help">
              <div className="flex items-center">
                <Icon name="HelpCircle" className="mr-3 text-gray-500 dark:text-muted-foreground h-4 w-4" />
                <span>FAQ</span>
              </div>
              <Icon name="ChevronRight" className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </div>
            <div className="pt-1 space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = 'mailto:sessionmaster11@gmail.com'}
              >
                <Icon name="LifeBuoy" className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              >
                <Icon name="MessageSquare" className="mr-2 h-4 w-4" />
                Feedback / Bug Report
              </Button>

              {showFeedbackForm && (
                <div className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Enter your feedback, improvement idea, or bug report so we can address it in the best way possible."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button 
                    onClick={handleSubmitFeedback}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <PrivacyPolicyModal 
        open={showPrivacyModal} 
        onOpenChange={setShowPrivacyModal} 
      />
      
      <TermsOfUseModal 
        open={showTermsModal} 
        onOpenChange={setShowTermsModal} 
      />
      
      <CookiePolicyModal 
        open={showCookieModal} 
        onOpenChange={setShowCookieModal} 
      />
    </div>
  );
};

export default SupportSettings;
