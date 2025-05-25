
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { CoachProfile, StudentProfile, ConnectionRequest, ConnectionCode, CoachComment } from '@/types/poker';

interface CoachStudentContextType {
  // Coach methods
  isCoach: boolean;
  coachProfile: CoachProfile | null;
  students: StudentProfile[];
  pendingRequests: ConnectionRequest[];
  connectionCode: string | null;
  createCoachProfile: (displayName: string, bio?: string) => void;
  generateConnectionCode: () => string;
  disableConnectionCode: () => void;
  approveConnectionRequest: (requestId: string) => void;
  declineConnectionRequest: (requestId: string) => void;
  removeStudent: (studentId: string) => void;
  
  // Student methods
  isStudent: boolean;
  studentProfile: StudentProfile | null;
  connectedCoach: CoachProfile | null;
  createStudentProfile: (displayName: string) => void;
  connectWithCoach: (code: string) => void;
  disconnectFromCoach: () => void;
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

  // State for coach - start with empty arrays for new users
  const [isCoach, setIsCoach] = useState<boolean>(false);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  
  // State for student
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [connectedCoach, setConnectedCoach] = useState<CoachProfile | null>(null);
  
  // Load data from localStorage on component mount - only load if it exists
  useEffect(() => {
    const storedCoachProfile = localStorage.getItem('coachProfile');
    if (storedCoachProfile) {
      try {
        const parsedProfile = JSON.parse(storedCoachProfile);
        setCoachProfile(parsedProfile);
        setIsCoach(true);
      } catch (error) {
        console.error('Error parsing coach profile from localStorage:', error);
        localStorage.removeItem('coachProfile');
      }
    }
    
    const storedStudentProfile = localStorage.getItem('studentProfile');
    if (storedStudentProfile) {
      try {
        const parsedProfile = JSON.parse(storedStudentProfile);
        setStudentProfile(parsedProfile);
        setIsStudent(true);
      } catch (error) {
        console.error('Error parsing student profile from localStorage:', error);
        localStorage.removeItem('studentProfile');
      }
    }
    
    const storedStudents = localStorage.getItem('students');
    if (storedStudents) {
      try {
        const parsedStudents = JSON.parse(storedStudents);
        // Only load real students, not demo data
        if (Array.isArray(parsedStudents) && parsedStudents.length > 0) {
          setStudents(parsedStudents);
        }
      } catch (error) {
        console.error('Error parsing students from localStorage:', error);
        localStorage.removeItem('students');
      }
    }
    
    const storedRequests = localStorage.getItem('pendingRequests');
    if (storedRequests) {
      try {
        const parsedRequests = JSON.parse(storedRequests);
        if (Array.isArray(parsedRequests)) {
          setPendingRequests(parsedRequests);
        }
      } catch (error) {
        console.error('Error parsing pending requests from localStorage:', error);
        localStorage.removeItem('pendingRequests');
      }
    }
    
    const storedCode = localStorage.getItem('connectionCode');
    if (storedCode) {
      setConnectionCode(storedCode);
    }
    
    const storedConnectedCoach = localStorage.getItem('connectedCoach');
    if (storedConnectedCoach) {
      try {
        const parsedCoach = JSON.parse(storedConnectedCoach);
        setConnectedCoach(parsedCoach);
      } catch (error) {
        console.error('Error parsing connected coach from localStorage:', error);
        localStorage.removeItem('connectedCoach');
      }
    }
  }, []);

  // Save data to localStorage whenever it changes - only save if data exists
  useEffect(() => {
    if (coachProfile) {
      localStorage.setItem('coachProfile', JSON.stringify(coachProfile));
    }
  }, [coachProfile]);

