import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from '@/hooks/useAuth';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <App />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
