
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { CoachProfile, StudentProfile, ConnectionRequest, ConnectionCode } from '@/types/poker';

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

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedCoachProfile = localStorage.getItem('coachProfile');
    if (storedCoachProfile) {
      setCoachProfile(JSON.parse(storedCoachProfile));
      setIsCoach(true);
    }
    
    const storedStudentProfile = localStorage.getItem('studentProfile');
    if (storedStudentProfile) {
      setStudentProfile(JSON.parse(storedStudentProfile));
      setIsStudent(true);
    }
    
    const storedStudents = localStorage.getItem('students');
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }
    
    const storedRequests = localStorage.getItem('pendingRequests');
    if (storedRequests) {
      setPendingRequests(JSON.parse(storedRequests));
    }
    
    const storedCode = localStorage.getItem('connectionCode');
    if (storedCode) {
      setConnectionCode(storedCode);
    }
    
    const storedConnectedCoach = localStorage.getItem('connectedCoach');
    if (storedConnectedCoach) {
      setConnectedCoach(JSON.parse(storedConnectedCoach));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (coachProfile) {
      localStorage.setItem('coachProfile', JSON.stringify(coachProfile));
    }
    if (studentProfile) {
      localStorage.setItem('studentProfile', JSON.stringify(studentProfile));
    }
    if (students.length > 0) {
      localStorage.setItem('students', JSON.stringify(students));
    }
    if (pendingRequests.length > 0) {
      localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));
    }
    if (connectionCode) {
      localStorage.setItem('connectionCode', connectionCode);
    }
    if (connectedCoach) {
      localStorage.setItem('connectedCoach', JSON.stringify(connectedCoach));
    }
  }, [coachProfile, studentProfile, students, pendingRequests, connectionCode, connectedCoach]);

  // Coach methods
  const createCoachProfile = (displayName: string, bio?: string) => {
    const newCoach: CoachProfile = {
      id: uuidv4(),
      userId: 'user-' + uuidv4().substring(0, 8), // Simplified user ID for demo
      displayName,
      bio,
      students: [],
      createdAt: new Date(),
    };
    
    setCoachProfile(newCoach);
    setIsCoach(true);
    setIsStudent(false); // Can't be both coach and student
    setStudentProfile(null);
    
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
      userId: 'user-' + uuidv4().substring(0, 8), // Simplified user ID for demo
      displayName,
      createdAt: new Date(),
    };
    
    setStudentProfile(newStudent);
    setIsStudent(true);
    setIsCoach(false); // Can't be both coach and student
    setCoachProfile(null);
    
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
    
    // Update coach's student list (if we had the coach object)
    // In a real application, this would update the coach's data in a database
    
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
