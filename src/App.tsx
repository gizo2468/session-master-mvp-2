
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CoachStudentProvider } from "@/context/CoachStudentContext";
import { SessionProvider } from "@/context/SessionContext";
import AuthGuard from "@/components/auth/AuthGuard";
import LoadingScreen from "@/components/LoadingScreen";

// Lazy load route components for better performance
const Index = lazy(() => import("./pages/Index"));
const SessionForm = lazy(() => import("./pages/SessionForm"));
const LiveSession = lazy(() => import("./pages/LiveSession"));
const SessionHistory = lazy(() => import("./pages/SessionHistory"));
const SessionDetail = lazy(() => import("./pages/SessionDetail"));
const EditSession = lazy(() => import("./pages/EditSession"));
const Settings = lazy(() => import("./pages/Settings"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const Help = lazy(() => import("./pages/legal/Help"));
const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const FocusModePage = lazy(() => import("./pages/FocusModePage"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const CoachProfile = lazy(() => import("./pages/CoachProfile"));
const Subscription = lazy(() => import("./pages/Subscription"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SubscriptionCancel = lazy(() => import("./pages/SubscriptionCancel"));
const Notifications = lazy(() => import("./pages/Notifications"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CoachStudentProvider>
            <SessionProvider>
              <AuthGuard>
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/new-session" element={<SessionForm />} />
                    {/* FIXED: Change route parameter from :sessionId to :id to match useParams */}
                    <Route path="/session/:id" element={<LiveSession />} />
                    <Route path="/session/:sessionId/edit" element={<EditSession />} />
                    <Route path="/session/:sessionId/details" element={<SessionDetail />} />
                    <Route path="/history" element={<SessionHistory />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/player/:playerId" element={<PlayerProfile />} />
                    <Route path="/coach/:coachId" element={<CoachProfile />} />
                    <Route path="/focus-mode" element={<FocusModePage />} />
                    <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/signup" element={<Signup />} />
                    <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                    <Route path="/subscription" element={<Subscription />} />
                    <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                    <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
                    <Route path="/notifications" element={<Notifications />} />
                  </Routes>
                </Suspense>
              </AuthGuard>
            </SessionProvider>
          </CoachStudentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
