
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface TableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TableFormValues) => void;
}

export type TableFormValues = {
  name: string;
  gameType: 'NLH' | 'PLO';
  format: 'Cash' | 'Tournament';
  buyIn: string;
  smallBlind: string;
  bigBlind: string;
};

const tableFormSchema = z.object({
  name: z.string().min(1, "Table name is required"),
  gameType: z.enum(['NLH', 'PLO']),
  format: z.enum(['Cash', 'Tournament']),
  buyIn: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Buy-in amount must be a valid positive number",
  }),
  smallBlind: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Small blind must be a valid number",
  }),
  bigBlind: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Big blind must be a valid number",
  }),
});

const TableForm: React.FC<TableFormProps> = ({ open, onOpenChange, onSubmit }) => {
  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      name: '',
      gameType: 'NLH',
      format: 'Cash',
      buyIn: '',
      smallBlind: '',
      bigBlind: ''
    }
  });

  const handleSubmit = (values: TableFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Table</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Tournament, Cash Game 1, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gameType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Game Type</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value="NLH" 
                            id="table-nlh" 
                            className="sr-only peer" 
                          />
                        </FormControl>
                        <label 
                          htmlFor="table-nlh" 
                          className={`flex-1 cursor-pointer py-3 px-4 rounded-md border text-center ${
                            field.value === 'NLH' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          No Limit Hold'em
                        </label>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value="PLO" 
                            id="table-plo" 
                            className="sr-only peer" 
                          />
                        </FormControl>
                        <label 
                          htmlFor="table-plo" 
                          className={`flex-1 cursor-pointer py-3 px-4 rounded-md border text-center ${
                            field.value === 'PLO' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          Pot Limit Omaha
                        </label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Format</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value="Cash" 
                            id="table-cash" 
                            className="sr-only peer" 
                          />
                        </FormControl>
                        <label 
                          htmlFor="table-cash" 
                          className={`flex-1 cursor-pointer py-3 px-4 rounded-md border text-center ${
                            field.value === 'Cash' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          Cash Game
                        </label>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value="Tournament" 
                            id="table-tournament" 
                            className="sr-only peer" 
                          />
                        </FormControl>
                        <label 
                          htmlFor="table-tournament" 
                          className={`flex-1 cursor-pointer py-3 px-4 rounded-md border text-center ${
                            field.value === 'Tournament' 
                              ? 'bg-poker-feltGreen text-white border-poker-feltGreen' 
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          Tournament
                        </label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="buyIn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buy-in Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-8" 
                        min="0" 
                        step="0.01" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="smallBlind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Small Blind</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="pl-8" 
                          min="0" 
                          step="0.01" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bigBlind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Big Blind</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="pl-8" 
                          min="0" 
                          step="0.01" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSubmit)}
            className="bg-poker-gold hover:bg-poker-darkGold text-white"
          >
            Add Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableForm;
