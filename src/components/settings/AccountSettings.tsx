
import React, { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/ui/Lucide';
import { supabase } from '@/integrations/supabase/client';

const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  onlineNickname: z.string().max(20, { message: 'Nickname must be 20 characters or less' }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const AccountSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | undefined>(user?.profilePicture);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Format last login date if available
  const lastLoginFormatted = user?.lastLoginAt 
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(user.lastLoginAt)
    : 'No recent login';
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      onlineNickname: user?.onlineNickname || '',
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (values: ProfileFormValues) => {
    setIsSubmittingProfile(true);
    
    setTimeout(() => {
      updateUser({ 
        fullName: values.fullName,
        onlineNickname: values.onlineNickname,
      });
      setIsSubmittingProfile(false);
    }, 500);
  };

  // Handle password reset via email
  const handleResetPasswordViaEmail = async () => {
    if (!user?.email) {
      toast({
        title: t('error'),
        description: 'No email address available for password reset.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsResettingPassword(true);
    
    try {
      // Send password reset email using Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: "https://session-master-mvp.lovable.app/auth/reset-password"
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: t('success'),
        description: 'Password reset email sent. Please check your inbox.',
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : 'Failed to send password reset email',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle profile picture click
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  // Handle profile picture change
  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: t('error'),
        description: 'File must be JPG, JPEG, or PNG',
        variant: 'destructive',
      });
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('error'),
        description: 'File size must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfileImage(result);
      updateUser({ profilePicture: result });
    };
    reader.readAsDataURL(file);
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('account_settings')}</h2>
        
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-8">
          <div className="flex flex-col items-center gap-3">
            <Avatar className="w-24 h-24 cursor-pointer" onClick={handleProfilePictureClick}>
              <AvatarImage src={profileImage} />
              <AvatarFallback className="text-lg bg-poker-gold text-white">
                {user?.fullName ? getInitials(user.fullName) : 'U'}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
            />
            <Button
              variant="outline"
              size="sm"
              className="text-sm"
              onClick={handleProfilePictureClick}
            >
              <Icon name="Upload" className="mr-2 h-4 w-4" />
              {t('upload_picture')}
            </Button>
          </div>
          
          <div className="flex-1 w-full">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('full_name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="onlineNickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Online Nickname</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={20} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <Input value={user?.username || 'Not set'} disabled />
                  <p className="text-xs text-gray-500 mt-1">Your unique username identifier</p>
                </FormItem>
                
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <Input value={user?.email} disabled />
                  <p className="text-xs text-gray-500 mt-1">Last login: {lastLoginFormatted}</p>
                </FormItem>
                
                {/* Coaching Fields - Only show for coach users */}
                {user?.role === 'coach' && (
                  <>
                    <FormItem>
                      <FormLabel>Coaching Focus</FormLabel>
                      <div className="flex flex-wrap gap-2 p-3 min-h-[40px] bg-gray-50 border rounded-md">
                        {user?.coachingFocus && user.coachingFocus.length > 0 ? (
                          user.coachingFocus.map((focus, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-poker-blue text-white"
                            >
                              {focus}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No coaching focus areas set</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Your coaching specialization areas</p>
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>Experience</FormLabel>
                      <div className="p-3 min-h-[40px] bg-gray-50 border rounded-md">
                        <p className="text-sm">
                          {user?.experience || "No experience information provided"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Your coaching experience and achievements</p>
                    </FormItem>
                  </>
                )}
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmittingProfile}>
                    {isSubmittingProfile ? (
                      <>
                        <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                        {t('loading')}
                      </>
                    ) : (
                      t('save')
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        {/* Password Reset Section - Updated with centered layout */}
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm text-center">
          <h3 className="text-lg font-medium mb-4">{t('reset_password')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Enter your email address and we'll send you a secure link to reset your password.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={handleResetPasswordViaEmail}
              disabled={isResettingPassword}
              variant="poker"
              className="flex items-center gap-2"
            >
              {isResettingPassword ? (
                <>
                  <Icon name="Loader" className="h-4 w-4 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Icon name="Mail" className="h-4 w-4" />
                  {t('send_reset_link') || "Send Reset Link"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
