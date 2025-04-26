
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { SessionProvider } from "./context/SessionContext";
import { CoachStudentProvider } from "./context/CoachStudentContext";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Create a new query client instance
const queryClient = new QueryClient();

const App = () => (
  <TooltipPrimitive.Provider>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <SessionProvider>
        <CoachStudentProvider>
          <BrowserRouter>
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
              <Route path="/coach/student/:studentId" element={<CoachStudentDetail />} />
              <Route path="/coach/student/:studentId/session/:sessionId" element={<CoachSessionReview />} />
              <Route path="/coach/feedback-archive" element={<CoachFeedbackArchive />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CoachStudentProvider>
      </SessionProvider>
    </QueryClientProvider>
  </TooltipPrimitive.Provider>
);

export default App;
