
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { supabase, clearAuthState } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

const resetPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type FormValues = z.infer<typeof formSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const Login: React.FC = () => {
  const { login, isLoading, isAuthenticated, isInitialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const hasAttemptedRedirectRef = useRef(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get redirect path from location state or default to home
  const from = (location.state as { from?: string })?.from || '/';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Clear potentially corrupted tokens on component mount
  useEffect(() => {
    const checkAndClearPossiblyCorruptedTokens = async () => {
      try {
        // Only run once per component mount
        const { data } = await supabase.auth.getSession();
        
        // If we're on the login page and there's a corrupted token, clear it
        if (data.session?.expires_at && new Date(data.session.expires_at * 1000) < new Date()) {
          console.log("Login page: Expired token detected, signing out");
          await clearAuthState();
        }
      } catch (error) {
        console.error("Error in auth check:", error);
        // If there's an error reading the token, it might be corrupted, so sign out
        try {
          await clearAuthState();
        } catch (e) {
          console.error("Error clearing auth state:", e);
        }
      }
    };
    
    checkAndClearPossiblyCorruptedTokens();
    
    // Set a timeout to force the page to be interactive if auth never stabilizes
    authTimeoutRef.current = setTimeout(() => {
      if (!isInitialized) {
        console.log("Auth stabilization timeout - forcing form to be interactive");
        // Force the page to be interactive after timeout
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
      }
    }, 5000);
    
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, []);

  // Check if user is already authenticated and redirect if so
  useEffect(() => {
    // Only redirect if authenticated AND auth is initialized AND we haven't redirected yet
    if (isAuthenticated && isInitialized && !hasAttemptedRedirectRef.current) {
      console.log("User authenticated and auth initialized, redirecting from login page");
      hasAttemptedRedirectRef.current = true;
      // Always redirect to home page '/' instead of using the 'from' variable for consistency
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  const onSubmit = async (values: FormValues) => {
    // Don't attempt login if we've already redirected
    if (hasAttemptedRedirectRef.current) return;
    
    try {
      await login(values.email, values.password);
      // Don't navigate here - let the useEffect handle redirection
      // when isAuthenticated changes
    } catch (error) {
      // Error is handled in the AuthContext
      console.error("Login error:", error);
    }
  };

  const handlePasswordResetClick = () => {
    // Get the email from the login form if it exists
    const loginEmail = form.getValues("email");
    if (loginEmail) {
      resetPasswordForm.setValue("email", loginEmail);
    }
    setShowResetDialog(true);
  };

  const handlePasswordReset = async (values: ResetPasswordFormValues) => {
    setIsResettingPassword(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: "https://session-master-mvp.lovable.app/auth/reset-password",
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "If an account exists with this email, you'll receive instructions to reset your password.",
      });

      setShowResetDialog(false);
      resetPasswordForm.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-serif">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                variant="poker" 
                className="w-full mt-2" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader" className="mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 items-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-poker-gold hover:underline">
              Sign Up with details
            </Link>
          </p>
          <Button 
            variant="link" 
            className="text-sm text-gray-600 p-0 h-auto"
            onClick={handlePasswordResetClick}
          >
            Forgot your password? Click here to reset
          </Button>
        </CardFooter>
      </Card>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you instructions to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit(handlePasswordReset)} className="space-y-4">
              <FormField
                control={resetPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? (
                    <>
                      <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
