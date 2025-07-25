import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsOfUseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-serif">SessionMaster - Terms of Use</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Last updated: July 23, 2025
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="px-6 pb-6 max-h-[calc(90vh-100px)]">
          <div className="prose max-w-none">
            <h2 className="text-xl font-bold mt-6 mb-3">1. Eligibility and Account Types</h2>
            <p>To use SessionMaster, you must be at least 13 years old. By registering, you affirm that you meet this requirement.</p>
            <p>There are currently two user roles in the app:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Player: Tracks personal sessions, goals, and notes.</li>
              <li>Coach: May connect with players to view session data, provide feedback, and monitor progress.</li>
            </ul>
            <p>Players have full control over their data and must explicitly connect with a coach to share information.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">2. Subscriptions and Payments</h2>
            <p>SessionMaster may offer premium features through subscription plans in the future. These subscriptions:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Will be available through Google Play and Apple App Store only.</li>
              <li>May include a free trial period before billing begins.</li>
            </ul>
            <p>Until then, all core features are available free of charge.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">3. User-Generated Content</h2>
            <p>Users may upload or submit content such as:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Notes</li>
              <li>Screenshots</li>
              <li>Feedback or messages shared between players and coaches</li>
            </ul>
            <p>Currently, shared content is only visible to the connected coach. As the platform evolves, we reserve the right to moderate and remove content deemed inappropriate, offensive, or in violation of these Terms.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Data Storage and Responsibility</h2>
            <p>While we take reasonable steps to protect your data using secure third-party services (e.g., Supabase), SessionMaster is a new and evolving platform, and we cannot guarantee the absence of technical issues, data loss, or service interruptions.</p>
            <p>You acknowledge that:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>You are solely responsible for backing up your own session data or exported content.</li>
              <li>We are not liable for any loss, damage, or corruption of data.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Acceptable Use and Restrictions</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the app for unlawful purposes</li>
              <li>Harass, abuse, or impersonate other users</li>
              <li>Attempt to access unauthorized data</li>
              <li>Upload harmful, defamatory, or offensive content</li>
            </ul>
            <p>We reserve the right to suspend or terminate any account found to be in violation of these Terms, at our sole discretion.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Modifications and Feature Changes</h2>
            <p>We may update or modify features, content, or these Terms at any time. When we do, we will notify users through the app or via email. Continued use of the app after changes implies acceptance of the new Terms.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Contact</h2>
            <p>If you have questions about these Terms, please contact us at:</p>
            <p><a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfUseModal;