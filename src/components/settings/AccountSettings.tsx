
import React, { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | undefined>(user?.profilePicture);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
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
        onlineNickname: values.onlineNickname
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
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      
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
                        <Input 
                          {...field} 
                          placeholder="e.g., OmriGrinder, CoachOP, etc." 
                          maxLength={20}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <Input value={user?.email} disabled />
                  <FormMessage>{t('email')}</FormMessage>
                </FormItem>
                
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
        
        {/* Password Reset Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">{t('reset_password')}</h3>
          <p className="text-muted-foreground mb-4">
            Reset your password securely via email. You will receive a link to create a new password.
          </p>
          <div className="flex justify-end">
            <Button 
              onClick={handleResetPasswordViaEmail}
              disabled={isResettingPassword}
            >
              {isResettingPassword ? (
                <>
                  <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Icon name="Mail" className="mr-2 h-4 w-4" />
                  {t('send_reset_link')}
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        {/* Logout Section */}
        <div className="pt-2">
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="flex justify-between items-center">
              <span>{t('logout')}</span>
              <Button variant="destructive" onClick={logout}>
                <Icon name="LogOut" className="mr-2 h-4 w-4" />
                {t('logout')}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
