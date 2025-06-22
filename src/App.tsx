
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SessionProvider } from "@/context/SessionContext";
import Index from "./pages/Index";
import SessionForm from "./pages/SessionForm";
import LiveSession from "./pages/LiveSession";
import SessionHistory from "./pages/SessionHistory";
import SessionDetail from "./pages/SessionDetail";
import EditSession from "./pages/EditSession";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SessionProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/new-session" element={<SessionForm />} />
              <Route path="/session/:sessionId" element={<LiveSession />} />
              <Route path="/session/:sessionId/edit" element={<EditSession />} />
              <Route path="/session/:sessionId/details" element={<SessionDetail />} />
              <Route path="/history" element={<SessionHistory />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
            </Routes>
          </SessionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
