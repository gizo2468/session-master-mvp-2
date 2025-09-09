import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Icon from '@/components/ui/Lucide';
import ConnectionLimitGate from '@/components/ui/ConnectionLimitGate';

interface ConnectedUser {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
  bio?: string;
}

interface PendingRequest {
  id: string;
  coach_id: string;
  student_id: string;
  created_at: string;
  status: string;
  direction: 'incoming' | 'outgoing';
  otherUser: {
    id: string;
    full_name: string;
    username: string;
    profile_picture?: string;
    role: string;
  };
}

const MyCoachingNetwork: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<PendingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [coachUsername, setCoachUsername] = useState('');
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  // Coach -> Player connect dialog state
  const [playerUsername, setPlayerUsername] = useState('');
  const [connectPlayerDialogOpen, setConnectPlayerDialogOpen] = useState(false);
  const [connectingPlayer, setConnectingPlayer] = useState(false);
  
  const isCoach = user?.role === 'coach';
  const isStudent = user?.role === 'student';
  
  const loadConnectedUsers = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      if (isCoach) {
        // Load connected students for coaches
        const { data: connections, error: connectionsError } = await supabase
          .from('coach_student_connections')
          .select('student_id')
          .eq('coach_id', user.id)
          .eq('status', 'approved');

        if (connectionsError) {
          console.error('Error loading connections:', connectionsError);
          return;
        }

        if (connections && connections.length > 0) {
          const studentIds = connections.map(c => c.student_id);
          
          // Get profiles and private data
          const [profilesResult, privateResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, username')
              .in('id', studentIds),
            supabase
              .from('user_private_data')
              .select('id, full_name, profile_picture')
              .in('id', studentIds)
          ]);

          if (profilesResult.error) {
            console.error('Error loading student profiles:', profilesResult.error);
            return;
          }

          const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
          const privateMap = new Map(privateResult.data?.map(p => [p.id, p]) || []);

          const users = studentIds.map(id => {
            const profile = profileMap.get(id);
            const privateInfo = privateMap.get(id);
            return {
              id,
              full_name: privateInfo?.full_name || profile?.username || 'Unknown User',
              username: profile?.username || 'unknown',
              profile_picture: privateInfo?.profile_picture
            };
          });

          setConnectedUsers(users);
        } else {
          setConnectedUsers([]);
        }
      } else if (isStudent) {
        // Load connected coaches for students
        const { data: connections, error: connectionsError } = await supabase
          .from('coach_student_connections')
          .select('coach_id')
          .eq('student_id', user.id)
          .eq('status', 'approved');

        if (connectionsError) {
          console.error('Error loading connections:', connectionsError);
          return;
        }

        if (connections && connections.length > 0) {
          const coachIds = connections.map(c => c.coach_id);
          
          // Get profiles and private data
          const [profilesResult, privateResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, username, bio')
              .in('id', coachIds),
            supabase
              .from('user_private_data')
              .select('id, full_name, profile_picture')
              .in('id', coachIds)
          ]);

          if (profilesResult.error) {
            console.error('Error loading coach profiles:', profilesResult.error);
            return;
          }

          const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
          const privateMap = new Map(privateResult.data?.map(p => [p.id, p]) || []);

          const users = coachIds.map(id => {
            const profile = profileMap.get(id);
            const privateInfo = privateMap.get(id);
            return {
              id,
              full_name: privateInfo?.full_name || profile?.username || 'Unknown User',
              username: profile?.username || 'unknown',
              profile_picture: privateInfo?.profile_picture,
              bio: profile?.bio
            };
          });

          setConnectedUsers(users);
        } else {
          setConnectedUsers([]);
        }
      }
    } catch (error) {
      console.error('Error in loadConnectedUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!user?.id) return;
    
    setPendingLoading(true);
    try {
      // Load all pending requests involving the current user
      const { data: allRequests, error } = await supabase
        .from('coach_student_connections')
        .select(`
          id, coach_id, student_id, created_at, status
        `)
        .or(`coach_id.eq.${user.id},student_id.eq.${user.id}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending requests:', error);
        return;
      }

      // Get all user IDs we need profiles for
      const userIds = new Set<string>();
      (allRequests || []).forEach(conn => {
        userIds.add(conn.coach_id);
        userIds.add(conn.student_id);
      });

      // Load full profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, role')
        .in('id', Array.from(userIds));

      // Load private data for user display names
      const { data: privateData, error: privateError } = await supabase
        .from('user_private_data')
        .select('id, full_name, profile_picture')
        .in('id', Array.from(userIds));

      if (profilesError) {
        console.error('Error loading user profiles:', profilesError);
      }

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const privateMap = new Map(privateData?.map(p => [p.id, p]) || []);

      // Separate incoming and outgoing requests
      const incoming: PendingRequest[] = [];
      const outgoing: PendingRequest[] = [];

      (allRequests || []).forEach(conn => {
        const otherUserId = isCoach ? conn.student_id : conn.coach_id;
        const profile = profileMap.get(otherUserId);
        const privateInfo = privateMap.get(otherUserId);
        
        const request: PendingRequest = {
          id: conn.id,
          coach_id: conn.coach_id,
          student_id: conn.student_id,
          created_at: conn.created_at,
          status: conn.status,
          direction: 'incoming',
          otherUser: {
            id: otherUserId,
            full_name: privateInfo?.full_name || profile?.username || 'Unknown User',
            username: profile?.username || 'unknown',
            profile_picture: privateInfo?.profile_picture,
            role: profile?.role || (isCoach ? 'student' : 'coach')
          }
        };

        // Determine if this is incoming or outgoing based on who initiated
        // Students initiate requests to coaches, so:
        // - For students: outgoing when student_id = user.id, incoming when coach_id = user.id (shouldn't happen normally)
        // - For coaches: incoming when coach_id = user.id, outgoing when student_id = user.id (shouldn't happen normally)
        
        if (isStudent) {
          if (conn.student_id === user.id) {
            request.direction = 'outgoing';
            outgoing.push(request);
          } else if (conn.coach_id === user.id) {
            request.direction = 'incoming';
            incoming.push(request);
          }
        } else if (isCoach) {
          if (conn.coach_id === user.id) {
            request.direction = 'incoming';
            incoming.push(request);
          } else if (conn.student_id === user.id) {
            request.direction = 'outgoing';
            outgoing.push(request);
          }
        }
      });

      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error('Error in loadPendingRequests:', error);
    } finally {
      setPendingLoading(false);
    }
  };

  // Load connected users and pending requests on component mount and when user changes
  useEffect(() => {
    if (user?.id && (isCoach || isStudent)) {
      loadConnectedUsers();
      loadPendingRequests(); // Load for both coaches and students now
    }
  }, [user?.id, isCoach, isStudent]);


  const handleApproveRequest = async (requestId: string, studentUsername: string) => {
    try {
      const { error } = await supabase
        .from('coach_student_connections')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (error) {
        console.error('Error approving request:', error);
        toast({
          title: "Error",
          description: "Failed to approve connection request.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Connection approved!",
        description: `Connection approved for ${studentUsername}.`,
      });

      // Refresh both lists
      loadPendingRequests();
      loadConnectedUsers();
    } catch (error) {
      console.error('Error in handleApproveRequest:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string, studentUsername: string) => {
    try {
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        toast({
          title: "Error",
          description: "Failed to reject connection request.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Request rejected",
        description: `Connection request from ${studentUsername} was rejected.`,
      });

      // Refresh pending requests
      loadPendingRequests();
    } catch (error) {
      console.error('Error in handleRejectRequest:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConnectToCoach = async () => {
    if (!coachUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coach username.",
        variant: "destructive",
      });
      return;
    }

    if (coachUsername.trim() === user?.username) {
      toast({
        title: "Error",
        description: "You cannot send a request to yourself.",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);
    try {
      // Search for coach by username
      const { data: coachProfile, error: searchError } = await (supabase as any)
        .rpc('search_coach_by_username', { p_username: coachUsername.trim() })
        .maybeSingle();

      if (searchError || !coachProfile) {
        toast({
          title: "Coach not found",
          description: "No coach found with that username.",
          variant: "destructive",
        });
        return;
      }

      // Check if connection already exists
      const { data: existingConnection, error: checkError } = await supabase
        .from('coach_student_connections')
        .select('id, status')
        .eq('coach_id', coachProfile.id)
        .eq('student_id', user?.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing connection:', checkError);
        toast({
          title: "Error",
          description: "Failed to check existing connections.",
          variant: "destructive",
        });
        return;
      }

      if (existingConnection) {
        toast({
          title: "Request already exists",
          description: `You already have a ${existingConnection.status} request with this coach.`,
          variant: "destructive",
        });
        return;
      }

      // Create new connection request
      const { error: insertError } = await supabase
        .from('coach_student_connections')
        .insert({
          coach_id: coachProfile.id,
          student_id: user?.id,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error creating connection:', insertError);
        toast({
          title: "Error",
          description: "Failed to send connection request.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Request sent!",
        description: `Request sent to ${coachUsername}.`,
      });

      setCoachUsername('');
      setConnectDialogOpen(false);
      // Refresh both lists
      loadConnectedUsers();
      loadPendingRequests();
    } catch (error) {
      console.error('Error in handleConnectToCoach:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  // Coach sends connection request to a player by username
  const handleConnectToPlayer = async () => {
    if (!playerUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a player username.",
        variant: "destructive",
      });
      return;
    }

    if (playerUsername.trim() === user?.username) {
      toast({
        title: "Error",
        description: "You cannot send a request to yourself.",
        variant: "destructive",
      });
      return;
    }

    setConnectingPlayer(true);
    try {
      // Search for player by username (role must be student)
      const { data: playerProfile, error: searchError } = await (supabase as any)
        .rpc('search_student_by_username', { p_username: playerUsername.trim() })
        .maybeSingle();

      if (searchError || !playerProfile) {
        toast({
          title: "Player not found",
          description: "No player found with that username.",
          variant: "destructive",
        });
        return;
      }

      // Check if connection already exists for this pair
      const { data: existingConnection, error: checkError } = await supabase
        .from('coach_student_connections')
        .select('id, status')
        .eq('coach_id', user?.id)
        .eq('student_id', playerProfile.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing connection:', checkError);
        toast({
          title: "Error",
          description: "Failed to check existing connections.",
          variant: "destructive",
        });
        return;
      }

      if (existingConnection) {
        toast({
          title: "Request already exists",
          description: `You already have a ${existingConnection.status} request with this player.`,
          variant: "destructive",
        });
        return;
      }

      // Create pending connection request (coach -> player)
      const { error: insertError } = await supabase
        .from('coach_student_connections')
        .insert({
          coach_id: user?.id,
          student_id: playerProfile.id,
          status: 'pending',
        });

      if (insertError) {
        console.error('Error creating connection:', insertError);
        toast({
          title: "Error",
          description: "Failed to send connection request.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Request sent!",
        description: `Request sent to ${playerUsername}.`,
      });

      setPlayerUsername('');
      setConnectPlayerDialogOpen(false);
      // Refresh both lists
      loadConnectedUsers();
      loadPendingRequests();
    } catch (error) {
      console.error('Error in handleConnectToPlayer:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnectingPlayer(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const renderConnections = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader" className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading connections...</span>
        </div>
      );
    }

    if (!isCoach && !isStudent) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="UserX" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Please set up your profile to view connections.</p>
        </div>
      );
    }

    if (connectedUsers.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {isCoach ? (
            <>
              <Icon name="Users" className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No connected players yet.</p>
            </>
          ) : (
            <>
              <Icon name="GraduationCap" className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No connected coaches yet.</p>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {connectedUsers.map((connectedUser) => (
          <div
            key={connectedUser.id}
            className="flex items-center space-x-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
            onClick={() => {
              if (isCoach) {
                navigate(`/player/${connectedUser.id}`);
              } else {
                // Student clicking on a coach - navigate to coach profile page
                navigate(`/coach/${connectedUser.id}`);
              }
            }}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={connectedUser.profile_picture || ''} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(connectedUser.full_name || connectedUser.username || (isCoach ? 'Player' : 'Coach'))}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {connectedUser.full_name || connectedUser.username || (isCoach ? 'Player' : 'Coach')}
              </p>
              <p className="text-sm text-muted-foreground">
                {isCoach ? "Click to view player's shared content" : "Click to view shared sessions"}
              </p>
            </div>
            <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  };

  const renderIncomingRequests = () => {
    if (pendingLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Icon name="Loader" className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground text-sm">Loading requests...</span>
        </div>
      );
    }

    if (incomingRequests.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <Icon name="Clock" className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No incoming requests.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {incomingRequests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col p-4 rounded-lg border bg-card/30 space-y-3"
          >
            {/* User Info Row */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={request.otherUser.profile_picture || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(request.otherUser.full_name || request.otherUser.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {request.otherUser.full_name || request.otherUser.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isCoach ? 'Player' : 'Coach'} • {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Buttons Row */}
            <div className="flex space-x-2 justify-end">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleApproveRequest(request.id, request.otherUser.username)}
                className="h-8 px-3 text-xs"
              >
                <Icon name="Check" className="h-3 w-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectRequest(request.id, request.otherUser.username)}
                className="h-8 px-3 text-xs"
              >
                <Icon name="X" className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOutgoingRequests = () => {
    if (outgoingRequests.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3">
        {outgoingRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center p-3 rounded-lg border bg-card/20 space-x-3"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={request.otherUser.profile_picture || ''} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {getInitials(request.otherUser.full_name || request.otherUser.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {request.otherUser.full_name || request.otherUser.username}
              </p>
              <p className="text-xs text-muted-foreground">
                Sent {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Clock" className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-600">Pending</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icon name="Network" className="h-5 w-5" />
          <span>My Coaching Network</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCoach && (
          <div className="mb-4">
            <ConnectionLimitGate
              currentConnections={connectedUsers.length}
              userRole="coach"
            >
              <Dialog open={connectPlayerDialogOpen} onOpenChange={setConnectPlayerDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Icon name="UserPlus" className="h-4 w-4 mr-2" />
                    Connect to Player
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect to Player</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Enter the player's username to request a connection.
                    </p>
                    <Input
                      placeholder="Player handle"
                      value={playerUsername}
                      onChange={(e) => setPlayerUsername(e.target.value)}
                      name="search-player"
                      inputMode="search"
                      autoComplete="off"
                      data-form-type="other"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !connectingPlayer) {
                          handleConnectToPlayer();
                        }
                      }}
                    />
                    <Button
                      onClick={handleConnectToPlayer}
                      disabled={connectingPlayer || !playerUsername.trim()}
                      className="w-full"
                    >
                      {connectingPlayer ? (
                        <>
                          <Icon name="Loader" className="h-4 w-4 mr-2 animate-spin" />
                          Sending Request...
                        </>
                      ) : (
                        'Send Request'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </ConnectionLimitGate>
          </div>
        )}
        {isStudent && (
          <div className="mb-4">
            <ConnectionLimitGate
              currentConnections={connectedUsers.length}
              userRole="student"
            >
              <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Icon name="UserPlus" className="h-4 w-4 mr-2" />
                    Connect to Coach
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect to Coach</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Enter your coach's username to request a connection.
                    </p>
                    <Input
                      placeholder="Coach handle"
                      value={coachUsername}
                      onChange={(e) => setCoachUsername(e.target.value)}
                      name="search-coach"
                      inputMode="search"
                      autoComplete="off"
                      data-form-type="other"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !connecting) {
                          handleConnectToCoach();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleConnectToCoach} 
                      disabled={connecting || !coachUsername.trim()}
                      className="w-full"
                    >
                      {connecting ? (
                        <>
                          <Icon name="Loader" className="h-4 w-4 mr-2 animate-spin" />
                          Sending Request...
                        </>
                      ) : (
                        'Send Request'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </ConnectionLimitGate>
          </div>
        )}
        
        {/* Incoming Requests (for approval) */}
        {incomingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Icon name="UserCheck" className="h-4 w-4" />
              <span>Incoming Requests ({incomingRequests.length})</span>
            </h3>
            {renderIncomingRequests()}
          </div>
        )}

        {/* Outgoing Requests (pending status) */}
        {outgoingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Icon name="Clock" className="h-4 w-4" />
              <span>Sent Requests ({outgoingRequests.length})</span>
            </h3>
            {renderOutgoingRequests()}
          </div>
        )}
        
        <div>
          {isCoach && connectedUsers.length > 0 && (
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Icon name="Users" className="h-4 w-4" />
              <span>Connected Players</span>
            </h3>
          )}
          {isStudent && connectedUsers.length > 0 && (
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Icon name="GraduationCap" className="h-4 w-4" />
              <span>Connected Coaches</span>
            </h3>
          )}
          {renderConnections()}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyCoachingNetwork;