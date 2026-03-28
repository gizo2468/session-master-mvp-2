import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CookiePolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CookiePolicyModal: React.FC<CookiePolicyModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-['Shippori_Antique_B1'] text-poker-gold">SessionMaster - Cookie Policy</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-muted-foreground">
            Last updated: July 23, 2025
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="px-6 pb-6 max-h-[70vh]">
          <div className="prose max-w-none">
            <p className="mb-4">
              This Cookie Policy explains how SessionMaster ("we", "our", or "us") uses cookies and similar technologies when you use our mobile app or any related websites or services that link to this policy (collectively, the "Services").
            </p>

            <p className="mb-6">
              By using the Services, you agree to the use of cookies as described in this policy. You may control or disable cookies through your device settings or browser settings, as explained below.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">1. What Are Cookies?</h3>
            <p className="mb-4">
              Cookies are small text files that are stored on your device when you visit a website or use certain online services. They are widely used to make websites work efficiently and to provide reporting information.
            </p>
            <p className="mb-4">
              Similar technologies may include local storage, SDKs, tracking pixels, and device identifiers.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">2. Do We Use Cookies?</h3>
            <p className="mb-4">
              As of now, SessionMaster does not actively use cookies or third-party trackers in the mobile app.
            </p>
            <p className="mb-4">
              However, in future versions of our app or related websites, we may use cookies or tracking technologies for purposes such as:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Analytics and usage statistics</li>
              <li>Remembering user preferences</li>
              <li>Marketing and retargeting</li>
              <li>Improving functionality and user experience</li>
            </ul>
            <p className="mb-4">
              If and when such features are added, users will be notified and asked for consent where required by law.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">3. Third-Party Cookies</h3>
            <p className="mb-4">
              If we integrate with services like Google Analytics, Meta (Facebook), or other tools, those services may place cookies on your device to collect data about your interactions with our app or website. Their use of your data is subject to their respective privacy policies.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">4. Your Cookie Choices</h3>
            <p className="mb-4">
              You can control cookies in several ways:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Browser Settings:</strong> You can usually change your browser settings to accept or reject cookies.</li>
              <li><strong>Mobile Devices:</strong> Mobile operating systems may allow you to limit ad tracking or reset your advertising ID.</li>
              <li><strong>Future Consent Tools:</strong> If we introduce cookie banners or consent management tools, you will be able to select your preferences directly.</li>
            </ul>
            <p className="mb-4">
              Please note that disabling cookies may affect the functionality of future features.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">5. Updates to This Policy</h3>
            <p className="mb-4">
              We may update this Cookie Policy from time to time to reflect changes in technology or regulations. Any updates will be posted within the app and/or website, with the "last updated" date clearly indicated.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">6. Contact Us</h3>
            <p className="mb-4">
              If you have any questions about our use of cookies, please contact us at:
            </p>
            <p>
              📧 <a href="mailto:sessionmaster11@gmail.com" className="text-poker-gold hover:underline">sessionmaster11@gmail.com</a>
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePolicyModal;