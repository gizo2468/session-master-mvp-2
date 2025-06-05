
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/ui/Lucide';

const formSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50),
  bio: z.string().max(200, "Bio must be less than 200 characters").optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateCoachProfileForm = () => {
  const { createCoachProfile, loading } = useCoachStudent();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      bio: '',
    }
  });
  
  const onSubmit = async (values: FormValues) => {
    console.log('📝 Form submitted with values:', values);
    console.log('👤 Current user:', user?.id);
    
    // Phase 4: Form validation before submission
    if (!user?.id) {
      form.setError('root', {
        type: 'manual',
        message: 'You must be logged in to create a coach profile.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createCoachProfile(values.displayName, values.bio);
    } catch (error) {
      console.error('Form submission error:', error);
      form.setError('root', {
        type: 'manual',
        message: 'Failed to create coach profile. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Phase 4: Show loading state properly
  const isFormLoading = loading || isSubmitting;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your coaching name" 
                  disabled={isFormLoading}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="A brief description of your coaching experience" 
                  disabled={isFormLoading}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Phase 4: Show any root form errors */}
        {form.formState.errors.root && (
          <div className="text-sm text-red-600 mt-2">
            {form.formState.errors.root.message}
          </div>
        )}
        
        <Button 
          type="submit" 
          variant="poker" 
          className="w-full mt-6"
          disabled={isFormLoading}
        >
          {isFormLoading ? (
            <>
              <Icon name="Loader" className="mr-2 h-4 w-4 animate-spin" />
              Creating Profile...
            </>
          ) : (
            'Create Coach Profile'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default CreateCoachProfileForm;