  useEffect(() => {
    if (studentProfile) {
      localStorage.setItem('studentProfile', JSON.stringify(studentProfile));
    }
  }, [studentProfile]);

  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('students', JSON.stringify(students));
    } else {
      // Clear localStorage if no students
      localStorage.removeItem('students');
    }
  }, [students]);

  useEffect(() => {
    if (pendingRequests.length > 0) {
      localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));
    } else {
      // Clear localStorage if no pending requests
      localStorage.removeItem('pendingRequests');
    }
  }, [pendingRequests]);

  useEffect(() => {
    if (connectionCode) {
      localStorage.setItem('connectionCode', connectionCode);
    } else {
      localStorage.removeItem('connectionCode');
    }
  }, [connectionCode]);

  useEffect(() => {
    if (connectedCoach) {
      localStorage.setItem('connectedCoach', JSON.stringify(connectedCoach));
    }
  }, [connectedCoach]);

  // Coach methods
  const createCoachProfile = (displayName: string, bio?: string) => {
    const newCoach: CoachProfile = {
      id: uuidv4(),
      userId: 'user-' + uuidv4().substring(0, 8),
      displayName,
      bio,
      students: [], // Start with empty students array
      comments: [], // Start with empty comments array
      createdAt: new Date(),
    };
    
    setCoachProfile(newCoach);
    setIsCoach(true);
    setIsStudent(false); // Can't be both coach and student
    setStudentProfile(null);
    setConnectedCoach(null);
    
    // Clear any existing student data when creating new coach profile
    setStudents([]);
    setPendingRequests([]);
    setConnectionCode(null);
    
    toast({
      title: "Coach Profile Created",
      description: "You can now generate a connection code for students."
    });
  };

  const generateConnectionCode = () => {
    // Generate a 6-character alphanumeric code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking characters
    const codeLength = 6;
    let result = '';
    
    for (let i = 0; i < codeLength; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    setConnectionCode(result);
    
    toast({
      title: "Code Generated",
      description: `Your connection code: ${result}`
    });
    
    return result;
  };

  const disableConnectionCode = () => {
    setConnectionCode(null);
    toast({
      title: "Code Disabled",
      description: "Your connection code has been disabled."
    });
  };

  const approveConnectionRequest = (requestId: string) => {
    // Find the request
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request || !coachProfile) return;
    
    // Find the student
    const student = JSON.parse(localStorage.getItem(`student-${request.studentId}`) || 'null');
    if (!student) return;
    
    // Update student with coach ID
    const updatedStudent = { ...student, coachId: coachProfile.id };
    localStorage.setItem(`student-${student.id}`, JSON.stringify(updatedStudent));
    
    // Update coach's student list
    const updatedCoach = { 
      ...coachProfile, 
      students: [...coachProfile.students, student.id] 
    };
    setCoachProfile(updatedCoach);
    
    // Add student to local list
    setStudents(prev => [...prev, updatedStudent]);
    
    // Remove the request from pending
    setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    
    toast({
      title: "Request Approved",
      description: `${student.displayName} is now your student.`
    });
  };

  const declineConnectionRequest = (requestId: string) => {
    // Find the request
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) return;
    
    // Remove the request
    setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    
    toast({
      title: "Request Declined",
      description: "The connection request has been declined."
    });
  };

  const removeStudent = (studentId: string) => {
    if (!coachProfile) return;
    
    // Update coach's student list
    const updatedCoach = {
      ...coachProfile,
      students: coachProfile.students.filter(id => id !== studentId)
    };
    setCoachProfile(updatedCoach);
    
    // Remove student from local list
    setStudents(prev => prev.filter(student => student.id !== studentId));
    
    // Update student's coach ID to null
    const student = JSON.parse(localStorage.getItem(`student-${studentId}`) || 'null');
    if (student) {
      const updatedStudent = { ...student, coachId: undefined };
      localStorage.setItem(`student-${studentId}`, JSON.stringify(updatedStudent));
    }
    
    toast({
      title: "Student Removed",
      description: "The student has been removed from your coaching list."
    });
  };

  // Student methods
  const createStudentProfile = (displayName: string) => {
    const newStudent: StudentProfile = {
      id: uuidv4(),
      userId: 'user-' + uuidv4().substring(0, 8),
      displayName,
      createdAt: new Date(),
    };
    
    setStudentProfile(newStudent);
    setIsStudent(true);
    setIsCoach(false); // Can't be both coach and student
    setCoachProfile(null);
    
    // Clear any existing coach data when creating student profile
    setStudents([]);
    setPendingRequests([]);
    setConnectionCode(null);
    setConnectedCoach(null);
    
    // Store in localStorage for persistence
    localStorage.setItem(`student-${newStudent.id}`, JSON.stringify(newStudent));
    
    toast({
      title: "Student Profile Created",
      description: "You can now connect with a coach using their code."
    });
  };

  const connectWithCoach = (code: string) => {
    if (!studentProfile) {
      toast({
        title: "Error",
        description: "Please create a student profile first.",
        variant: "destructive"
      });
      return;
    }
    
    // This would normally validate against a database of active codes
    // For this demo, we're checking local storage directly
    if (code !== connectionCode) {
      toast({
        title: "Invalid Code",
        description: "The code you entered is invalid or expired.",
        variant: "destructive"
      });
      return;
    }
    
    // Find the coach
    if (!coachProfile) {
      toast({
        title: "Error",
        description: "Coach not found.",
        variant: "destructive"
      });
      return;
    }
    
    // Create connection request
    const newRequest: ConnectionRequest = {
      id: uuidv4(),
      coachId: coachProfile.id,
      studentId: studentProfile.id,
      status: 'pending',
      createdAt: new Date()
    };
    
    // Add to pending requests
    setPendingRequests(prev => [...prev, newRequest]);
    
    toast({
      title: "Request Sent",
      description: `Your request to connect with ${coachProfile.displayName} has been sent.`
    });
  };

  const disconnectFromCoach = () => {
    if (!studentProfile || !connectedCoach) return;
    
    // Update student
    const updatedStudent = { ...studentProfile, coachId: undefined };
    setStudentProfile(updatedStudent);
    localStorage.setItem(`student-${studentProfile.id}`, JSON.stringify(updatedStudent));
    
    // Reset coach connection
    setConnectedCoach(null);
    
    toast({
      title: "Disconnected",
      description: "You have disconnected from your coach."
    });
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
  };

  return (
    <CoachStudentContext.Provider value={value}>
      {children}
    </CoachStudentContext.Provider>
  );
};
