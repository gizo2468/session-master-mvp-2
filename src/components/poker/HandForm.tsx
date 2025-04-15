
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import CardSelector from './CardSelector';
import { HandData } from '@/types/poker';

interface HandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<HandData>) => void;
  initialData?: Partial<HandData>;
  isEditing?: boolean;
}

// Form schema validation
const handFormSchema = z.object({
  cards: z.string().min(4, 'Select at least 2 cards').max(20, 'Maximum 10 cards'),
  position: z.string().min(1, 'Position is required'),
  action: z.string().min(1, 'Action description is required').max(200, 'Action description is too long'),
  resultAmount: z.number().optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  pokercraftLink: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof handFormSchema>;

const HandForm: React.FC<HandFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData = {},
  isEditing = false
}) => {
  // Setup form with initial values
  const form = useForm<FormValues>({
    resolver: zodResolver(handFormSchema),
    defaultValues: {
      cards: initialData.cards || '',
      position: initialData.position || '',
      action: initialData.action || '',
      resultAmount: initialData.resultAmount || undefined,
      notes: initialData.notes || '',
      pokercraftLink: initialData.pokercraftLink || ''
    }
  });
  
  const positions = [
    { label: 'Small Blind', value: 'SB' },
    { label: 'Big Blind', value: 'BB' },
    { label: 'Under the Gun', value: 'UTG' },
    { label: 'UTG+1', value: 'UTG+1' },
    { label: 'Middle Position', value: 'MP' },
    { label: 'Hijack', value: 'HJ' },
    { label: 'Cutoff', value: 'CO' },
    { label: 'Button', value: 'BTN' }
  ];
  
  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      id: initialData.id,
      image: initialData.image, // Keep the image if it exists
    });
    onOpenChange(false);
  };
  
  const [imagePreview, setImagePreview] = React.useState<string | null>(
    initialData.image || null
  );
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('image' as any, result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Hand' : 'Add New Hand'}</DialogTitle>
          <DialogDescription>
            Record the details of your poker hand for analysis and tracking.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="cards"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cards</FormLabel>
                  <FormControl>
                    <CardSelector 
                      selectedCards={field.value} 
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Select the cards you were dealt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions.map(position => (
                        <SelectItem key={position.value} value={position.value}>
                          {position.label} ({position.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 3-bet pre-flop, check-raised turn" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of key actions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="resultAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Result Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <Input 
                        type="number"
                        placeholder="0.00"
                        className="pl-8"
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value !== undefined ? field.value : ''}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Positive for wins, negative for losses
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details or thoughts about the hand..."
                      className="h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Image</FormLabel>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Hand preview" 
                    className="max-h-40 rounded border border-gray-200" 
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setImagePreview(null);
                      form.setValue('image' as any, undefined);
                    }}
                  >
                    Remove Image
                  </Button>
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="pokercraftLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pokercraft Link</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://pokercraft.com/hand/123456" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Link to hand replay
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-poker-gold hover:bg-poker-darkGold text-white">
                {isEditing ? 'Save Changes' : 'Add Hand'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default HandForm;
