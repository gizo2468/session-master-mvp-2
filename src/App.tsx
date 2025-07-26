
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SessionProvider } from "@/context/SessionContext";
import AuthGuard from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import SessionForm from "./pages/SessionForm";
import LiveSession from "./pages/LiveSession";
import SessionHistory from "./pages/SessionHistory";
import SessionDetail from "./pages/SessionDetail";
import EditSession from "./pages/EditSession";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import FocusModePage from "./pages/FocusModePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
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
          <AuthGuard>
            <SessionProvider>
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
                <Route path="/focus-mode" element={<FocusModePage />} />
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              </Routes>
            </SessionProvider>
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
