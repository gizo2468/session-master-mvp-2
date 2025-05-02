
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
          <h1 className="text-2xl font-serif font-bold text-poker-black mb-6">Privacy Policy</h1>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-4">Effective Date: May 3, 2025</p>
            
            <p className="mb-4">
              SessionMaster ("we", "our", or "us") is committed to protecting the privacy of our users ("you" or "your"). 
              This Privacy Policy explains how we collect, use, store, and share your personal information when you use our 
              mobile application ("App").
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">1. Information We Collect</h2>
            <p>We collect the following types of data:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Account Information: When you register or sign in, we collect your email address and a secure identifier (UUID) through our authentication provider (Supabase).</li>
              <li>Session Data: We collect and store poker session details you enter, such as session type, duration, location, and results.</li>
              <li>Coach Feedback: If you are connected to a coach, they may view your session data and leave comments.</li>
              <li>Device Info: We may collect non-personal technical information (e.g., OS version, screen size) to improve the app's functionality.</li>
            </ul>
            <p>We do not collect Android ID, device MAC address, or any persistent device identifiers.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">2. How We Use Your Information</h2>
            <p>Your data is used to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide and personalize the app experience.</li>
              <li>Store and track your poker sessions and history.</li>
              <li>Allow coach-student feedback functionality (if connected).</li>
              <li>Improve and analyze app performance.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">3. Legal Basis for Processing</h2>
            <p>We process your data under the following lawful bases:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>User Consent (e.g., accepting Terms & Privacy on signup).</li>
              <li>Legitimate Interest (e.g., app improvement).</li>
              <li>Contractual Necessity (e.g., managing your account and data).</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Data Sharing</h2>
            <p>We do not sell or rent your data to third parties. Your data may be shared only in the following cases:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>With coaches you actively connect with via pairing code.</li>
              <li>With service providers (e.g., Supabase) who help us store and secure your data under strict confidentiality agreements.</li>
              <li>When required by law.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Data Storage and Retention</h2>
            <p>All user data is securely stored using Supabase, a cloud database provider. Data is encrypted in transit and at rest.</p>
            <p>We retain your data as long as your account is active. If you delete your account or request deletion, all associated data will be permanently erased.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have rights to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access or export your data.</li>
              <li>Request data deletion.</li>
              <li>Revoke consent.</li>
              <li>File a complaint with a data protection authority.</li>
            </ul>
            <p>Requests can be sent to: <a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></p>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Children's Privacy</h2>
            <p>SessionMaster is not intended for users under the age of 16. We do not knowingly collect personal data from children.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Security</h2>
            <p>We take all reasonable steps to protect your personal data from unauthorized access or loss, including encryption, access controls, and secure infrastructure.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">9. International Transfers</h2>
            <p>We rely on Supabase and other third-party services that may process data outside your country. These transfers are protected by appropriate legal safeguards such as the EU-U.S. and Swiss-U.S. Data Privacy Frameworks.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy occasionally. When we do, we will update the "Effective Date" and notify users as required.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">11. Contact</h2>
            <p>If you have questions or concerns, please contact us at:</p>
            <p>📧 <a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
