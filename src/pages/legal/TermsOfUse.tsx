
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
              SessionMaster mobile application and related services ("App"). By using the App, you agree 
              to be bound by these Terms.
            </p>

            <h2 className="text-xl font-bold mt-6 mb-3">1. Eligibility</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Users must be 16 years or older</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">2. Account Registration</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate information</li>
              <li>Keep login credentials secure</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">3. Use of the App</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Use lawfully</li>
              <li>Do not reverse-engineer or misuse</li>
              <li>Use coach features appropriately</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">4. Coach Features</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Available only via paid upgrade</li>
              <li>Coach can view player data and give feedback</li>
              <li>Must follow data privacy rules</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">5. Subscription & Payments</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Paid features available via subscription</li>
              <li>Subject to change with notice</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">6. Data & Privacy</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Governed by our Privacy Policy</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">7. Intellectual Property</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Content is owned by SessionMaster</li>
              <li>No copying or redistribution without permission</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">8. Termination</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>We may suspend/terminate for violations</li>
              <li>Users can delete account and data anytime</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">9. Disclaimer</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>App is provided "as-is" without guarantees</li>
            </ul>

            <h2 className="text-xl font-bold mt-6 mb-3">10. Changes to Terms</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Will be updated with new effective date and notice</li>
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

export default TermsOfUse;
