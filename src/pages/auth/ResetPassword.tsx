
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/Lucide';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type FormValues = z.infer<typeof formSchema>;

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidRecoverySession, setHasValidRecoverySession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [recoverySessionDetected, setRecoverySessionDetected] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    let sessionChecked = false;

    // Set up auth state listener to handle the recovery session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event, session?.user?.email);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log("Password recovery event detected");
          setRecoverySessionDetected(true);
          
          if (session?.user) {
            console.log("Valid recovery session confirmed");
            setHasValidRecoverySession(true);
          }
          setIsCheckingSession(false);
          sessionChecked = true;
        } else if (event === 'SIGNED_IN' && session?.user && recoverySessionDetected) {
          // Handle case where recovery event already happened
          console.log("Signed in with recovery session");
          setHasValidRecoverySession(true);
          setIsCheckingSession(false);
          sessionChecked = true;
        } else if (event === 'SIGNED_OUT') {
          setHasValidRecoverySession(false);
          setRecoverySessionDetected(false);
          setIsCheckingSession(false);
          sessionChecked = true;
        }
      }
    );

    // Check for existing session after a short delay to let auth state change fire first
    const checkExistingSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!sessionChecked) {
        console.log("Checking for existing session");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("Found existing session, checking if it's a recovery session");
          // If we have a session but haven't detected a recovery event,
          // it might be a recovery session that was already established
          setHasValidRecoverySession(true);
        } else {
          console.log("No existing session found");
          toast({
            title: "Error",
            description: "Invalid or expired reset link. Please request a new password reset.",
            variant: "destructive",
          });
        }
        setIsCheckingSession(false);
      }
    };

    checkExistingSession();

    return () => subscription.unsubscribe();
  }, [toast, recoverySessionDetected]);

  const onSubmit = async (values: FormValues) => {
    if (!hasValidRecoverySession) {
      toast({
        title: "Error",
        description: "Invalid session. Please request a new password reset link.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: values.password 
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Your password has been reset successfully!",
      });

      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Password reset failed",
        description: error.message || "Could not reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Icon name="Loader" className="animate-spin mr-2" />
              <span>Verifying reset link...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasValidRecoverySession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl font-serif">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="poker" 
              className="w-full" 
              onClick={() => navigate('/auth/forgot-password')}
            >
              Request New Reset Link
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              variant="link" 
              className="text-sm text-gray-600 p-0 h-auto"
              onClick={() => navigate('/auth/login')}
            >
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-serif">Reset Your Password</CardTitle>
          <CardDescription>Create a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
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
                disabled={isLoading || !hasValidRecoverySession}
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader" className="mr-2 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="link" 
            className="text-sm text-gray-600 p-0 h-auto"
            onClick={() => navigate('/auth/login')}
          >
            Back to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
