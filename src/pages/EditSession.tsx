import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/Lucide';
import { useSessionContext } from '@/context/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { PokerSession } from '@/types/poker';
import { fetchUserSessions } from '@/utils/database';

export default function EditSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { updateSession, refreshSessionsFromDatabase } = useSessionContext();
  const { toast } = useToast();

  const [session, setSession] = useState<PokerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    location: string;
    gameType: 'NLH' | 'PLO';
    format: 'Cash' | 'Tournament';
    buyIn: number;
    cashOut: number;
    smallBlind: number;
    bigBlind: number;
    notes: string;
  }>({
    location: '',
    gameType: 'NLH',
    format: 'Cash',
    buyIn: 0,
    cashOut: 0,
    smallBlind: 0,
    bigBlind: 0,
    notes: ''
  });

  // Load session data directly from database
  useEffect(() => {
    const loadSessionFromDatabase = async () => {
      if (!sessionId) return;
      
      try {
        setLoading(true);
        console.log('🔄 Loading session for edit from database:', sessionId);
        
        const sessions = await fetchUserSessions();
        const foundSession = sessions.find(s => s.id === sessionId);
        
        if (!foundSession) {
          toast({
            title: "Session Not Found",
            description: "The session you're trying to edit could not be found.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        console.log('✅ Loaded session from database for editing:', foundSession);
        setSession(foundSession);
        
        // Pre-populate form with database values
        setFormData({
          location: foundSession.location || '',
          gameType: (foundSession.gameType as 'NLH' | 'PLO') || 'NLH',
          format: (foundSession.format as 'Cash' | 'Tournament') || 'Cash',
          buyIn: foundSession.buyIn || 0,
          cashOut: foundSession.cashOut || 0,
          smallBlind: foundSession.smallBlind || 0,
          bigBlind: foundSession.bigBlind || 0,
          notes: foundSession.notes || ''
        });
        
      } catch (error) {
        console.error('❌ Error loading session for edit:', error);
        toast({
          title: "Error Loading Session",
          description: "There was a problem loading the session data.",
          variant: "destructive"
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadSessionFromDatabase();
  }, [sessionId, navigate, toast]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!session) return;
    
    try {
      setSaving(true);
      console.log('💾 Saving session changes to database:', session.id);
      
      const updatedSession: PokerSession = {
        ...session,
        location: formData.location,
        gameType: formData.gameType,
        format: formData.format,
        buyIn: formData.buyIn,
        cashOut: formData.cashOut,
        smallBlind: formData.smallBlind,
        bigBlind: formData.bigBlind,
        notes: formData.notes
      };
      
      await updateSession(updatedSession);
      
      toast({
        title: "Session Updated",
        description: "Your session has been successfully updated."
      });
      
      navigate('/');
      
    } catch (error) {
      console.error('❌ Error saving session:', error);
      toast({
        title: "Error Saving Session",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-poker-feltGreen mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-gray-600">Session not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto max-w-md px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Icon name="ArrowLeft" size={16} />
              Back
            </Button>
            <h1 className="text-lg font-bold">Edit Session</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Game Type
                </label>
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
                    <SelectItem value="PLO5">5-Card PLO</SelectItem>
                    <SelectItem value="Stud">Seven Card Stud</SelectItem>
                    <SelectItem value="Mixed">Mixed Games</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buy-in ($)
                </label>
                <Input
                  type="number"
                  value={formData.buyIn}
                  onChange={(e) => handleInputChange('buyIn', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cash Out ($)
                </label>
                <Input
                  type="number"
                  value={formData.cashOut}
                  onChange={(e) => handleInputChange('cashOut', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {formData.format === 'Cash' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Small Blind ($)
                  </label>
                  <Input
                    type="number"
                    value={formData.smallBlind}
                    onChange={(e) => handleInputChange('smallBlind', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Big Blind ($)
                  </label>
                  <Input
                    type="number"
                    value={formData.bigBlind}
                    onChange={(e) => handleInputChange('bigBlind', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any notes about this session..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-poker-feltGreen hover:bg-poker-feltGreen/90"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
