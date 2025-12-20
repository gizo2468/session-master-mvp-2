import { Suspense } from "react";
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
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import AdminGuard from "@/components/admin/AdminGuard";

// Lazy load route components for better performance (with retry on chunk load failure)
const Index = lazyWithRetry(() => import("./pages/Index"), "Index");
const SessionForm = lazyWithRetry(() => import("./pages/SessionForm"), "SessionForm");
const LiveSession = lazyWithRetry(() => import("./pages/LiveSession"), "LiveSession");
const SessionHistory = lazyWithRetry(() => import("./pages/SessionHistory"), "SessionHistory");
const SessionDetail = lazyWithRetry(() => import("./pages/SessionDetail"), "SessionDetail");
const EditSession = lazyWithRetry(() => import("./pages/EditSession"), "EditSession");
const Settings = lazyWithRetry(() => import("./pages/Settings"), "Settings");
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"), "Dashboard");
const PrivacyPolicy = lazyWithRetry(() => import("./pages/legal/PrivacyPolicy"), "PrivacyPolicy");
const Help = lazyWithRetry(() => import("./pages/legal/Help"), "Help");
const Login = lazyWithRetry(() => import("./pages/auth/Login"), "Login");
const Signup = lazyWithRetry(() => import("./pages/auth/Signup"), "Signup");
const ForgotPassword = lazyWithRetry(() => import("./pages/auth/ForgotPassword"), "ForgotPassword");
const ResetPassword = lazyWithRetry(() => import("./pages/auth/ResetPassword"), "ResetPassword");
const PlayerProfile = lazyWithRetry(() => import("./pages/PlayerProfile"), "PlayerProfile");
const CoachProfile = lazyWithRetry(() => import("./pages/CoachProfile"), "CoachProfile");
const Subscription = lazyWithRetry(() => import("./pages/Subscription"), "Subscription");
const SubscriptionSuccess = lazyWithRetry(() => import("./pages/SubscriptionSuccess"), "SubscriptionSuccess");
const SubscriptionCancel = lazyWithRetry(() => import("./pages/SubscriptionCancel"), "SubscriptionCancel");
const Notifications = lazyWithRetry(() => import("./pages/Notifications"), "Notifications");
const UsersManagement = lazyWithRetry(() => import("./pages/admin/UsersManagement"), "UsersManagement");

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
                <AppErrorBoundary>
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
                      <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                      <Route path="/help" element={<Help />} />
                      <Route path="/auth/login" element={<Login />} />
                      <Route path="/auth/signup" element={<Signup />} />
                      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                      <Route path="/auth/reset-password" element={<ResetPassword />} />
                      <Route path="/subscription" element={<Subscription />} />
                      <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                      <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/admin/users" element={<AdminGuard><UsersManagement /></AdminGuard>} />
                    </Routes>
                  </Suspense>
                </AppErrorBoundary>
              </AuthGuard>
            </SessionProvider>
          </CoachStudentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
