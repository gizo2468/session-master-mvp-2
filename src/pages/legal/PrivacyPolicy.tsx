
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-2xl font-serif font-bold text-poker-black mb-6">SessionMaster - Privacy Policy</h1>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-4">Last updated: July 23, 2025</p>
            
            <p className="mb-4">At SessionMaster, we respect your privacy. We only collect the information that is strictly necessary to provide and improve the app.</p>
            
            <p className="mb-4"><strong>What we do not collect:</strong> We do not collect or access your external financial profits or losses, bankroll amounts held outside the app, bank or card numbers, external account balances or transactions, government IDs, or precise GPS location. We also do not scrape or import data from poker sites or payment providers. Any monetary figures you choose to enter in the app are stored in your SessionMaster account solely to power in-app analytics and features, and are not linked to your external financial accounts.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">1. Information We Collect</h2>
            <p>When you use SessionMaster, we may collect the following types of information.</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Account Information:</strong> Your email address, username, full name, and profile picture.</li>
              <li><strong>Session Data:</strong> Hands played, session logs, goals, notes, and performance metrics necessary to provide core app features.</li>
              <li><strong>Location Information:</strong> Approximate location based on your device settings. We do not collect or track precise GPS location.</li>
              <li><strong>Device Information:</strong> Device type, operating system, version, crash reports, and general usage data that is non-identifiable.</li>
              <li><strong>Payment Information:</strong> Payment confirmations from Google Play, Apple App Store, or PayPal for subscription validation. We do not store full billing details.</li>
              <li><strong>User Actions:</strong> Your in-app behavior such as creating or editing sessions, submitting hands, and coach-player interactions.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide and maintain the app, track and analyze your gameplay and session performance, store and display your session history and goals, enable coach-player interactions with your explicit connection, improve functionality and user experience, process subscription payments and validate purchase status, and send essential account or activity notifications.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">3. Data Storage and Sharing</h2>
            <p>Your data is securely stored using Supabase, a trusted cloud database platform. We do not sell or rent your personal information to third parties. We may share anonymized and aggregated analytics to improve our services. We may use trusted service providers to help us analyze app performance or deliver core functionality in accordance with their privacy policies.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Cookies and Tracking</h2>
            <p>SessionMaster does not use traditional web cookies. Certain integrated services may use similar technologies for authentication, error tracking, or performance monitoring.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active or as necessary to provide the service. If you request account deletion, your personal data will be permanently removed within a reasonable timeframe, usually within 30 days, unless we must retain certain information for legal or security reasons.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Your Rights</h2>
            <p>You may request a copy of the information we store about you, update your profile details in the app, or request account deletion by contacting us at sessionmaster11@gmail.com. An in-app account deletion feature is planned to further streamline this process.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Data Security</h2>
            <p>We implement reasonable technical and organizational measures to protect your personal data from unauthorized access, disclosure, alteration, or destruction. No system is completely secure, and we cannot guarantee absolute security.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Children's Privacy</h2>
            <p>SessionMaster is not intended for individuals under 13. We do not knowingly collect personal data from children. If we learn that we have collected data from a child under 13, we will delete it promptly.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">9. International Users</h2>
            <p>SessionMaster currently serves users in Israel and the United States. If we expand to additional regions, we will update this policy to comply with local regulations such as GDPR and CCPA.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. The latest version will always be available in the app. Material changes will be communicated via in-app notice or email.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">11. Contact Us</h2>
            <p>If you have questions or requests about your personal information or this policy, contact sessionmaster11@gmail.com.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
