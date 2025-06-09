import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CoachProfile, StudentProfile, ConnectionRequest } from '@/types/poker';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';

interface CoachStudentContextType {
  // Coach methods
  isCoach: boolean;
  coachProfile: CoachProfile | null;
  students: StudentProfile[];
  pendingRequests: ConnectionRequest[];
  connectionCode: string | null;
  createCoachProfile: (displayName: string, bio?: string) => Promise<void>;
  generateConnectionCode: () => Promise<string>;
  disableConnectionCode: () => Promise<void>;
  approveConnectionRequest: (requestId: string) => Promise<void>;
  declineConnectionRequest: (requestId: string) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  
  // Student methods (UPDATED for multi-coach support)
  isStudent: boolean;
  studentProfile: StudentProfile | null;
  connectedCoaches: CoachProfile[]; // Changed from single to array
  createStudentProfile: (displayName: string) => Promise<void>;
  connectWithCoach: (code: string) => Promise<void>;
  disconnectFromCoach: (coachId: string) => Promise<void>; // Added coachId parameter
  
  // Loading states
  loading: boolean;
  profileLoading: boolean;
  studentsLoading: boolean;
  requestsLoading: boolean;
}

const CoachStudentContext = createContext<CoachStudentContextType | undefined>(undefined);

export const useCoachStudent = () => {
  const context = useContext(CoachStudentContext);
  if (context === undefined) {
    throw new Error('useCoachStudent must be used within a CoachStudentProvider');
  }
  return context;
};

