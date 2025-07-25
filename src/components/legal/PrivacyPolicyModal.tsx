import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-serif">SessionMaster - Privacy Policy</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Last updated: July 23, 2025
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="px-6 pb-6 max-h-[calc(90vh-100px)]">
          <div className="prose max-w-none">
            <h2 className="text-xl font-bold mt-6 mb-3">1. Information We Collect</h2>
            <p>When you use SessionMaster, we may collect the following types of information:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Account Information: Email address, username, and profile picture.</li>
              <li>Session Data: Hands played, session logs, goals, notes, and performance metrics.</li>
              <li>Location Information: Approximate location based on your device settings.</li>
              <li>Device Information: Type of device, operating system, version, crash reports, and general usage data (non-identifiable).</li>
              <li>Payment Information: Payment confirmations from Google Play, Apple App Store, or PayPal (we do not store full billing details).</li>
              <li>User Actions: Your in-app behavior such as creating/editing sessions, submitting hands, and coach-player interactions.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>To provide and maintain the core features of the app.</li>
              <li>To track and analyze your gameplay and session performance.</li>
              <li>To store and display your session history and goals.</li>
              <li>To enable interactions between coaches and players.</li>
              <li>To improve the functionality, stability, and user experience of the app.</li>
              <li>To process subscription payments and validate purchase status.</li>
              <li>To send you essential notifications or updates related to your account or activity.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">3. Data Storage and Sharing</h2>
            <p>Your data is securely stored using Supabase, a trusted cloud database platform. We do not sell or rent your personal information to third parties. We may share anonymized analytics data to improve our services.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Your Rights</h2>
            <p>You have the following rights regarding your data:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access: You may request a copy of the information we store about you.</li>
              <li>Edit: You can update your profile details directly from the app.</li>
              <li>Delete: You may request account deletion by contacting us at: sessionmaster11@gmail.com</li>
            </ul>
            <p>(We plan to add in-app account deletion functionality in a future release.)</p>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Data Security</h2>
            <p>We implement reasonable technical and organizational measures to protect your personal data from unauthorized access, disclosure, alteration, or destruction.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Children's Privacy</h2>
            <p>SessionMaster is not intended for use by individuals under the age of 13. We do not knowingly collect personal data from children.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">7. International Users</h2>
            <p>Currently, SessionMaster is intended for users in Israel and the United States. If we expand to other regions, we will update this policy accordingly to comply with local regulations such as the GDPR (Europe).</p>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. The latest version will always be available inside the app. Material changes will be communicated to you via in-app notice or email.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">9. Contact Us</h2>
            <p>If you have any questions or requests regarding your personal information or this policy, please contact us at:</p>
            <p><a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyModal;