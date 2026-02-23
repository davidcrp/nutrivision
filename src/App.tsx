import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MealProvider, useMealsContext } from "@/contexts/MealContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import PaywallModal from "@/components/PaywallModal";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import CameraPage from "./pages/CameraPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProfilePage from "./pages/ProfilePage";
import AnalysisPage from "./pages/AnalysisPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { onboardingComplete } = useMealsContext();

  return (
    <Routes>
      <Route path="/onboarding" element={onboardingComplete ? <Navigate to="/" replace /> : <OnboardingPage />} />
      <Route path="/" element={onboardingComplete ? <Index /> : <Navigate to="/onboarding" replace />} />
      <Route path="/search" element={onboardingComplete ? <SearchPage /> : <Navigate to="/onboarding" replace />} />
      <Route path="/camera" element={onboardingComplete ? <CameraPage /> : <Navigate to="/onboarding" replace />} />
      <Route path="/analysis" element={onboardingComplete ? <AnalysisPage /> : <Navigate to="/onboarding" replace />} />
      <Route path="/favorites" element={onboardingComplete ? <FavoritesPage /> : <Navigate to="/onboarding" replace />} />
      <Route path="/profile" element={onboardingComplete ? <ProfilePage /> : <Navigate to="/onboarding" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <MealProvider>
          <SubscriptionProvider>
            <Toaster />
            <Sonner />
            <PaywallModal />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </SubscriptionProvider>
        </MealProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
