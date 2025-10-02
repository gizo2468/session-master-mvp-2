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
              <li><strong>Account Information:</strong> Your email address, username, full name, and profile picture.</li>
              <li><strong>Session Data:</strong> Hands played, session logs, goals, notes, and performance metrics.</li>
              <li><strong>Location Information:</strong> Approximate location based on your device settings.</li>
              <li><strong>Device Information:</strong> Device type, operating system, version, crash reports, and general usage data that is non-identifiable.</li>
              <li><strong>Payment Information:</strong> Payment confirmations from Google Play, Apple App Store, or PayPal. We do not store full billing details.</li>
              <li><strong>User Actions:</strong> Your in-app behavior such as creating or editing sessions, submitting hands, and interactions between coaches and players.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect in order to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide and maintain the core features of the app.</li>
              <li>Track and analyze your gameplay and session performance.</li>
              <li>Store and display your session history and goals.</li>
              <li>Enable interactions between coaches and players.</li>
              <li>Improve the functionality, stability, and overall user experience of the app.</li>
              <li>Process subscription payments and validate your purchase status.</li>
              <li>Send you essential notifications or updates related to your account or activity.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">3. Data Storage and Sharing</h2>
            <p>Your data is securely stored using Supabase, a trusted cloud database platform. We do not sell or rent your personal information to third parties. We may share anonymized and aggregated analytics data to improve our services.</p>
            <p>We may also use trusted third-party services, such as Firebase or Google Analytics, to help us analyze app performance or deliver core functionality. These services may collect basic usage data in accordance with their own privacy policies.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Cookies and Tracking</h2>
            <p>SessionMaster does not use cookies in the traditional web sense, but third-party services integrated into the app (such as Supabase or analytics tools) may use similar technologies for error tracking, authentication, or performance monitoring.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active or as necessary to provide you with our services. If you request account deletion, your personal data will be permanently removed from our systems within a reasonable timeframe (usually within 30 days), unless we are required to keep certain information for legal or security reasons.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Your Rights</h2>
            <p>You have the following rights regarding your data:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> You may request a copy of the information we store about you.</li>
              <li><strong>Edit:</strong> You can update your profile details directly in the app.</li>
              <li><strong>Delete:</strong> You may request account deletion by contacting us at: sessionmaster11@gmail.com.</li>
            </ul>
            <p>An in-app account deletion feature will also be available in a future release to comply with Google and Apple requirements.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Data Security</h2>
            <p>We implement reasonable technical and organizational measures to protect your personal data from unauthorized access, disclosure, alteration, or destruction. However, no system can be 100% secure, and we cannot guarantee absolute security.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Children's Privacy</h2>
            <p>SessionMaster is not intended for use by individuals under the age of 13. We do not knowingly collect personal data from children. If we become aware that we have inadvertently collected information from a child under 13, we will delete it immediately.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">9. International Users</h2>
            <p>Currently, SessionMaster is intended for users in Israel and the United States. If we expand to other regions, this policy will be updated to comply with local regulations such as the GDPR (Europe) and the CCPA (California).</p>

            <h2 className="text-xl font-bold mt-6 mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. The latest version will always be available inside the app. Material changes will be communicated via in-app notice or email.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">11. Contact Us</h2>
            <p>If you have any questions or requests regarding your personal information or this policy, please contact us at:</p>
            <p><a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyModal;