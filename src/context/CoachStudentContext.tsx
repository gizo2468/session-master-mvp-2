
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  displayName: string;
  email?: string;
  createdAt: string;
  sessionCount?: number;
  lastActivity?: string;
}

interface CoachProfile {
  id: string;
  displayName: string;
  bio?: string;
  email?: string;
  connectionCode?: string;
  students: Student[];
}

interface StudentProfile {
  id: string;
  displayName: string;
  email?: string;
}

interface PendingRequest {
  id: string;
  studentId: string;
  studentName: string;
  createdAt: string;
}

interface CoachStudentContextType {
  isCoach: boolean;
  isStudent: boolean;
  students: Student[];
  connectedCoach: CoachProfile | null;
  coachProfile: CoachProfile | null;
  studentProfile: StudentProfile | null;
  pendingRequests: PendingRequest[];
  connectionCode: string | null;
  loading: boolean;
  connectToCoach: (connectionCode: string) => Promise<boolean>;
  connectWithCoach: (connectionCode: string) => Promise<void>;
  disconnectFromCoach: () => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  approveConnectionRequest: (requestId: string) => Promise<void>;
  declineConnectionRequest: (requestId: string) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  generateConnectionCode: () => Promise<string | null>;
  disableConnectionCode: () => Promise<void>;
  createCoachProfile: (displayName: string, bio?: string) => Promise<void>;
  createStudentProfile: (displayName: string) => Promise<void>;
  loadStudents: () => Promise<void>;
  loadPendingRequests: () => Promise<void>;
}

const CoachStudentContext = createContext<CoachStudentContextType | undefined>(undefined);

export const CoachStudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCoach, setIsCoach] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [connectedCoach, setConnectedCoach] = useState<CoachProfile | null>(null);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize context when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 CoachStudentContext: Initializing for user:', user.id);
      initializeContext();
      setupRealtimeSubscriptions();
    } else {
      resetContext();
    }
  }, [user?.id]);

  const resetContext = () => {
    console.log('🔄 CoachStudentContext: Resetting context');
    setIsCoach(false);
    setIsStudent(false);
    setStudents([]);
    setConnectedCoach(null);
    setCoachProfile(null);
    setStudentProfile(null);
    setPendingRequests([]);
    setConnectionCode(null);
  };

  const initializeContext = async () => {
    if (!user?.id) return;
    
    console.log('🔄 CoachStudentContext: Loading user profile for:', user.id);
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Error loading user profile:', error);
        return;
      }

      console.log('✅ User profile loaded:', profile);
      
      const userIsCoach = profile?.role === 'coach';
      const userIsStudent = profile?.role === 'student';
      setIsCoach(userIsCoach);
      setIsStudent(userIsStudent);

      if (userIsCoach) {
        const coachData: CoachProfile = {
          id: profile.id,
          displayName: profile.full_name || 'Coach',
          bio: profile.bio || undefined,
          email: profile.email,
          connectionCode: profile.connection_code,
          students: []
        };
        setCoachProfile(coachData);
        setConnectionCode(profile.connection_code);
        await loadStudents();
        await loadPendingRequests();
      } 
      
      if (userIsStudent) {
        const studentData: StudentProfile = {
          id: profile.id,
          displayName: profile.full_name || 'Student',
          email: profile.email
        };
        setStudentProfile(studentData);
        await loadConnectedCoach();
      }
    } catch (error) {
      console.error('❌ Error in initializeContext:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    console.log('🔄 Setting up realtime subscriptions for user:', user.id);

    const channel = supabase
      .channel('coach-student-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_student_connections',
          filter: `coach_id=eq.${user.id},student_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Coach-student connection change detected:', payload);
          // Reload data after a brief delay to ensure DB consistency
          setTimeout(() => {
            if (isCoach) {
              loadStudents();
              loadPendingRequests();
            } else {
              loadConnectedCoach();
            }
          }, 500);
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
    };
  };

  const loadStudents = async () => {
    if (!user?.id) return;
    
    console.log('🔍 Loading students for coach:', user.id);
    setLoading(true);
    
    try {
      const { data: connections, error } = await supabase
        .from('coach_student_connections')
        .select(`
          id,
          student_id,
          created_at,
          profiles!coach_student_connections_student_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('coach_id', user.id)
        .eq('approved', true);

      if (error) {
        console.error('❌ Error loading students:', error);
        toast({
          title: "Error",
          description: "Failed to load students. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('📋 Raw student connections loaded:', connections);

      // Transform and validate the data
      const studentList: Student[] = (connections || []).map(connection => {
        const profile = connection.profiles;
        const displayName = profile?.full_name || profile?.email || `Student ${connection.student_id.slice(-4)}`;
        
        console.log('🔄 Processing student connection:', {
          connectionId: connection.id,
          studentId: connection.student_id,
          profile: profile,
          displayName: displayName
        });

        return {
          id: connection.student_id,
          displayName: displayName,
          email: profile?.email,
          createdAt: connection.created_at,
          sessionCount: 0, // Will be updated separately
          lastActivity: undefined // Will be updated separately
        };
      });

      console.log('✅ Processed students list:', studentList);
      setStudents(studentList);

      // Update coach profile with students
      setCoachProfile(prev => prev ? { ...prev, students: studentList } : null);

      // Load session counts and last activity for each student
      await loadStudentSessionData(studentList);

    } catch (error) {
      console.error('❌ Error in loadStudents:', error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentSessionData = async (studentList: Student[]) => {
    console.log('🔍 Loading session data for students');
    
    const updatedStudents = await Promise.all(
      studentList.map(async (student) => {
        try {
          const { data: sessions, error } = await supabase
            .from('sessions')
            .select('id, start_time')
            .eq('user_id', student.id)
            .order('start_time', { ascending: false });

          if (error) {
            console.error(`❌ Error loading sessions for student ${student.id}:`, error);
            return student;
          }

          console.log(`📊 Sessions for student ${student.displayName}:`, sessions);

          const sessionCount = sessions?.length || 0;
          const lastActivity = sessions?.[0]?.start_time || undefined;

          return {
            ...student,
            sessionCount,
            lastActivity
          };
        } catch (error) {
          console.error(`❌ Error loading session data for student ${student.id}:`, error);
          return student;
        }
      })
    );

    console.log('✅ Updated students with session data:', updatedStudents);
    setStudents(updatedStudents);
    setCoachProfile(prev => prev ? { ...prev, students: updatedStudents } : null);
  };

  const loadPendingRequests = async () => {
    if (!user?.id) return;
    
    console.log('🔍 Loading pending requests for coach:', user.id);
    
    try {
      const { data: requests, error } = await supabase
        .from('coach_student_connections')
        .select(`
          id,
          student_id,
          created_at,
          profiles!coach_student_connections_student_id_fkey (
            full_name,
            email
          )
        `)
        .eq('coach_id', user.id)
        .eq('approved', false);

      if (error) {
        console.error('❌ Error loading pending requests:', error);
        return;
      }

      console.log('📋 Raw pending requests loaded:', requests);

      const requestList: PendingRequest[] = (requests || []).map(request => {
        const profile = request.profiles;
        const studentName = profile?.full_name || profile?.email || `Student ${request.student_id.slice(-4)}`;
        
        console.log('🔄 Processing pending request:', {
          requestId: request.id,
          studentId: request.student_id,
          profile: profile,
          studentName: studentName
        });

        return {
          id: request.id,
          studentId: request.student_id,
          studentName: studentName,
          createdAt: request.created_at
        };
      });

      console.log('✅ Processed pending requests:', requestList);
      setPendingRequests(requestList);
    } catch (error) {
      console.error('❌ Error in loadPendingRequests:', error);
    }
  };

  const loadConnectedCoach = async () => {
    if (!user?.id) return;
    
    console.log('🔍 Loading connected coach for student:', user.id);
    
    try {
      const { data: connection, error } = await supabase
        .from('coach_student_connections')
        .select(`
          coach_id,
          profiles!coach_student_connections_coach_id_fkey (
            full_name,
            email,
            bio
          )
        `)
        .eq('student_id', user.id)
        .eq('approved', true)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found is expected if no coach
          console.error('❌ Error loading connected coach:', error);
        }
        setConnectedCoach(null);
        return;
      }

      console.log('📋 Connected coach data:', connection);

      if (connection?.profiles) {
        const coach: CoachProfile = {
          id: connection.coach_id,
          displayName: connection.profiles.full_name || connection.profiles.email || 'Coach',
          bio: connection.profiles.bio,
          email: connection.profiles.email,
          students: []
        };
        
        console.log('✅ Connected coach set:', coach);
        setConnectedCoach(coach);
      } else {
        setConnectedCoach(null);
      }
    } catch (error) {
      console.error('❌ Error in loadConnectedCoach:', error);
      setConnectedCoach(null);
    }
  };

  const connectToCoach = async (connectionCode: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data: coach, error: coachError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('connection_code', connectionCode)
        .eq('role', 'coach')
        .single();

      if (coachError || !coach) {
        toast({
          title: "Invalid Code",
          description: "No coach found with this connection code.",
          variant: "destructive"
        });
        return false;
      }

      const { error: connectionError } = await supabase
        .from('coach_student_connections')
        .insert({
          coach_id: coach.id,
          student_id: user.id,
          approved: false
        });

      if (connectionError) {
        if (connectionError.code === '23505') {
          toast({
            title: "Already Connected",
            description: "You are already connected to this coach.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Connection Failed",
            description: "Failed to send connection request.",
            variant: "destructive"
          });
        }
        return false;
      }

      toast({
        title: "Request Sent",
        description: `Connection request sent to ${coach.full_name}.`
      });
      return true;
    } catch (error) {
      console.error('Error connecting to coach:', error);
      toast({
        title: "Error",
        description: "Failed to connect to coach.",
        variant: "destructive"
      });
      return false;
    }
  };

  const connectWithCoach = async (connectionCode: string): Promise<void> => {
    await connectToCoach(connectionCode);
  };

  const disconnectFromCoach = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('student_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Disconnected",
        description: "You have been disconnected from your coach."
      });

      setConnectedCoach(null);
    } catch (error) {
      console.error('Error disconnecting from coach:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from coach.",
        variant: "destructive"
      });
    }
  };

  const approveRequest = async (requestId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('coach_student_connections')
        .update({ approved: true })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      toast({
        title: "Request Approved",
        description: "Student connection approved successfully."
      });

      // Reload data after approval
      setTimeout(() => {
        loadStudents();
        loadPendingRequests();
      }, 500);
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request.",
        variant: "destructive"
      });
    }
  };

  const declineRequest = async (requestId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      toast({
        title: "Request Declined",
        description: "Student connection request declined."
      });

      loadPendingRequests();
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: "Error",
        description: "Failed to decline request.",
        variant: "destructive"
      });
    }
  };

  // Aliases for backward compatibility
  const approveConnectionRequest = approveRequest;
  const declineConnectionRequest = declineRequest;

  const removeStudent = async (studentId: string): Promise<void> => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('coach_student_connections')
        .delete()
        .eq('coach_id', user.id)
        .eq('student_id', studentId);

      if (error) {
        throw error;
      }

      toast({
        title: "Student Removed",
        description: "Student has been removed from your list."
      });

      loadStudents();
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student.",
        variant: "destructive"
      });
    }
  };

  const generateConnectionCode = async (): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase.rpc('generate_connection_code');

      if (error) {
        throw error;
      }

      const newCode = data as string;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ connection_code: newCode })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setConnectionCode(newCode);
      setCoachProfile(prev => prev ? { ...prev, connectionCode: newCode } : null);

      toast({
        title: "Code Generated",
        description: "New connection code generated successfully."
      });

      return newCode;
    } catch (error) {
      console.error('Error generating connection code:', error);
      toast({
        title: "Error",
        description: "Failed to generate connection code.",
        variant: "destructive"
      });
      return null;
    }
  };

  const disableConnectionCode = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ connection_code: null })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setConnectionCode(null);
      setCoachProfile(prev => prev ? { ...prev, connectionCode: undefined } : null);

      toast({
        title: "Code Disabled",
        description: "Connection code has been disabled."
      });
    } catch (error) {
      console.error('Error disabling connection code:', error);
      toast({
        title: "Error",
        description: "Failed to disable connection code.",
        variant: "destructive"
      });
    }
  };

  const createCoachProfile = async (displayName: string, bio?: string): Promise<void> => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'coach',
          full_name: displayName,
          bio: bio
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Created",
        description: "Your coach profile has been created successfully."
      });

      // Reinitialize context to load coach data
      initializeContext();
    } catch (error) {
      console.error('Error creating coach profile:', error);
      toast({
        title: "Error",
        description: "Failed to create coach profile.",
        variant: "destructive"
      });
    }
  };

  const createStudentProfile = async (displayName: string): Promise<void> => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'student',
          full_name: displayName
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Created",
        description: "Your student profile has been created successfully."
      });

      // Reinitialize context to load student data
      initializeContext();
    } catch (error) {
      console.error('Error creating student profile:', error);
      toast({
        title: "Error",
        description: "Failed to create student profile.",
        variant: "destructive"
      });
    }
  };

  const contextValue: CoachStudentContextType = {
    isCoach,
    isStudent,
    students,
    connectedCoach,
    coachProfile,
    studentProfile,
    pendingRequests,
    connectionCode,
    loading,
    connectToCoach,
    connectWithCoach,
    disconnectFromCoach,
    approveRequest,
    declineRequest,
    approveConnectionRequest,
    declineConnectionRequest,
    removeStudent,
    generateConnectionCode,
    disableConnectionCode,
    createCoachProfile,
    createStudentProfile,
    loadStudents,
    loadPendingRequests
  };

  return (
    <CoachStudentContext.Provider value={contextValue}>
      {children}
    </CoachStudentContext.Provider>
  );
};

export const useCoachStudent = (): CoachStudentContextType => {
  const context = useContext(CoachStudentContext);
  if (!context) {
    throw new Error('useCoachStudent must be used within a CoachStudentProvider');
  }
  return context;
};
