
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/Lucide';

const formSchema = z.object({
  location: z.string().min(1, "Location is required")
});

type FormValues = z.infer<typeof formSchema>;

export default function SessionForm() {
  const navigate = useNavigate();
  const { startSession } = useSessionContext();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: '',
    }
  });
  
  const onSubmit = (values: FormValues) => {
    startSession({
      location: values.location,
      notes: ""
    });
    navigate('/confirm-session');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        <header className="mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="text-poker-feltGreen mb-4 flex items-center gap-1 hover:underline"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-serif font-bold text-poker-black">Start New Session</h1>
          <p className="text-gray-500 text-sm mt-1">Track your poker performance</p>
        </header>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Session Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter casino, home game, online site, etc." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full py-3 px-4 bg-poker-gold hover:bg-poker-darkGold text-white font-bold rounded-md shadow-md transition-all"
            >
              Start Session
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
