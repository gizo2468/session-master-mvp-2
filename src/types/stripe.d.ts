
// Type definitions for Stripe.js
declare namespace Stripe {
  interface StripeStatic {
    (apiKey: string, options?: StripeOptions): Stripe;
    paymentRequest(options: PaymentRequestOptions): PaymentRequest;
    elements(options?: ElementsCreateOptions): Elements;
  }

  interface Stripe {
    elements(options?: ElementsCreateOptions): Elements;
    createToken(element: Element, options?: TokenCreateOptions): Promise<TokenResponse>;
    createSource(element: Element, options?: SourceCreateOptions): Promise<SourceResponse>;
    createPaymentMethod(type: string, element: Element, options?: PaymentMethodCreateOptions): Promise<PaymentMethodResponse>;
    confirmCardPayment(clientSecret: string, options?: ConfirmCardPaymentOptions): Promise<PaymentIntentResponse>;
    confirmCardSetup(clientSecret: string, options?: ConfirmCardSetupOptions): Promise<SetupIntentResponse>;
    retrieveSource(options: RetrieveSourceOptions): Promise<SourceResponse>;
    retrievePaymentIntent(clientSecret: string): Promise<PaymentIntentResponse>;
    retrieveSetupIntent(clientSecret: string): Promise<SetupIntentResponse>;
    paymentRequest(options: PaymentRequestOptions): PaymentRequest;
  }

  interface StripeOptions {
    stripeAccount?: string;
    apiVersion?: string;
    locale?: string;
  }

  interface Elements {
    create(type: string, options?: ElementsOptions): Element;
    getElement(type: string): Element | null;
  }

  interface Element {
    mount(domElement: string | HTMLElement): void;
    unmount(): void;
    destroy(): void;
    on(event: string, handler: (event?: any) => void): void;
    update(options: ElementsOptions): void;
  }

  interface ElementsCreateOptions {
    fonts?: Font[];
    locale?: string;
  }

  interface Font {
    family?: string;
    src?: string;
    weight?: string | number;
    style?: string;
    display?: string;
  }

  interface ElementsOptions {
    classes?: {
      [key: string]: string;
    };
    style?: {
      [key: string]: {
        [key: string]: string;
      };
    };
    paymentRequestButton?: PaymentRequestButtonOptions;
  }

  interface PaymentRequestButtonOptions {
    type?: string;
    theme?: string;
    height?: string;
  }

  interface PaymentRequestOptions {
    country: string;
    currency: string;
    total: {
      label: string;
      amount: number;
    };
    requestPayerName?: boolean;
    requestPayerEmail?: boolean;
    requestPayerPhone?: boolean;
    requestShipping?: boolean;
    shippingOptions?: Array<{
      id: string;
      label: string;
      detail: string;
      amount: number;
    }>;
  }

  interface PaymentRequest {
    canMakePayment(): Promise<{applePay?: boolean} | null>;
    on(event: string, handler: (event: any) => void): void;
    show(): void;
    update(options: PaymentRequestUpdateOptions): void;
  }

  interface PaymentRequestUpdateOptions {
    total?: {
      label: string;
      amount: number;
    };
    shippingOptions?: Array<{
      id: string;
      label: string;
      detail: string;
      amount: number;
    }>;
  }
}

declare global {
  interface Window {
    Stripe?: Stripe.StripeStatic;
  }
}

export {};
