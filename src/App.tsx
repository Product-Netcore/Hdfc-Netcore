import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import SupabaseTest from "./pages/SupabaseTest";
import PremiumGate from "./pages/PremiumGate";
import NotFound from "./pages/NotFound";
import AccountSettings from "./pages/AccountSettings";
import FacebookCallback from "./pages/FacebookCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Home route - redirects to campaigns */}
          <Route path="/" element={<Index />} />
          
          {/* Active/Implemented Routes */}
          <Route path="/engage/campaigns" element={<Campaigns />} />
          <Route path="/supabase-test" element={<SupabaseTest />} />
          <Route path="/account-settings" element={<AccountSettings />} />
          <Route path="/settings/account" element={<AccountSettings />} />
          <Route path="/fb-callback" element={<FacebookCallback />} />
          
          {/* Premium-gated / Unfinished Routes */}
          <Route path="/dashboards" element={<PremiumGate feature="Dashboards" />} />
          <Route path="/engage" element={<PremiumGate feature="Engage Hub" />} />
          <Route path="/engage/journey" element={<PremiumGate feature="Journey Builder" />} />
          <Route path="/engage/onsite" element={<PremiumGate feature="On-site Messages" />} />
          <Route path="/audiences" element={<PremiumGate feature="Audiences" />} />
          <Route path="/content" element={<PremiumGate feature="Content Management" />} />
          <Route path="/analytics" element={<PremiumGate feature="Analytics" />} />
          
          {/* Dynamic premium route for future features */}
          <Route path="/premium/:feature" element={<PremiumGate />} />
          
          {/* App-level 404 for unknown routes (rarely triggered due to Netlify fallback) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
