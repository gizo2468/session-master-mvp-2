import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Lucide';
import { ScrollArea } from '@/components/ui/scroll-area';

const TermsOfUse: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Terms of Use</h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-center">SessionMaster - Terms of Use</CardTitle>
            <p className="text-center text-muted-foreground">Last updated: July 23, 2025</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">1. Eligibility and Account Types</h2>
                  <p className="mb-3">
                    To use SessionMaster, you must be at least 13 years old. By registering, you affirm that you meet this requirement.
                  </p>
                  <p className="mb-3">There are currently two user roles in the app:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Player:</strong> Tracks personal sessions, goals, and notes.</li>
                    <li><strong>Coach:</strong> May connect with players to view session data, provide feedback, and monitor progress.</li>
                  </ul>
                  <p className="mt-3">
                    Players have full control over their data and must explicitly connect with a coach to share information.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">2. Subscriptions and Payments</h2>
                  <p className="mb-3">SessionMaster may offer premium features through subscription plans in the future. These subscriptions:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Will be available through Google Play and Apple App Store only.</li>
                    <li>May include a free trial period before billing begins.</li>
                  </ul>
                  <p className="mt-3">Until then, all core features are available free of charge.</p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">3. User-Generated Content</h2>
                  <p className="mb-3">Users may upload or submit content such as:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Notes</li>
                    <li>Screenshots</li>
                    <li>Feedback or messages shared between players and coaches</li>
                  </ul>
                  <p className="mt-3">
                    Currently, shared content is only visible to the connected coach. As the platform evolves, we reserve the right to moderate and remove content deemed inappropriate, offensive, or in violation of these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">4. Data Storage and Responsibility</h2>
                  <p className="mb-3">
                    While we take reasonable steps to protect your data using secure third-party services (e.g., Supabase), SessionMaster is a new and evolving platform, and we cannot guarantee the absence of technical issues, data loss, or service interruptions.
                  </p>
                  <p className="mb-3">You acknowledge that:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You are solely responsible for backing up your own session data or exported content.</li>
                    <li>We are not liable for any loss, damage, or corruption of data.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">5. Acceptable Use and Restrictions</h2>
                  <p className="mb-3">You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Use the app for unlawful purposes</li>
                    <li>Harass, abuse, or impersonate other users</li>
                    <li>Attempt to access unauthorized data</li>
                    <li>Upload harmful, defamatory, or offensive content</li>
                  </ul>
                  <p className="mt-3">
                    We reserve the right to suspend or terminate any account found to be in violation of these Terms, at our sole discretion.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">6. Modifications and Feature Changes</h2>
                  <p>
                    We may update or modify features, content, or these Terms at any time. When we do, we will notify users through the app or via email. Continued use of the app after changes implies acceptance of the new Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">7. Contact</h2>
                  <p>
                    If you have questions about these Terms, please contact us at:
                  </p>
                  <p className="font-medium">sessionmaster11@gmail.com</p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfUse;