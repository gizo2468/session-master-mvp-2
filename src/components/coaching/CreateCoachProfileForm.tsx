
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';

const formSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50),
  bio: z.string().max(200, "Bio must be less than 200 characters").optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateCoachProfileForm = () => {
  const { createCoachProfile } = useCoachStudent();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      bio: '',
    }
  });
  
  const onSubmit = (values: FormValues) => {
    createCoachProfile(values.displayName, values.bio);
  };
  
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
                <Input placeholder="Your coaching name" {...field} />
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
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" variant="poker" className="w-full mt-6">
          Create Coach Profile
        </Button>
      </form>
    </Form>
  );
};

export default CreateCoachProfileForm;
