
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import Icon from '@/components/ui/Lucide';

const CookiePolicy: React.FC = () => {
  const navigate = useNavigate();
  const swipeBackRef = useSwipeBack({ fallbackPath: '/settings', screenName: 'CookiePolicy' });

  return (
    <div ref={swipeBackRef} className="min-h-screen bg-gray-50">
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
          <h1 className="text-2xl font-serif font-bold text-poker-black mb-6">Cookie Policy</h1>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-4">Last updated: May 2025</p>
            
            <p className="mb-4">
              SessionMaster uses cookies and similar technologies to improve the functionality of the app, 
              enhance user experience, and support authentication and analytics.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">What Are Cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit or use a digital service. 
              They help us remember certain actions, preferences, or login sessions to make your experience 
              smoother and more secure.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">Why We Use Cookies</h2>
            <p>We may use cookies for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Authentication:</strong> To recognize users when they log in and maintain secure sessions.</li>
              <li><strong>Analytics:</strong> To understand how users interact with the app and improve usability.</li>
              <li><strong>Preferences:</strong> To remember your language, theme, or other UI settings.</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">Third-Party Cookies</h2>
            <p>
              Some cookies may be set by third-party services integrated into the app (e.g., Supabase authentication, 
              analytics tools, or other SDKs used in development).
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">Your Choices</h2>
            <p>
              By using the SessionMaster app, you agree to the use of cookies as described in this policy. 
              You can manage cookie settings from your device or browser, but disabling cookies may impact app functionality.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">Contact</h2>
            <p>If you have any questions about this policy, contact us at:</p>
            <p>📧 <a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
