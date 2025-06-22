
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import { PokerSession } from '@/types/poker';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';

export default function SessionForm() {
  const navigate = useNavigate();
  const { startSession } = useSessionContext();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    gameType: 'NLH' as const,
    format: 'Cash' as const,
    location: '',
    physicalLocation: '',
    tableName: '',
    buyIn: 0,
    smallBlind: 0,
    bigBlind: 0,
    isOnline: false,
    startingBB: 100,
    tournamentTypes: [] as string[],
    isMultiDay: false,
    notes: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a location for your session.",
        variant: "destructive"
      });
      return;
    }

    if (formData.buyIn <= 0) {
      toast({
        title: "Validation Error", 
        description: "Please enter a valid buy-in amount.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      console.log('🎯 Creating new session with data:', formData);
      
      const newSession: PokerSession = {
        id: uuidv4(),
        gameType: formData.gameType,
        format: formData.format,
        location: formData.location,
        physicalLocation: formData.physicalLocation || undefined,
        tableName: formData.tableName || undefined,
        buyIn: formData.buyIn,
        initialBuyIn: formData.buyIn,
        smallBlind: formData.smallBlind || undefined,
        bigBlind: formData.bigBlind || undefined,
        isOnline: formData.isOnline,
        startingBB: formData.startingBB || undefined,
        tournamentTypes: formData.tournamentTypes.length > 0 ? formData.tournamentTypes : undefined,
        isMultiDay: formData.isMultiDay,
        startTime: new Date(),
        startTimeUTC: Date.now(),
        endTime: undefined,
        isActive: true,
        cashOut: undefined,
        notes: formData.notes || undefined,
        currentStatus: 'running',
        sessionDuration: 0,
        rebuys: 0,
        rebuyAmount: 0,
        roi: 0,
        itmRatioNumerator: 0,
        itmRatioDenominator: 0,
        tablesPlayed: 0,
        tables: [],
        hands: []
      };

      console.log('🚀 Starting session:', newSession.id);
      
      // Start the session and wait for it to be properly saved
      await startSession(newSession);
      
      console.log('✅ Session started successfully, navigating to live session');
      
      toast({
        title: "Session Started",
        description: "Your poker session has begun. Good luck!",
      });

      // Navigate to the live session page
      navigate(`/session/${newSession.id}`, { replace: true });

    } catch (error) {
      console.error('❌ Failed to create session:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Session Creation Failed",
        description: `Failed to start session: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Back to Home
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">New Poker Session</CardTitle>
              <CardDescription className="text-center">
                Set up your session details to start tracking
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Game Type */}
                <div className="space-y-2">
                  <Label htmlFor="gameType">Game Type</Label>
                  <Select 
                    value={formData.gameType} 
                    onValueChange={(value) => handleInputChange('gameType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NLH">No Limit Hold'em</SelectItem>
                      <SelectItem value="PLO">Pot Limit Omaha</SelectItem>
                      <SelectItem value="FL">Fixed Limit</SelectItem>
                      <SelectItem value="Mixed">Mixed Games</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select 
                    value={formData.format} 
                    onValueChange={(value) => handleInputChange('format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash Game</SelectItem>
                      <SelectItem value="Tournament">Tournament</SelectItem>
                      <SelectItem value="SNG">Sit & Go</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Aria Casino, PokerStars, Home Game"
                    required
                  />
                </div>

                {/* Online Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isOnline"
                    checked={formData.isOnline}
                    onCheckedChange={(checked) => handleInputChange('isOnline', checked)}
                  />
                  <Label htmlFor="isOnline">Online Session</Label>
                </div>

                {/* Buy-in */}
                <div className="space-y-2">
                  <Label htmlFor="buyIn">Buy-in Amount *</Label>
                  <Input
                    id="buyIn"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.buyIn}
                    onChange={(e) => handleInputChange('buyIn', parseFloat(e.target.value) || 0)}
                    placeholder="100.00"
                    required
                  />
                </div>

                {/* Blinds */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smallBlind">Small Blind</Label>
                    <Input
                      id="smallBlind"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.smallBlind}
                      onChange={(e) => handleInputChange('smallBlind', parseFloat(e.target.value) || 0)}
                      placeholder="1.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bigBlind">Big Blind</Label>
                    <Input
                      id="bigBlind"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.bigBlind}
                      onChange={(e) => handleInputChange('bigBlind', parseFloat(e.target.value) || 0)}
                      placeholder="2.00"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Session Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any notes about this session..."
                    className="min-h-[80px]"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-poker-feltGreen hover:bg-poker-darkGreen text-white"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting Session...
                    </>
                  ) : (
                    <>
                      <Icon name="Play" size={16} className="mr-2" />
                      Start Session
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