export const CoachStudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // State for coach
  const [isCoach, setIsCoach] = useState<boolean>(false);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  
  // State for student (UPDATED for multi-coach support)
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [connectedCoaches, setConnectedCoaches] = useState<CoachProfile[]>([]); // Changed from single to array
  
  // Loading states - more granular for better UX
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Track initialization to prevent duplicate loads
  const [initialized, setInitialized] = useState(false);

  // Real-time subscriptions
  const handleConnectionUpdate = async () => {
    console.log('🔄 Real-time connection update detected');
    if (isCoach) {
      await Promise.all([loadPendingRequests(), loadStudents()]);
    }
    if (isStudent) {
      await loadConnectedCoaches();
    }
  };

  useRealtimeSubscriptions(handleConnectionUpdate, isCoach, isStudent);

  // Load user profile and related data when user changes or becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && !initialized) {
      console.log('🔄 Initializing coach-student context for authenticated user:', user.id);
      loadUserProfile();
      setInitialized(true);
    } else if (!isAuthenticated) {
      console.log('🔄 User not authenticated, resetting coach-student state');
      resetState();
      setInitialized(false);
    }
  }, [isAuthenticated, user?.id, initialized]);

  const resetState = () => {
    console.log('🔄 Resetting all coach-student state');
    setIsCoach(false);
    setCoachProfile(null);
    setStudents([]);
    setPendingRequests([]);
    setConnectionCode(null);
    setIsStudent(false);
    setStudentProfile(null);
    setConnectedCoaches([]);
    setLoading(false);
    setProfileLoading(false);
    setStudentsLoading(false);
    setRequestsLoading(false);
  };

  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    setProfileLoading(true);
    try {
      console.log('🔍 Loading coach-student profile for:', user.id);
      
      // Use the user data from AuthContext which already has comprehensive profile data
      console.log('✅ User role from AuthContext:', user.role);

      if (user.role === 'coach') {
        console.log('🎯 Setting up coach profile and loading coach data');
        setIsCoach(true);
        setIsStudent(false);
        setCoachProfile({
          id: user.id,
          userId: user.id,
          displayName: user.fullName,
          bio: user.onlineNickname || undefined,
          students: [],
          comments: [],
          createdAt: new Date(),
        });
        
        // Load connection code from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('connection_code')
          .eq('id', user.id)
          .single();
        
        if (profileData?.connection_code) {
          setConnectionCode(profileData.connection_code);
          console.log('✅ Found existing connection code');
        }
        
        // Load coach-specific data in parallel for better performance
        await Promise.all([loadPendingRequests(), loadStudents()]);
      } else if (user.role === 'student') {
        console.log('🎯 Setting up student profile and loading student data');
        setIsStudent(true);
        setIsCoach(false);
        setStudentProfile({
          id: user.id,
          userId: user.id,
          displayName: user.fullName,
          createdAt: new Date(),
        });
        
        await loadConnectedCoaches();
      } else {
        console.log('🔄 User has no coach/student role, keeping neutral state');
      }
    } catch (error) {
      console.error('❌ Error in loadUserProfile:', error);
      toast({
        title: "Connection Error",
        description: "Failed to load coaching profile. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!user?.id) return;

    setRequestsLoading(true);
    try {
      console.log('🔍 Loading pending requests for coach:', user.id);
      
      const { data: connections, error: connectionsError } = await supabase
        .from('coach_student_connections')
        .select('id, coach_id, student_id, created_at')
        .eq('coach_id', user.id)
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (connectionsError) {
        console.error('❌ Error loading pending requests:', connectionsError);
        return;
      }

      if (!connections || connections.length === 0) {
        console.log('📋 No pending requests found');
        setPendingRequests([]);
        return;
      }

      // Get profile data for all students in parallel
      const studentIds = connections.map(conn => conn.student_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      if (profilesError) {
        console.error('❌ Error loading student profiles:', profilesError);
      }

      // Combine connection and profile data
      const requests: ConnectionRequest[] = connections.map(conn => {
        const profile = profiles?.find(p => p.id === conn.student_id);
        let studentName = 'Unknown Student';
        
        if (profile) {
          studentName = profile.full_name || profile.email || `Student ${conn.student_id.slice(0, 8)}`;
        }
        
        return {
          id: conn.id,
          coachId: conn.coach_id,
          studentId: conn.student_id,
          status: 'pending' as const,
          createdAt: new Date(conn.created_at),
          studentName: studentName,
        };
      });

      console.log('✅ Loaded pending requests:', requests.length);
      setPendingRequests(requests);
    } catch (error) {
      console.error('❌ Error in loadPendingRequests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!user?.id) return;

    setStudentsLoading(true);
    try {
      console.log('🔍 Loading students for coach:', user.id);
      
      const { data: connections, error: connectionsError } = await supabase
        .from('coach_student_connections')
        .select('student_id, created_at')
        .eq('coach_id', user.id)
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (connectionsError) {
        console.error('❌ Error loading students:', connectionsError);
        return;
      }

      if (!connections || connections.length === 0) {
        console.log('📋 No approved students found');
        setStudents([]);
        return;
      }

      // Get profile data for all students in parallel
      const studentIds = connections.map(conn => conn.student_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .in('id', studentIds);

      if (profilesError) {
        console.error('❌ Error loading student profiles:', profilesError);
      }

      // Combine connection and profile data
      const studentProfiles: StudentProfile[] = connections.map(conn => {
        const profile = profiles?.find(p => p.id === conn.student_id);
        let displayName = 'Unknown Student';
        
        if (profile) {
          displayName = profile.full_name || profile.email || `Student ${conn.student_id.slice(0, 8)}`;
        }
        
        return {
          id: conn.student_id,
          userId: conn.student_id,
          displayName: displayName,
          createdAt: new Date(profile?.created_at || conn.created_at),
          coachId: user.id,
        };
      });

      console.log('✅ Loaded students:', studentProfiles.length);
      setStudents(studentProfiles);
    } catch (error) {
      console.error('❌ Error in loadStudents:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadConnectedCoaches = async () => {
    if (!user?.id) return;

    try {
      console.log('🔍 Loading connected coaches for student:', user.id);
      const { data, error } = await supabase
        .from('coach_student_connections')
        .select(`
          *,
          profiles!coach_student_connections_coach_id_fkey(*)
        `)
        .eq('student_id', user.id)
        .eq('approved', true);

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading connected coaches:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('✅ Connected coaches found:', data.length);
        const coaches: CoachProfile[] = data.map(connection => ({
          id: connection.profiles.id,
          userId: connection.profiles.id,
          displayName: connection.profiles.full_name,
          bio: connection.profiles.online_nickname || undefined,
          students: [],
          comments: [],
          createdAt: new Date(connection.profiles.created_at),
        }));
        setConnectedCoaches(coaches);
      } else {
        console.log('📋 No connected coaches found');
        setConnectedCoaches([]);
      }
    } catch (error) {
      console.error('❌ Error in loadConnectedCoaches:', error);
    }
  };

  const createCoachProfile = async (displayName: string, bio?: string) => {
    console.log('🔄 Starting coach profile creation process');
    
    if (!user?.id) {
      console.error('❌ No authenticated user found');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a coach profile.",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ User authenticated:', user.id);
    console.log('📝 Profile data to update:', { displayName, bio, role: 'coach' });

    setLoading(true);
    try {
      console.log('🔄 Updating profile to coach role...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'coach',
          full_name: displayName,
          online_nickname: bio,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }
      
      console.log('✅ Profile updated successfully');

      await loadUserProfile();
      
      console.log('🎉 Coach profile creation completed successfully');
      toast({
        title: "Coach Profile Created",
        description: "You can now generate a connection code for students."
      });
    } catch (error) {
      console.error('❌ Error in createCoachProfile:', error);
      
      let errorMessage = "Failed to create coach profile.";
      if (error instanceof Error) {
        if (error.message.includes('RLS')) {
          errorMessage = "Permission denied. Please try logging out and back in.";
        } else if (error.message.includes('auth')) {
          errorMessage = "Authentication issue. Please refresh the page and try again.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateConnectionCode = async (): Promise<string> => {
    if (!user?.id) return '';

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_connection_code');
      
      if (error) {
        throw error;
      }

      const code = data as string;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ connection_code: code })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setConnectionCode(code);
      
      toast({
        title: "Code Generated",
        description: `Your connection code: ${code}`
      });
      
      return code;
    } catch (error) {
      console.error('❌ Error generating connection code:', error);
      toast({
        title: "Error",
        description: "Failed to generate connection code.",
        variant: "destructive"
      });
      return '';
    } finally {
      setLoading(false);
    }
  };

  const disableConnectionCode = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ connection_code: null })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setConnectionCode(null);
      
      toast({
        title: "Code Disabled",
        description: "Your connection code has been disabled."
      });
    } catch (error) {
      console.error('❌ Error disabling connection code:', error);
      toast({
        title: "Error",
        description: "Failed to disable connection code.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveConnectionRequest = async (requestId: string) => {
    setLoading(true);
    try {
      console.log('✅ Approving connection request:', requestId);
      const { error } = await supabase
        .from('coach_student_connections')
        .update({ approved: true })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      console.log('✅ Connection request approved successfully');
      
      await Promise.all([
        loadPendingRequests(),
        loadStudents()
      ]);
      
      toast({
        title: "Request Approved",
        description: "The student is now connected to you."
      });
    } catch (error) {
      console.error('❌ Error approving connection request:', error);
      toast({
        title: "Error",
        description: "Failed to approve connection request.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const declineConnectionRequest = async (requestId: string) => {
    setLoading(true);
    try {
      console.log('❌ Declining connection request:', requestId);
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      console.log('✅ Connection request declined successfully');
      
      await loadPendingRequests();
      
      toast({
        title: "Request Declined",
        description: "The connection request has been declined."
      });
    } catch (error) {
      console.error('❌ Error declining connection request:', error);
      toast({
        title: "Error",
        description: "Failed to decline connection request.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🗑️ Removing student connection:', { coachId: user.id, studentId });
      
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('coach_id', user.id)
        .eq('student_id', studentId);

      if (error) {
        console.error('❌ Database error removing student:', error);
        throw error;
      }

      console.log('✅ Student connection removed from database successfully');
      
      setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
      
      await loadStudents();
      
      toast({
        title: "Student Removed",
        description: "The student has been removed from your coaching list."
      });
    } catch (error) {
      console.error('❌ Error removing student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createStudentProfile = async (displayName: string) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'student',
          full_name: displayName,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      await loadUserProfile();
      
      toast({
        title: "Student Profile Created",
        description: "You can now connect with coaches using their codes."
      });
    } catch (error) {
      console.error('❌ Error creating student profile:', error);
      toast({
        title: "Error",
        description: "Failed to create student profile.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const connectWithCoach = async (code: string) => {
    if (!user?.id || !studentProfile) {
      toast({
        title: "Error",
        description: "Please create a student profile first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: coach, error: coachError } = await supabase
        .from('profiles')
        .select('*')
        .eq('connection_code', code.toUpperCase())
        .eq('role', 'coach')
        .single();

      if (coachError || !coach) {
        toast({
          title: "Invalid Code",
          description: "The code you entered is invalid or expired.",
          variant: "destructive"
        });
        return;
      }

      const { data: existingConnection } = await supabase
        .from('coach_student_connections')
        .select('*')
        .eq('coach_id', coach.id)
        .eq('student_id', user.id)
        .single();

      if (existingConnection) {
        toast({
          title: "Already Connected",
          description: existingConnection.approved 
            ? "You are already connected to this coach."
            : "You have already sent a request to this coach.",
          variant: "destructive"
        });
        return;
      }

      const { error: insertError } = await supabase
        .from('coach_student_connections')
        .insert({
          coach_id: coach.id,
          student_id: user.id,
          approved: false,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Request Sent",
        description: `Your request to connect with ${coach.full_name} has been sent.`
      });
    } catch (error) {
      console.error('❌ Error connecting with coach:', error);
      toast({
        title: "Error",
        description: "Failed to connect with coach.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectFromCoach = async (coachId: string) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🗑️ Disconnecting from coach:', { studentId: user.id, coachId });
      
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('student_id', user.id)
        .eq('coach_id', coachId);

      if (error) {
        console.error('❌ Database error disconnecting from coach:', error);
        throw error;
      }

      console.log('✅ Coach connection removed from database successfully');
      
      setConnectedCoaches(prev => prev.filter(coach => coach.id !== coachId));
      
      toast({
        title: "Disconnected",
        description: "You have disconnected from the coach."
      });
    } catch (error) {
      console.error('❌ Error disconnecting from coach:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from coach. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Coach
    isCoach,
    coachProfile,
    students,
    pendingRequests,
    connectionCode,
    createCoachProfile,
    generateConnectionCode,
    disableConnectionCode,
    approveConnectionRequest,
    declineConnectionRequest,
    removeStudent,
    
    // Student (UPDATED)
    isStudent,
    studentProfile,
    connectedCoaches,
    createStudentProfile,
    connectWithCoach,
    disconnectFromCoach,
    
    // Loading states
    loading,
    profileLoading,
    studentsLoading,
    requestsLoading,
  };

  return (
    <CoachStudentContext.Provider value={value}>
      {children}
    </CoachStudentContext.Provider>
  );
};
