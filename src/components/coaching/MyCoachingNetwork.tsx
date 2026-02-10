import React, { useState, useEffect, useRef } from 'react';
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
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import ConnectionLimitDialog from './ConnectionLimitDialog';

interface ConnectedUser {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  role?: string; // Added to distinguish coaches from players
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

interface MyCoachingNetworkProps {
  highlightIncomingRequests?: boolean;
  autoOpenConnect?: boolean;
}

const MyCoachingNetwork: React.FC<MyCoachingNetworkProps> = ({ highlightIncomingRequests, autoOpenConnect }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isPremium, getConnectionLimits } = usePremiumAccess();
  const incomingRequestsRef = useRef<HTMLDivElement>(null);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [connectedPlayers, setConnectedPlayers] = useState<ConnectedUser[]>([]);
  const [connectedCoaches, setConnectedCoaches] = useState<ConnectedUser[]>([]);
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
  
  // Coach -> Coach connect dialog state
  const [coachAsCoachUsername, setCoachAsCoachUsername] = useState('');
  const [connectCoachDialogOpen, setConnectCoachDialogOpen] = useState(false);
  const [connectingCoach, setConnectingCoach] = useState(false);
  const [showCoachConfirmation, setShowCoachConfirmation] = useState(false);
  
  // Connection limit dialog state
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [limitDialogRole, setLimitDialogRole] = useState<'coach' | 'student'>('student');
  
  // View all modals state
  const [showAllPlayersModal, setShowAllPlayersModal] = useState(false);
  const [showAllCoachesModal, setShowAllCoachesModal] = useState(false);
  
  const isCoach = user?.role === 'coach';
  const isStudent = user?.role === 'student';
  
