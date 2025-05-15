
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
import { TutorialProvider } from "./context/TutorialContext";
import AppTutorial from "./components/tutorial/AppTutorial";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Create a new query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <TooltipPrimitive.Provider>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              {/* Auth Routes - Available without authentication */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              
              {/* Legal Pages - Available without authentication */}
              <Route path="/legal/privacy" element={<PrivacyPolicy />} />
              <Route path="/legal/terms" element={<TermsOfUse />} />
              
              {/* All protected routes wrapped in providers that need auth */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <TutorialProvider currentPath={window.location.pathname}>
                    <CoachStudentProvider>
                      <SessionProvider>
                        <AppTutorial />
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/new-session" element={<SessionForm />} />
                          <Route path="/history" element={<SessionHistory />} />
                          <Route path="/session/:id" element={<SessionDetail />} />
                          <Route path="/live-session/:id" element={<LiveSession />} />
                          <Route path="/confirm-session" element={<ConfirmSession />} />
                          <Route path="/focus-mode" element={<FocusModePage />} />
                          <Route path="/coach-profile" element={<CoachProfile />} />
                          <Route path="/connect-coach" element={<ConnectCoach />} />
                          <Route path="/coach-dashboard" element={<CoachDashboard />} />
                          <Route path="/coach-upgrade" element={<CoachUpgrade />} />
                          <Route path="/player-dashboard" element={<PlayerDashboard />} />
                          <Route path="/coach/student/:studentId" element={<CoachStudentDetail />} />
                          <Route path="/coach/student/:studentId/session/:sessionId" element={<CoachSessionReview />} />
                          <Route path="/coach/feedback-archive" element={<CoachFeedbackArchive />} />
                          <Route path="/settings" element={<Settings />} />
                          {/* Catch-all route inside protected area */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </SessionProvider>
                    </CoachStudentProvider>
                  </TutorialProvider>
                </ProtectedRoute>
              } />
              
              {/* Redirect any unknown routes to login */}
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </TooltipPrimitive.Provider>
);

export default App;
