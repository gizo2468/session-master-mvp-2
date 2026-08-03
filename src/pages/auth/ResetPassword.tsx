
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      console.log("Checking for password reset session...");
      
      try {
        // First, try to get tokens from URL parameters (for reset password flow)
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        // Also check URL hash (Supabase sometimes uses hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        
        const finalAccessToken = accessToken || hashAccessToken;
        const finalRefreshToken = refreshToken || hashRefreshToken;
        const finalType = type || hashType;
        
        console.log("Reset token check:", { 
          finalAccessToken: finalAccessToken ? 'present' : 'missing',
          finalRefreshToken: finalRefreshToken ? 'present' : 'missing',
          type: finalType
        });
        
        if (finalAccessToken && finalRefreshToken && finalType === 'recovery') {
          // Set the session with the tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken
          });
          
          if (error) {
            console.error("Error setting session:", error);
            throw error;
          }
          
          if (data.session?.user) {
            console.log("Valid session set for password reset");
            setHasValidSession(true);
          } else {
            console.log("Failed to establish session");
            setHasValidSession(false);
          }
        } else {
          // Fallback: check for existing session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error getting session:", error);
            throw error;
          }
          
          if (session?.user) {
            console.log("Existing valid session found");
            setHasValidSession(true);
          } else {
            console.log("No valid session or tokens found");
            toast({
              title: "Error",
              description: "No reset token found. Please request a new password reset link.",
              variant: "destructive",
            });
            setHasValidSession(false);
          }
        }
      } catch (error: any) {
        console.error("Session check failed:", error);
        toast({
          title: "Error",
          description: "Failed to verify reset link. Please try again.",
          variant: "destructive",
        });
        setHasValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [toast, searchParams]);

  const onSubmit = async (values: FormValues) => {
    if (!hasValidSession) {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background py-12 px-4">
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

  if (!hasValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background py-12 px-4">
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
              className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 p-0 h-auto"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background py-12 px-4">
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
                      <Input type="password" placeholder="••••••••" enableAutofill autoComplete="new-password" {...field} />
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
                      <Input type="password" placeholder="••••••••" enableAutofill autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                variant="poker" 
                className="w-full mt-2" 
                disabled={isLoading || !hasValidSession}
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
            className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 p-0 h-auto"
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
