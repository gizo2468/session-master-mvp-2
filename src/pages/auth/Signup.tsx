
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserRole } from '@/types/poker';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import PrivacyPolicyModal from '@/components/legal/PrivacyPolicyModal';
import TermsOfUseModal from '@/components/legal/TermsOfUseModal';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(20, { message: 'Username must be 20 characters or less' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  confirmPassword: z.string(),
  role: z.enum(['student', 'coach'], { required_error: 'Please select a role' }),
  coachingFocus: z.array(z.string()).optional(),
  experience: z.string().optional(),
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms of Use and Privacy Policy" })
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;

const Signup: React.FC = () => {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      coachingFocus: [],
      experience: '',
      agreeToTerms: false as unknown as true,
    },
  });

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return;
    
    setIsCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .limit(1);
      
      if (error) {
        console.error('Error checking username:', error);
        return;
      }
      
      if (data && data.length > 0) {
        form.setError('username', { message: 'Username is already taken' });
      } else {
        form.clearErrors('username');
      }
    } catch (error) {
      console.error('Username check failed:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Check email availability
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    try {
      // Check if email exists in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .ilike('email', email)
        .limit(1);
      
      if (error) {
        console.error('Error checking email availability:', error);
        return false;
      }
      
      return data && data.length === 0; // true if email is available
    } catch (error) {
      console.error('Email check failed:', error);
      return false;
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      console.log("Signup form submitted with values:", {
        email: values.email,
        role: values.role,
        fullName: values.fullName,
        username: values.username
      });
      
      // Final username availability check with proper error handling
      try {
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .ilike('username', values.username)
          .limit(1);
        
        if (checkError) {
          // If username column doesn't exist yet, we'll handle it in the trigger
          console.warn("Username check failed (likely migration not applied):", checkError.message);
        } else if (existingUsers && existingUsers.length > 0) {
          toast({
            title: "Username Unavailable",
            description: "The username you selected is already taken. Please choose a different one.",
            variant: "destructive",
          });
          return;
        }
      } catch (usernameError) {
        console.warn("Username availability check failed:", usernameError);
        // Continue with signup - let the database constraints handle uniqueness
      }

      // Check email availability before attempting signup
      const emailAvailable = await checkEmailAvailability(values.email);
      if (emailAvailable === false) {
        toast({
          title: "Email Already Registered",
          description: "This email is already registered. Please sign in instead or use a different email.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if email confirmation is enabled
      const { data: { user }, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            fullName: values.fullName,
            username: values.username,
            role: values.role,
            coachingFocus: values.coachingFocus,
            experience: values.experience,
            hasAcceptedTerms: values.agreeToTerms
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error("Signup error:", error);
        
        // Check for specific error types and provide clear messages
        if (error.message.includes('User already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('email address not authorized') ||
            error.code === 'user_already_exists') {
          toast({
            title: "Email Already Registered",
            description: "This email is already registered. Please sign in instead or try resetting your password.",
            variant: "destructive",
          });
        } else if (error.message.includes('username') || 
                   error.message.includes('unique') ||
                   error.message.includes('already taken')) {
          toast({
            title: "Username Unavailable", 
            description: "The username you selected is already taken. Please choose a different one.",
            variant: "destructive",
          });
        } else if (error.message.includes('email') && error.message.includes('already')) {
          toast({
            title: "Email Already Registered",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Signup Failed",
            description: error.message || "An error occurred during signup. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      // Check if user needs email confirmation
      if (user && !user.email_confirmed_at) {
        console.log("Email confirmation required for user:", user.id);
        setUserEmail(values.email);
        setShowEmailConfirmation(true);
        toast({
          title: "Account Created!",
          description: "Please check your email to confirm your account before signing in.",
        });
      } else {
        // User is immediately confirmed (auto-confirm is enabled)
        console.log("User immediately confirmed, redirecting to home");
        toast({
          title: "Account Created!",
          description: "Welcome to Session Master! You can now start tracking your poker sessions.",
        });
        navigate('/');
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!userEmail) return;
    
    setIsResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error("Error resending verification email:", error);
        toast({
          title: "Resend Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification Email Sent",
          description: "We've sent another verification email to your inbox.",
        });
      }
    } catch (error) {
      console.error("Error resending verification email:", error);
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const roleOptions = [
    {
      value: 'student',
      label: 'Player',
      description: 'Track your poker sessions and connect with coaches for feedback',
    },
    { 
      value: 'coach',
      label: 'Coach',
      description: 'Help players improve their poker game with insights and feedback',
    },
  ];

  const coachingFocusOptions = [
    'Tournaments',
    'Cash Games', 
    'GTO Tools',
    'Mental Game',
    'Bankroll Management',
    'Live Play Strategy',
    'Online Strategy'
  ];

  const selectedRole = form.watch('role');
  const selectedCoachingFocus = form.watch('coachingFocus') || [];

  // Show email confirmation screen
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl font-serif">Check Your Email</CardTitle>
            <CardDescription>We've sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="Mail" className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600">
              We've sent a confirmation link to <strong>{userEmail}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Please check your email and click the confirmation link to activate your account. 
              You won't be able to sign in until you confirm your email address.
            </p>
            <div className="pt-4">
              <Button 
                onClick={resendVerificationEmail}
                disabled={isResendingEmail}
                className="w-full"
              >
                {isResendingEmail ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Already confirmed?{' '}
              <Link to="/auth/login" className="text-poker-gold hover:underline">
                Sign In
              </Link>
            </p>
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
          <CardTitle className="text-2xl font-serif">Create Account</CardTitle>
          <CardDescription>Sign up to start using Session Master</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value.length >= 3) {
                              checkUsernameAvailability(e.target.value);
                            }
                          }}
                        />
                        {isCheckingUsername && (
                          <Icon name="Loader" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <Icon 
                            name={showPassword ? "EyeOff" : "Eye"} 
                            className="h-4 w-4 text-gray-400" 
                          />
                        </Button>
                      </div>
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
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <Icon 
                            name={showConfirmPassword ? "EyeOff" : "Eye"} 
                            className="h-4 w-4 text-gray-400" 
                          />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>I am a:</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {roleOptions.map((option) => (
                          <FormItem className="flex items-center space-x-3 space-y-0" key={option.value}>
                            <FormControl>
                              <RadioGroupItem value={option.value} />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="font-medium">{option.label}</FormLabel>
                              <p className="text-xs text-gray-500">{option.description}</p>
                            </div>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === 'coach' && (
                <>
                  <FormField
                    control={form.control}
                    name="coachingFocus"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Coaching Focus</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {coachingFocusOptions.map((option) => (
                              <Badge
                                key={option}
                                variant={selectedCoachingFocus.includes(option) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => {
                                  const current = field.value || [];
                                  const updated = current.includes(option)
                                    ? current.filter(item => item !== option)
                                    : [...current, option];
                                  field.onChange(updated);
                                }}
                              >
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Experience
                          <AdaptiveTooltip
                            content={
                              <div className="space-y-2">
                                <p className="font-medium">What to include here:</p>
                                <p className="text-sm">
                                  Briefly describe your coaching background. You can mention how many years of experience you have, the types of poker formats you specialize in, and any notable achievements or credentials (e.g., "6 years coaching online MTTs, WSOP bracelet winner, focus on exploitative play").
                                </p>
                              </div>
                            }
                          >
                            <Icon name="CircleHelp" className="h-4 w-4 text-muted-foreground cursor-pointer" />
                          </AdaptiveTooltip>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., 5 years coaching MTTs and heads-up play"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="agreeToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        By signing up, you agree to our{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTermsModal(true);
                          }}
                          className="text-poker-gold hover:underline cursor-pointer"
                        >
                          Terms of Use
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPrivacyModal(true);
                          }}
                          className="text-poker-gold hover:underline cursor-pointer"
                        >
                          Privacy Policy
                        </button>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

               <Button 
                 type="submit" 
                 className="w-full"
                 disabled={!form.formState.isValid || !form.watch('agreeToTerms') || isSubmitting}
               >
                 {isSubmitting ? "Creating Account..." : "Create Account"}
               </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-poker-gold hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
      
      <PrivacyPolicyModal 
        open={showPrivacyModal} 
        onOpenChange={setShowPrivacyModal} 
      />
      
      <TermsOfUseModal 
        open={showTermsModal} 
        onOpenChange={setShowTermsModal} 
      />
    </div>
  );
};

export default Signup;
