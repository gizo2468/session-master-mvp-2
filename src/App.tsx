
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SessionForm from "./pages/SessionForm";
import SessionHistory from "./pages/SessionHistory";
import SessionDetail from "./pages/SessionDetail";
import ConfirmSession from "./pages/ConfirmSession";
import { SessionProvider } from "./context/SessionContext";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Create a new query client instance
const queryClient = new QueryClient();

const App = () => (
  <TooltipPrimitive.Provider>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/new-session" element={<SessionForm />} />
            <Route path="/history" element={<SessionHistory />} />
            <Route path="/session/:id" element={<SessionDetail />} />
            <Route path="/confirm-session" element={<ConfirmSession />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  </TooltipPrimitive.Provider>
);

export default App;
