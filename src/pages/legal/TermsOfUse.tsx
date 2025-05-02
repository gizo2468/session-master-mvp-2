
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';

const TermsOfUse: React.FC = () => {
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
          <h1 className="text-2xl font-serif font-bold text-poker-black mb-6">Terms of Use</h1>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-4">Effective Date: May 3, 2025</p>
            
            <p className="mb-4">
              Welcome to SessionMaster. These Terms of Use ("Terms") govern your access to and use of the 
              SessionMaster mobile application and related services (the "App"), operated by us ("we", "our", or "SessionMaster"). 
              By using our App, you agree to be bound by these Terms.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">1. Eligibility</h2>
            <p>You must be at least 16 years old to use the App. By creating an account, you confirm that you meet this requirement.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">2. Account Registration</h2>
            <p>To access most features, you must register and maintain an active account. You agree to provide accurate information and keep it up to date.</p>
            <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">3. Use of the App</h2>
            <p>You agree to use SessionMaster solely for lawful purposes and in accordance with these Terms. You may not:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the App for any fraudulent or harmful activity.</li>
              <li>Attempt to reverse-engineer or disrupt the App.</li>
              <li>Misuse coach-player connections for purposes outside of training or performance feedback.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Coach Features</h2>
            <p>If you upgrade your account to a Coach tier, you may connect with players, view their session data, and leave feedback.</p>
            <p>Coaches agree to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use student data responsibly and confidentially.</li>
              <li>Not misuse access for non-training purposes.</li>
              <li>Comply with all relevant data privacy laws.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Subscription & Payments</h2>
            <p>Certain features (such as Coach mode) are only available via paid subscription. By purchasing a subscription, you authorize us to charge the applicable fees.</p>
            <p>Prices and features are subject to change, but we'll notify you in advance where required.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Data & Privacy</h2>
            <p>Your data is handled according to our Privacy Policy. By using the App, you consent to the collection and use of your data as outlined there.</p>
            <p>You are responsible for reviewing and understanding our Privacy Policy before using the App.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Intellectual Property</h2>
            <p>All content in the App, including logos, features, and code, is the property of SessionMaster and protected by intellectual property laws. You may not copy, modify, or distribute any part of the App without our written consent.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Termination</h2>
            <p>We may suspend or terminate your account if you violate these Terms or misuse the App.</p>
            <p>You may delete your account at any time through the App. Upon deletion, your data will be permanently erased.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">9. Disclaimer</h2>
            <p>SessionMaster is provided "as-is" without warranties of any kind. We do not guarantee that the App will always be secure or error-free.</p>
            <p>Use of the App is at your own risk.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms occasionally. When we do, we will update the Effective Date above and notify users if the changes are significant.</p>

            <h2 className="text-xl font-bold mt-6 mb-3">11. Contact</h2>
            <p>If you have questions about these Terms, please contact us at:</p>
            <p>📧 <a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
