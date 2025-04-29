
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
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Parse the token from the URL hash fragment
    const hashFragment = window.location.hash;
    let accessToken = null;

    // Check for the token in the hash (SPA format: #access_token=xxx&type=recovery)
    if (hashFragment) {
      const params = new URLSearchParams(hashFragment.substring(1));
      accessToken = params.get('access_token');
      
      if (accessToken) {
        console.log("Found access token in hash fragment");
        setToken(accessToken);
      }
    }

    // If not in the hash, check URL parameters (typically for server-side redirects)
    if (!accessToken) {
      const urlParams = new URLSearchParams(window.location.search);
      accessToken = urlParams.get('token');
      
      if (accessToken) {
        console.log("Found token in URL parameters");
        setToken(accessToken);
      }
    }

    if (!accessToken) {
      toast({
        title: "Error",
        description: "No reset token found. Please request a new password reset link.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid or expired token. Please request a new password reset link.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Update the user's password using the token
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
      toast({
        title: "Password reset failed",
        description: error.message || "Could not reset password. The link may have expired.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                disabled={isLoading || !token}
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
