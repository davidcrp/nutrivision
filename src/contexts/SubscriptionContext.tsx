import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type SubscriptionTier = "free" | "premium";

interface SubscriptionContextType {
  subscriptionTier: SubscriptionTier;
  isPaywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  upgradeToPremium: () => void;
  /** Run callback if premium, otherwise open paywall */
  handlePremiumAction: (actionCallback: () => void) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(() => {
    return (localStorage.getItem("subscription_tier") as SubscriptionTier) || "free";
  });
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

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
