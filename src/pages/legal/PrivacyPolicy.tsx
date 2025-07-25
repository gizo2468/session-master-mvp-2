import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Lucide';
import { ScrollArea } from '@/components/ui/scroll-area';

const PrivacyPolicy: React.FC = () => {
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
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-center">SessionMaster - Privacy Policy</CardTitle>
            <p className="text-center text-muted-foreground">Last updated: July 23, 2025</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">1. Information We Collect</h2>
                  <p className="mb-3">When you use SessionMaster, we may collect the following types of information:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Account Information:</strong> Email address, username, and profile picture.</li>
                    <li><strong>Session Data:</strong> Hands played, session logs, goals, notes, and performance metrics.</li>
                    <li><strong>Location Information:</strong> Approximate location based on your device settings.</li>
                    <li><strong>Device Information:</strong> Type of device, operating system, version, crash reports, and general usage data (non-identifiable).</li>
                    <li><strong>Payment Information:</strong> Payment confirmations from Google Play, Apple App Store, or PayPal (we do not store full billing details).</li>
                    <li><strong>User Actions:</strong> Your in-app behavior such as creating/editing sessions, submitting hands, and coach-player interactions.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">2. How We Use Your Information</h2>
                  <p className="mb-3">We use the information we collect for the following purposes:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>To provide and maintain the core features of the app.</li>
                    <li>To track and analyze your gameplay and session performance.</li>
                    <li>To store and display your session history and goals.</li>
                    <li>To enable interactions between coaches and players.</li>
                    <li>To improve the functionality, stability, and user experience of the app.</li>
                    <li>To process subscription payments and validate purchase status.</li>
                    <li>To send you essential notifications or updates related to your account or activity.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">3. Data Storage and Sharing</h2>
                  <p className="mb-3">
                    Your data is securely stored using Supabase, a trusted cloud database platform. We do not sell or rent your personal information to third parties. We may share anonymized analytics data to improve our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">4. Your Rights</h2>
                  <p className="mb-3">You have the following rights regarding your data:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Access:</strong> You may request a copy of the information we store about you.</li>
                    <li><strong>Edit:</strong> You can update your profile details directly from the app.</li>
                    <li><strong>Delete:</strong> You may request account deletion by contacting us at: sessionmaster11@gmail.com</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    (We plan to add in-app account deletion functionality in a future release.)
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">5. Data Security</h2>
                  <p>
                    We implement reasonable technical and organizational measures to protect your personal data from unauthorized access, disclosure, alteration, or destruction.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">6. Children's Privacy</h2>
                  <p>
                    SessionMaster is not intended for use by individuals under the age of 13. We do not knowingly collect personal data from children.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">7. International Users</h2>
                  <p>
                    Currently, SessionMaster is intended for users in Israel and the United States. If we expand to other regions, we will update this policy accordingly to comply with local regulations such as the GDPR (Europe).
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">8. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. The latest version will always be available inside the app. Material changes will be communicated to you via in-app notice or email.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3 text-primary">9. Contact Us</h2>
                  <p className="mb-2">
                    If you have any questions or requests regarding your personal information or this policy, please contact us at:
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

export default PrivacyPolicy;