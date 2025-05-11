import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SessionForm from "./pages/SessionForm";
import SessionHistory from "./pages/SessionHistory";
import SessionDetail from "./pages/SessionDetail";
import LiveSession from "./pages/LiveSession";
import ConfirmSession from "./pages/ConfirmSession";
import FocusModePage from "./pages/FocusModePage";
import CoachProfile from "./pages/CoachProfile";
import ConnectCoach from "./pages/ConnectCoach";
import CoachDashboard from "./pages/CoachDashboard";
import CoachStudentDetail from "./pages/CoachStudentDetail";
import CoachSessionReview from "./pages/CoachSessionReview";
import CoachFeedbackArchive from "./pages/CoachFeedbackArchive";
import CoachUpgrade from "./pages/CoachUpgrade";
import PlayerDashboard from "./pages/PlayerDashboard";
import Settings from "./pages/Settings";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/auth/ResetPassword";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfUse from "./pages/legal/TermsOfUse";
import { SessionProvider } from "./context/SessionContext";
import { CoachStudentProvider } from "./context/CoachStudentContext";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { TutorialProvider } from "./context/TutorialContext"; // Import the TutorialProvider
import AppTutorial from "./components/tutorial/AppTutorial"; // Import the AppTutorial component
import ProtectedRoute from "./components/auth/ProtectedRoute";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Create a new query client instance
const queryClient = new QueryClient();

const App = () => (
  <TooltipPrimitive.Provider>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <LanguageProvider>
          <TutorialProvider> {/* Add the TutorialProvider */}
            <SessionProvider>
              <CoachStudentProvider>
                <BrowserRouter>
                  <AppTutorial /> {/* Add the AppTutorial component */}
                  <Routes>
                    {/* Auth Routes */}
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/signup" element={<Signup />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    
                    {/* Legal Pages - Available without authentication */}
                    <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                    <Route path="/legal/terms" element={<TermsOfUse />} />
                    
                    {/* Protected Routes */}
                    <Route 
                      path="/" 
                      element={
                        <ProtectedRoute>
                          <Index />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/new-session" 
                      element={
                        <ProtectedRoute>
                          <SessionForm />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/history" 
                      element={
                        <ProtectedRoute>
                          <SessionHistory />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/session/:id" 
                      element={
                        <ProtectedRoute>
                          <SessionDetail />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/live-session/:id" 
                      element={
                        <ProtectedRoute>
                          <LiveSession />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/confirm-session" 
                      element={
                        <ProtectedRoute>
                          <ConfirmSession />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/focus-mode" 
                      element={
                        <ProtectedRoute>
                          <FocusModePage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/coach-profile" 
                      element={
                        <ProtectedRoute>
                          <CoachProfile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/connect-coach" 
                      element={
                        <ProtectedRoute>
                          <ConnectCoach />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/coach-dashboard" 
                      element={
                        <ProtectedRoute>
                          <CoachDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/coach-upgrade" 
                      element={
                        <ProtectedRoute>
                          <CoachUpgrade />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/player-dashboard" 
                      element={
                        <ProtectedRoute>
                          <PlayerDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/coach/student/:studentId" 
                      element={
                        <ProtectedRoute>
                          <CoachStudentDetail />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/coach/student/:studentId/session/:sessionId" 
                      element={
                        <ProtectedRoute>
                          <CoachSessionReview />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/coach/feedback-archive" 
                      element={
                        <ProtectedRoute>
                          <CoachFeedbackArchive />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Redirect to login if accessing the root when not logged in */}
                    <Route path="/" element={<Navigate to="/auth/login" replace />} />
                    
                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </CoachStudentProvider>
            </SessionProvider>
          </TutorialProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </TooltipPrimitive.Provider>
);

export default App;
