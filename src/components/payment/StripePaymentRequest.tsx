
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CoachTier } from '@/types/poker';

interface StripePaymentRequestProps {
  amount: number;
  planName: string;
  tier: CoachTier;
  elementId: string;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Stripe?: any;
  }
}

const StripePaymentRequest: React.FC<StripePaymentRequestProps> = ({
  amount,
  planName,
  tier,
  elementId,
  onSuccess
}) => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load Stripe.js dynamically
    if (!document.querySelector('#stripe-js')) {
      const script = document.createElement('script');
      script.id = 'stripe-js';
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.body.appendChild(script);
      
      // Wait for Stripe to load
      script.onload = () => {
        initializeStripe();
      };
    } else {
      // Stripe already loaded
      initializeStripe();
    }

    return () => {
      // Clean up - hide any error messages if component unmounts
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = '';
      }
    };
  }, [elementId]);

  const initializeStripe = () => {
    if (!window.Stripe) {
      console.error("Stripe.js not loaded");
      return;
    }
    
    try {
      // Initialize Stripe with your publishable key
      // Note: Use a real publishable key from your Stripe dashboard
      const stripe = window.Stripe('pk_test_XXXXXXXXXXXXXXXXXXXX');
      
      // Create payment request
      const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: planName,
          amount: amount, // Amount in cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });
      
      // Create Elements instance
      const elements = stripe.elements();
      
      // Create PaymentRequest Button Element
      const prButton = elements.create('paymentRequestButton', {
        paymentRequest,
        style: {
          paymentRequestButton: {
            type: 'subscribe', // Use 'default', 'buy', or 'donate' as alternatives
            theme: 'dark',
            height: '40px',
          },
        },
      });
      
      // Check if the browser supports payment request
      paymentRequest.canMakePayment().then(result => {
        if (result) {
          setIsSupported(true);
          // Mount the button
          prButton.mount(`#${elementId}`);
        } else {
          // Payment request is not supported
          setIsSupported(false);
          document.getElementById(elementId)!.style.display = 'none';
        }
      });
      
      // Handle payment request completion
      paymentRequest.on('paymentmethod', async (event) => {
        try {
          // In a real implementation, you would send this to your server to create a subscription
          console.log('Payment method:', event.paymentMethod);
          
          // This is where you would typically make a call to your backend
          // to create a subscription using the payment method
          
          // For now, we'll just simulate success
          event.complete('success');
          
          toast({
            title: "Payment Successful",
            description: `Your subscription to ${planName} has been set up.`,
            variant: "default",
          });
          
          // Call the onSuccess callback
          onSuccess();
        } catch (error: any) {
          event.complete('fail');
          
          toast({
            title: "Payment Failed",
            description: error.message || "There was a problem processing your payment.",
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      console.error("Error initializing Stripe:", error);
      
      toast({
        title: "Stripe Error",
        description: "There was a problem initializing the payment system. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isSupported === false) {
    return (
      <div className="text-sm text-gray-500 text-center p-2">
        Apple Pay / Google Pay not supported on this device or browser.
      </div>
    );
  }
  
  return <div id={elementId} className="stripe-payment-request-button"></div>;
};

export default StripePaymentRequest;
