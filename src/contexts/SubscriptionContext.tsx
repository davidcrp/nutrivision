import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionTier = "free" | "premium";

interface SubscriptionContextType {
  subscriptionTier: SubscriptionTier;
  isPaywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  upgradeToPremium: () => void;
  handlePremiumAction: (actionCallback: () => void) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(
    () => (localStorage.getItem("subscription_tier") as SubscriptionTier) || "free"
  );
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Sync subscription status from database profile
  useEffect(() => {
    const fetchStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.subscription_status) {
        const tier: SubscriptionTier =
          profile.subscription_status === "premium" ? "premium" : "free";
        setSubscriptionTier(tier);
        localStorage.setItem("subscription_tier", tier);
      }
    };

    fetchStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchStatus();
      } else {
        setSubscriptionTier("free");
        localStorage.setItem("subscription_tier", "free");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const openPaywall = useCallback(() => setIsPaywallOpen(true), []);
  const closePaywall = useCallback(() => setIsPaywallOpen(false), []);

  const upgradeToPremium = useCallback(() => {
    setSubscriptionTier("premium");
    localStorage.setItem("subscription_tier", "premium");
    setIsPaywallOpen(false);
  }, []);

  const handlePremiumAction = useCallback(
    (actionCallback: () => void) => {
      if (subscriptionTier === "premium") {
        actionCallback();
      } else {
        setIsPaywallOpen(true);
      }
    },
    [subscriptionTier]
  );

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionTier,
        isPaywallOpen,
        openPaywall,
        closePaywall,
        upgradeToPremium,
        handlePremiumAction,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
};
