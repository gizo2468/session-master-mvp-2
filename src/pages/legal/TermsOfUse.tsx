
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import Icon from '@/components/ui/Lucide';

const TermsOfUse: React.FC = () => {
  const navigate = useNavigate();
  const swipeBackRef = useSwipeBack({ fallbackPath: '/settings', screenName: 'TermsOfUse' });

  return (
    <div ref={swipeBackRef} className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost"
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:bg-transparent hover:text-poker-green"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-serif font-bold text-poker-black mb-6">SessionMaster – Terms of Use</h1>
        </header>

        <div className="bg-white dark:bg-card rounded-lg shadow-sm dark:shadow-black/20 p-6">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">Last updated: July 23, 2025</p>

            <h2 className="text-xl font-bold mt-6 mb-3">1. Eligibility and Account Types</h2>
            <p>To use SessionMaster, you must be at least 13 years old. By registering, you confirm that you meet this requirement. If we discover that a user is under the age of 13, their account will be deleted.</p>
            <p>There are currently two user roles in the app:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Player:</strong> Tracks personal sessions, goals, and notes.</li>
              <li><strong>Coach:</strong> May connect with players to view session data, provide feedback, and monitor progress.</li>
            </ul>
            <p>Players always have full control over their data and must explicitly connect with a coach to share information.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">2. Subscriptions and Payments</h2>
            <p>SessionMaster may offer premium features through subscription plans. These subscriptions:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Will be available exclusively through Google Play and Apple App Store.</li>
              <li>May include a free trial period before billing begins.</li>
              <li>Will be billed in accordance with Google and Apple policies.</li>
            </ul>
            <p>Refunds for subscriptions are handled directly by Google Play or Apple App Store, in line with their refund policies. SessionMaster does not process refunds directly.</p>
            <p>Until premium plans are introduced, all core features remain free of charge.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">3. User-Generated Content</h2>
            <p>Users may upload or submit content such as:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Notes</li>
              <li>Screenshots</li>
              <li>Feedback or messages shared between players and coaches</li>
            </ul>
            <p>Shared content is only visible to the connected coach. As the platform evolves, we reserve the right to moderate and remove content deemed inappropriate, offensive, or in violation of these Terms.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Data Storage and Responsibility</h2>
            <p>We take reasonable steps to protect your data using secure third-party services (e.g., Supabase). However, SessionMaster is a new and evolving platform, and we cannot guarantee the absence of technical issues, data loss, or service interruptions.</p>
            <p>You acknowledge that:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>You are solely responsible for backing up your own session data or exported content.</li>
              <li>We are not liable for any loss, damage, or corruption of data.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Acceptable Use and Restrictions</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the app for unlawful purposes.</li>
              <li>Harass, abuse, or impersonate other users.</li>
              <li>Attempt to access unauthorized data.</li>
              <li>Upload harmful, defamatory, or offensive content.</li>
            </ul>
            <p>We reserve the right to suspend or terminate any account found to be in violation of these Terms, at our sole discretion and without prior notice.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Intellectual Property</h2>
            <p>All intellectual property rights in SessionMaster, including the app design, features, code, trademarks, and branding, belong to SessionMaster. By using the app, you are granted a limited, non-exclusive, non-transferable license to use the app for personal purposes only. You may not copy, modify, distribute, or reverse engineer any part of the app.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, SessionMaster and its team shall not be liable for any indirect, incidental, or consequential damages, including but not limited to loss of data, loss of profits, or business interruptions, arising from the use or inability to use the app.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Modifications and Feature Changes</h2>
            <p>We may update or modify features, content, or these Terms at any time. When we do, we will notify users through the app or via email. Continued use of the app after changes are published means you accept the updated Terms.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">9. Governing Law</h2>
            <p>These Terms shall be governed by and interpreted in accordance with the laws of Israel. Any disputes arising from these Terms or your use of the app shall be subject to the exclusive jurisdiction of the courts in Tel Aviv, Israel.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">10. Contact</h2>
            <p>If you have questions about these Terms, please contact us at:</p>
            <p><a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
