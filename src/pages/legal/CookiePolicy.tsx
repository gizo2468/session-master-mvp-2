
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/Lucide';

const CookiePolicy: React.FC = () => {
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
          <h1 className="text-2xl font-serif font-bold text-poker-black mb-6">SessionMaster – Cookie Policy</h1>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6 max-h-[70vh] overflow-y-auto">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">Last updated: July 23, 2025</p>
            
            <p className="mb-6">
              This Cookie Policy explains how SessionMaster ("we", "our", or "us") uses cookies and similar technologies when you use our mobile app or any related websites or services that link to this policy (collectively, the "Services").
            </p>

            <p className="mb-6">
              By using the Services, you agree to the use of cookies as described in this policy. You may control or disable cookies through your device settings or browser settings, as explained below.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">1. What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small text files that are stored on your device when you visit a website or use certain online services. They are widely used to make websites work efficiently and to provide reporting information.
            </p>
            <p className="mb-6">
              Similar technologies may include local storage, SDKs, tracking pixels, and device identifiers.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">2. Do We Use Cookies?</h2>
            <p className="mb-4">
              As of now, SessionMaster does not actively use cookies or third-party trackers in the mobile app.
            </p>
            <p className="mb-2">
              However, in future versions of our app or related websites, we may use cookies or tracking technologies for purposes such as:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Analytics and usage statistics</li>
              <li>Remembering user preferences</li>
              <li>Marketing and retargeting</li>
              <li>Improving functionality and user experience</li>
            </ul>
            <p className="mb-6">
              If and when such features are added, users will be notified and asked for consent where required by law.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">3. Third-Party Cookies</h2>
            <p className="mb-6">
              If we integrate with services like Google Analytics, Meta (Facebook), or other tools, those services may place cookies on your device to collect data about your interactions with our app or website. Their use of your data is subject to their respective privacy policies.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">4. Your Cookie Choices</h2>
            <p className="mb-2">
              You can control cookies in several ways:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Browser Settings:</strong> You can usually change your browser settings to accept or reject cookies.</li>
              <li><strong>Mobile Devices:</strong> Mobile operating systems may allow you to limit ad tracking or reset your advertising ID.</li>
              <li><strong>Future Consent Tools:</strong> If we introduce cookie banners or consent management tools, you will be able to select your preferences directly.</li>
            </ul>
            <p className="mb-6">
              Please note that disabling cookies may affect the functionality of future features.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">5. Updates to This Policy</h2>
            <p className="mb-6">
              We may update this Cookie Policy from time to time to reflect changes in technology or regulations. Any updates will be posted within the app and/or website, with the "last updated" date clearly indicated.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">6. Contact Us</h2>
            <p className="mb-2">If you have any questions about our use of cookies, please contact us at:</p>
            <p className="mb-4">
              <a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">
                sessionmaster11@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
