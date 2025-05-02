
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
            <ul className="list-disc pl-6 mb-4">
              <li>Account Information: email address and unique user ID (via Supabase)</li>
              <li>Session Data: session type, duration, results, etc.</li>
              <li>Coach Feedback: comments on sessions (if connected to a coach)</li>
              <li>Device Info: basic technical data (no Android ID or persistent identifiers)</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>To provide and personalize the app experience</li>
              <li>To store your session history</li>
              <li>To allow coach-student feedback</li>
              <li>To analyze and improve the app</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">3. Legal Basis for Processing</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>User Consent</li>
              <li>Legitimate Interest</li>
              <li>Contractual Necessity</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Data Sharing</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>With your connected coach</li>
              <li>With Supabase (for secure hosting)</li>
              <li>If legally required</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Data Storage and Retention</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Stored securely via Supabase (encrypted)</li>
              <li>Deleted upon account deletion or request</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Your Rights</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Access/export your data</li>
              <li>Request deletion</li>
              <li>Revoke consent</li>
              <li>Contact us: <a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Children's Privacy</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Not intended for users under 16</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Security</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Industry-standard encryption and access control</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">9. International Transfers</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Data may be processed outside your country with proper safeguards</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">10. Changes to This Policy</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Updates will be reflected with a new effective date and user notice</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">11. Contact</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Email: <a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
