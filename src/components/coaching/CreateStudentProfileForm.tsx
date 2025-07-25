
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCoachStudent } from '@/context/CoachStudentContext';

const formSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50),
});

type FormValues = z.infer<typeof formSchema>;

const CreateStudentProfileForm = () => {
  const { createStudentProfile } = useCoachStudent();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
    }
  });
  
  const onSubmit = (values: FormValues) => {
    createStudentProfile(values.displayName);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off" className="space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" variant="poker" className="w-full mt-6">
          Create Student Profile
        </Button>
      </form>
    </Form>
  );
};

export default CreateStudentProfileForm;
