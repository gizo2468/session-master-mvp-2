import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CoachProfile, StudentProfile, ConnectionRequest } from '@/types/poker';

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
  
  // Student methods
  isStudent: boolean;
  studentProfile: StudentProfile | null;
  connectedCoach: CoachProfile | null;
  createStudentProfile: (displayName: string) => Promise<void>;
  connectWithCoach: (code: string) => Promise<void>;
  disconnectFromCoach: () => Promise<void>;
  
  // Loading states
  loading: boolean;
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
  const { user } = useAuth();

  // State for coach
  const [isCoach, setIsCoach] = useState<boolean>(false);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  
  // State for student
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [connectedCoach, setConnectedCoach] = useState<CoachProfile | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);

  // Load user profile and related data when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    } else {
      // Reset state when user logs out
      resetState();
    }
  }, [user?.id]);

  // Set up real-time subscriptions for connection requests
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('coach_student_connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_student_connections',
          filter: `coach_id=eq.${user.id}`,
        },
        () => {
          loadPendingRequests();
          loadStudents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_student_connections',
          filter: `student_id=eq.${user.id}`,
        },
        () => {
          loadConnectedCoach();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const resetState = () => {
    setIsCoach(false);
    setCoachProfile(null);
    setStudents([]);
    setPendingRequests([]);
    setConnectionCode(null);
    setIsStudent(false);
    setStudentProfile(null);
    setConnectedCoach(null);
  };

  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile.role === 'coach') {
        setIsCoach(true);
        setIsStudent(false);
        setCoachProfile({
          id: profile.id,
          userId: profile.id,
          displayName: profile.full_name,
          bio: profile.online_nickname || undefined,
          students: [],
          comments: [],
          createdAt: new Date(profile.created_at),
        });
        setConnectionCode(profile.connection_code);
        await loadPendingRequests();
        await loadStudents();
      } else if (profile.role === 'student') {
        setIsStudent(true);
        setIsCoach(false);
        setStudentProfile({
          id: profile.id,
          userId: profile.id,
          displayName: profile.full_name,
          createdAt: new Date(profile.created_at),
        });
        await loadConnectedCoach();
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('coach_student_connections')
        .select(`
          *,
          profiles!student_id(full_name)
        `)
        .eq('coach_id', user.id)
        .eq('approved', false);

      if (error) {
        console.error('Error loading pending requests:', error);
        return;
      }

      const requests: ConnectionRequest[] = data.map(item => ({
        id: item.id,
        coachId: item.coach_id,
        studentId: item.student_id,
        status: 'pending',
        createdAt: new Date(item.created_at),
        studentName: item.profiles?.full_name || 'Unknown Student',
      }));

      setPendingRequests(requests);
    } catch (error) {
      console.error('Error in loadPendingRequests:', error);
    }
  };

  const loadStudents = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('coach_student_connections')
        .select(`
          *,
          profiles!student_id(*)
        `)
        .eq('coach_id', user.id)
        .eq('approved', true);

      if (error) {
        console.error('Error loading students:', error);
        return;
      }

      const studentProfiles: StudentProfile[] = data.map(item => ({
        id: item.profiles.id,
        userId: item.profiles.id,
        displayName: item.profiles.full_name,
        createdAt: new Date(item.profiles.created_at),
        coachId: user.id,
      }));

      setStudents(studentProfiles);
    } catch (error) {
      console.error('Error in loadStudents:', error);
    }
  };

  const loadConnectedCoach = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('coach_student_connections')
        .select(`
          *,
          profiles!coach_id(*)
        `)
        .eq('student_id', user.id)
        .eq('approved', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading connected coach:', error);
        return;
      }

      if (data) {
        setConnectedCoach({
          id: data.profiles.id,
          userId: data.profiles.id,
          displayName: data.profiles.full_name,
          bio: data.profiles.online_nickname || undefined,
          students: [],
          comments: [],
          createdAt: new Date(data.profiles.created_at),
        });
      }
    } catch (error) {
      console.error('Error in loadConnectedCoach:', error);
    }
  };

  // Coach methods
  const createCoachProfile = async (displayName: string, bio?: string) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'coach',
          full_name: displayName,
          online_nickname: bio,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      await loadUserProfile();
      
      toast({
        title: "Coach Profile Created",
        description: "You can now generate a connection code for students."
      });
    } catch (error) {
      console.error('Error creating coach profile:', error);
      toast({
        title: "Error",
        description: "Failed to create coach profile.",
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
      console.error('Error generating connection code:', error);
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
      console.error('Error disabling connection code:', error);
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
      const { error } = await supabase
        .from('coach_student_connections')
        .update({ approved: true })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      await loadPendingRequests();
      await loadStudents();
      
      toast({
        title: "Request Approved",
        description: "The student is now connected to you."
      });
    } catch (error) {
      console.error('Error approving connection request:', error);
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
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      await loadPendingRequests();
      
      toast({
        title: "Request Declined",
        description: "The connection request has been declined."
      });
    } catch (error) {
      console.error('Error declining connection request:', error);
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
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('coach_id', user.id)
        .eq('student_id', studentId);

      if (error) {
        throw error;
      }

      await loadStudents();
      
      toast({
        title: "Student Removed",
        description: "The student has been removed from your coaching list."
      });
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Student methods
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
        description: "You can now connect with a coach using their code."
      });
    } catch (error) {
      console.error('Error creating student profile:', error);
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
      // Find coach by connection code
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

      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from('coach_student_connections')
        .select('*')
        .eq('coach_id', coach.id)
        .eq('student_id', user.id)
        .single();

      if (existingConnection) {
        toast({
          title: "Request Already Exists",
          description: existingConnection.approved 
            ? "You are already connected to this coach."
            : "You have already sent a request to this coach.",
          variant: "destructive"
        });
        return;
      }

      // Create connection request
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
      console.error('Error connecting with coach:', error);
      toast({
        title: "Error",
        description: "Failed to connect with coach.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectFromCoach = async () => {
    if (!user?.id || !connectedCoach) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('student_id', user.id)
        .eq('coach_id', connectedCoach.id);

      if (error) {
        throw error;
      }

      setConnectedCoach(null);
      
      toast({
        title: "Disconnected",
        description: "You have disconnected from your coach."
      });
    } catch (error) {
      console.error('Error disconnecting from coach:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from coach.",
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
    
    // Student
    isStudent,
    studentProfile,
    connectedCoach,
    createStudentProfile,
    connectWithCoach,
    disconnectFromCoach,
    
    // Loading
    loading,
  };

  return (
    <CoachStudentContext.Provider value={value}>
      {children}
    </CoachStudentContext.Provider>
  );
};