  const loadConnectedUsers = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      if (isCoach) {
        // Load both students and coaches connected to this coach
        const [studentsResult, coachesResult] = await Promise.all([
          // Load students where this user is the coach
          supabase
            .from('coach_student_connections')
            .select('student_id')
            .eq('coach_id', user.id)
            .eq('status', 'approved'),
          // Load coaches where this user is the student (coach-to-coach relationships)
          supabase
            .from('coach_student_connections')
            .select('coach_id')
            .eq('student_id', user.id)
            .eq('status', 'approved')
        ]);

        const studentConnections = studentsResult.data || [];
        const coachConnections = coachesResult.data || [];

        if (studentsResult.error) {
          console.error('Error loading student connections:', studentsResult.error);
        }
        if (coachesResult.error) {
          console.error('Error loading coach connections:', coachesResult.error);
        }

        // Get all user IDs
        const allUserIds = [
          ...studentConnections.map(c => c.student_id),
          ...coachConnections.map(c => c.coach_id)
        ];

        if (allUserIds.length > 0) {
          // Get profiles and private data for all users
          const [profilesResult, privateResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, username, bio, role')
              .in('id', allUserIds),
            supabase
              .from('user_private_data')
              .select('id, full_name, profile_picture')
              .in('id', allUserIds)
          ]);

          if (profilesResult.error) {
            console.error('Error loading user profiles:', profilesResult.error);
            return;
          }

          const profileMap = new Map(profilesResult.data?.map(p => [p.id, p]) || []);
          const privateMap = new Map(privateResult.data?.map(p => [p.id, p]) || []);

          // Separate players and coaches
          const players = studentConnections.map(c => c.student_id).map(id => {
            const profile = profileMap.get(id);
            const privateInfo = privateMap.get(id);
            return {
              id,
              full_name: privateInfo?.full_name || profile?.username || 'Unknown User',
              username: profile?.username || 'unknown',
              profile_picture: privateInfo?.profile_picture,
              bio: profile?.bio,
              role: profile?.role || 'student'
            };
          });

          const coaches = coachConnections.map(c => c.coach_id).map(id => {
            const profile = profileMap.get(id);
            const privateInfo = privateMap.get(id);
            return {
              id,
              full_name: privateInfo?.full_name || profile?.username || 'Unknown User',
              username: profile?.username || 'unknown',
              profile_picture: privateInfo?.profile_picture,
              bio: profile?.bio,
              role: profile?.role || 'coach'
            };
          });

          setConnectedPlayers(players);
          setConnectedCoaches(coaches);
          setConnectedUsers([...players, ...coaches]); // Keep for compatibility
        } else {
          setConnectedPlayers([]);
          setConnectedCoaches([]);
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
          id, coach_id, student_id, created_at, status, initiated_by
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
        // Determine direction based on who initiated the request
        let otherUserId: string;
        let direction: 'incoming' | 'outgoing';
        
        if (conn.initiated_by === user.id) {
          // I created this request - it's outgoing
          direction = 'outgoing';
          // The other user is whoever I'm NOT in this connection
          otherUserId = conn.coach_id === user.id ? conn.student_id : conn.coach_id;
        } else {
          // Someone else created this request to me - it's incoming
          direction = 'incoming';
          // The other user is the initiator
          otherUserId = conn.initiated_by;
        }
        
        const profile = profileMap.get(otherUserId);
        const privateInfo = privateMap.get(otherUserId);
        
        const request: PendingRequest = {
          id: conn.id,
          coach_id: conn.coach_id,
          student_id: conn.student_id,
          created_at: conn.created_at,
          status: conn.status,
          direction,
          otherUser: {
            id: otherUserId,
            full_name: privateInfo?.full_name || '',
            username: profile?.username || '',
            profile_picture: privateInfo?.profile_picture,
            role: profile?.role || 'student'
          }
        };

        if (direction === 'incoming') {
          incoming.push(request);
        } else {
          outgoing.push(request);
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

  // Auto-scroll to incoming requests when navigating from notification
  useEffect(() => {
    if (highlightIncomingRequests && incomingRequestsRef.current) {
      setTimeout(() => {
        incomingRequestsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [highlightIncomingRequests, incomingRequests]);

  // Auto-open connect dialog when navigated with openConnect param
  useEffect(() => {
    if (autoOpenConnect && isStudent) {
      setConnectDialogOpen(true);
    }
  }, [autoOpenConnect, isStudent]);


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

    if (coachUsername.trim().toLowerCase() === user?.username?.toLowerCase()) {
      toast({
        title: "Error",
        description: "You cannot send a request to yourself.",
        variant: "destructive",
      });
      return;
    }

    // Check connection limits for non-premium users
    if (!isPremium) {
      const limits = getConnectionLimits();
      const currentConnections = connectedUsers.length;
      if (currentConnections >= limits.maxCoachesForStudent) {
        setLimitDialogRole('student');
        setShowLimitDialog(true);
        return;
      }
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

      // Double-check: prevent self-connection by ID
      if (coachProfile.id === user?.id) {
        toast({
          title: "Error",
          description: "You cannot send a request to yourself.",
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

      // Create new connection request (student -> coach)
      const { error: insertError } = await supabase
        .from('coach_student_connections')
        .insert({
          coach_id: coachProfile.id,
          student_id: user?.id,
          status: 'pending',
          initiated_by: user?.id
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

    if (playerUsername.trim().toLowerCase() === user?.username?.toLowerCase()) {
      toast({
        title: "Error",
        description: "You cannot send a request to yourself.",
        variant: "destructive",
      });
      return;
    }

    // Check connection limits for non-premium coaches (only count player connections)
    if (!isPremium) {
      const limits = getConnectionLimits();
      const currentPlayerConnections = connectedPlayers.length;
      if (currentPlayerConnections >= limits.maxStudentsForCoach) {
        setLimitDialogRole('coach');
        setShowLimitDialog(true);
        return;
      }
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

      // Double-check: prevent self-connection by ID
      if (playerProfile.id === user?.id) {
        toast({
          title: "Error",
          description: "You cannot send a request to yourself.",
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
          initiated_by: user?.id
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

  // Coach sends connection request to another coach
  const handleConnectToCoachAsCoach = async () => {
    if (!coachAsCoachUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coach username.",
        variant: "destructive",
      });
      return;
    }

    if (coachAsCoachUsername.trim().toLowerCase() === user?.username?.toLowerCase()) {
      toast({
        title: "Error",
        description: "You cannot send a request to yourself.",
        variant: "destructive",
      });
      return;
    }

    // Coach-to-coach connections are not limited (coach becomes student in that relationship)
    setConnectingCoach(true);
    try {
      // Search for coach by username
      const { data: coachProfile, error: searchError } = await (supabase as any)
        .rpc('search_coach_by_username', { p_username: coachAsCoachUsername.trim() })
        .maybeSingle();

      if (searchError || !coachProfile) {
        toast({
          title: "Coach not found",
          description: "No coach found with that username.",
          variant: "destructive",
        });
        return;
      }

      // Double-check: prevent self-connection by ID
      if (coachProfile.id === user?.id) {
        toast({
          title: "Error",
          description: "You cannot send a request to yourself.",
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
          description: `You already have a ${existingConnection.status} request with this coach.`,
          variant: "destructive",
        });
        return;
      }

      // Create connection request (requesting coach becomes the "student" in the relationship)
      const { error: insertError } = await supabase
        .from('coach_student_connections')
        .insert({
          coach_id: coachProfile.id,
          student_id: user?.id,
          status: 'pending',
          initiated_by: user?.id
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
        description: `Request sent to ${coachAsCoachUsername}.`,
      });

      setCoachAsCoachUsername('');
      setConnectCoachDialogOpen(false);
      setShowCoachConfirmation(false);
      // Refresh both lists
      loadConnectedUsers();
      loadPendingRequests();
    } catch (error) {
      console.error('Error in handleConnectToCoachAsCoach:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnectingCoach(false);
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
              if (connectedUser.role === 'coach') {
                navigate(`/coach/${connectedUser.id}`);
              } else {
                navigate(`/player/${connectedUser.id}`);
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
                {connectedUser.role === 'coach' ? "Click to view shared sessions" : "Click to view player's shared content"}
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
                  {request.otherUser.full_name || request.otherUser.username || `${request.otherUser.role === 'coach' ? 'Coach' : 'Player'}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {request.otherUser.role === 'coach' ? 'Wants to be your coach.' : 'Wants to be your player.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
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
                {request.otherUser.full_name || request.otherUser.username || `${request.otherUser.role === 'coach' ? 'Coach' : 'Player'}`}
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
          <span>{isCoach ? "My Coach Network" : "My Player Network"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCoach && (
          <div className="mb-4 space-y-2">
            <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <Dialog open={connectPlayerDialogOpen} onOpenChange={setConnectPlayerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                      <Icon name="UserPlus" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Connect to </span>Player
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
                        inputMode="text"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        autoComplete="off"
                        data-form-type="other"
                        readOnly
                        onMouseDown={(e) => e.currentTarget.removeAttribute('readonly')}
                        onTouchStart={(e) => e.currentTarget.removeAttribute('readonly')}
                        onFocus={(e) => e.currentTarget.removeAttribute('readonly')}
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
                
                <Dialog open={connectCoachDialogOpen} onOpenChange={setConnectCoachDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                      <Icon name="GraduationCap" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Connect to </span>Coach
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect to Coach</DialogTitle>
                    </DialogHeader>
                    {!showCoachConfirmation ? (
                      <div className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                          Enter the coach's username to request mentoring.
                        </p>
                        <Input
                          placeholder="Coach / Player handle"
                          value={coachAsCoachUsername}
                          onChange={(e) => setCoachAsCoachUsername(e.target.value)}
                          name="search-coach-as-coach"
                          inputMode="text"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          autoComplete="off"
                          data-form-type="other"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !connectingCoach && coachAsCoachUsername.trim()) {
                              setShowCoachConfirmation(true);
                            }
                          }}
                        />
                        <Button
                          onClick={() => setShowCoachConfirmation(true)}
                          disabled={!coachAsCoachUsername.trim()}
                          className="w-full"
                        >
                          Continue
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-4">
                        <div className="rounded-lg bg-muted/50 p-4">
                          <h4 className="font-medium mb-2">Confirm Connection Request</h4>
                          <p className="text-sm text-muted-foreground">
                            You're about to connect with a coach. This will send a request to be coached by them.
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowCoachConfirmation(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleConnectToCoachAsCoach}
                            disabled={connectingCoach}
                            className="flex-1"
                          >
                            {connectingCoach ? (
                              <>
                                <Icon name="Loader" className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              'Confirm'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
          </div>
        )}
        {isStudent && (
          <div className="mb-4">
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
                       placeholder="Coach / Player handle"
                       value={coachUsername}
                       onChange={(e) => setCoachUsername(e.target.value)}
                       name="search-coach"
                       inputMode="text"
                       autoCorrect="off"
                       autoCapitalize="none"
                       spellCheck={false}
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
          </div>
        )}
        
        {/* Connection Limit Dialog */}
        <ConnectionLimitDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          userRole={limitDialogRole}
          maxConnections={limitDialogRole === 'coach' ? getConnectionLimits().maxStudentsForCoach : getConnectionLimits().maxCoachesForStudent}
        />
        
        {/* Incoming Requests (for approval) */}
        {incomingRequests.length > 0 && (
          <div ref={incomingRequestsRef} className="mb-6">
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
        
        <div className="space-y-6">
          {/* Connected Players Section (for coaches) */}
          {isCoach && connectedPlayers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Icon name="Users" className="h-4 w-4" />
                <span>Connected Players</span>
              </h3>
              <div className="space-y-3">
                {connectedPlayers.slice(0, 3).map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/player/${player.id}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={player.profile_picture || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(player.full_name || player.username || 'Player')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {player.full_name || player.username || 'Player'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click to view player's shared content
                      </p>
                    </div>
                    <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
              {connectedPlayers.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-3 text-muted-foreground"
                  onClick={() => setShowAllPlayersModal(true)}
                >
                  View all ({connectedPlayers.length})
                </Button>
              )}
            </div>
          )}

          {/* Connected Coaches Section (for coaches and students) */}
          {((isCoach && connectedCoaches.length > 0) || (isStudent && connectedUsers.length > 0)) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <Icon name="GraduationCap" className="h-4 w-4" />
                <span>Connected Coaches</span>
              </h3>
              <div className="space-y-3">
                {(isCoach ? connectedCoaches : connectedUsers).slice(0, 3).map((coach) => (
                  <div
                    key={coach.id}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/coach/${coach.id}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={coach.profile_picture || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(coach.full_name || coach.username || 'Coach')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {coach.full_name || coach.username || 'Coach'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click to view shared sessions
                      </p>
                    </div>
                    <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
              {(isCoach ? connectedCoaches : connectedUsers).length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-3 text-muted-foreground"
                  onClick={() => setShowAllCoachesModal(true)}
                >
                  View all ({(isCoach ? connectedCoaches : connectedUsers).length})
                </Button>
              )}
            </div>
          )}

          {/* No connections message */}
          {connectedUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {isCoach ? (
                <>
                  <Icon name="Users" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No connections yet. Connect with players or other coaches to get started.</p>
                </>
              ) : (
                <>
                  <Icon name="GraduationCap" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No connected coaches yet.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* View All Players Modal */}
        <Dialog open={showAllPlayersModal} onOpenChange={setShowAllPlayersModal}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Icon name="Users" className="h-5 w-5" />
                <span>All Connected Players ({connectedPlayers.length})</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              {connectedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowAllPlayersModal(false);
                    navigate(`/player/${player.id}`);
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={player.profile_picture || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(player.full_name || player.username || 'Player')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {player.full_name || player.username || 'Player'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click to view player's shared content
                    </p>
                  </div>
                  <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* View All Coaches Modal */}
        <Dialog open={showAllCoachesModal} onOpenChange={setShowAllCoachesModal}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Icon name="GraduationCap" className="h-5 w-5" />
                <span>All Connected Coaches ({(isCoach ? connectedCoaches : connectedUsers).length})</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              {(isCoach ? connectedCoaches : connectedUsers).map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowAllCoachesModal(false);
                    navigate(`/coach/${coach.id}`);
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={coach.profile_picture || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(coach.full_name || coach.username || 'Coach')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {coach.full_name || coach.username || 'Coach'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click to view shared sessions
                    </p>
                  </div>
                  <Icon name="ChevronRight" className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default MyCoachingNetwork;