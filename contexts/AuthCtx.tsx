// contexts/AuthCtx.tsx
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

type SubscriptionStatus = 'none' | 'active' | 'inactive' | 'unknown';

export type CompanyProfile = {
  industry: string;
  companySize: string;
  goals: string[];
  targetAudience: string;
  currentPlatforms: string[];
  contentTypes: string[];
  postingFrequency: string;
};

export type User = {
  id: string;
  email?: string;
  subscriptionStatus: SubscriptionStatus;
  onboardingCompleted?: boolean;
};

export type Product = {
  productId: string;
  price: number;
  localizedPrice: string;
};

type Plan = 'monthly' | 'yearly';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  products: Product[];
  companyProfile: CompanyProfile | null;

  // DEV-Auth
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;

  // IAP-Mocks
  subscribe: (plan: Plan) => Promise<void>;
  restorePurchases: () => Promise<boolean>;

  // Onboarding & Profil
  updateCompanyProfile: (profile: CompanyProfile) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const STORAGE_USER = 'auth_user';
const STORAGE_COMPANY_PROFILE = 'company_profile';

export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  // Demo-Produkte – später via react-native-iap ersetzen
  useEffect(() => {
    setProducts([
      { productId: 'com.deinpaket.socialpro.premium.monthly', price: 4.99, localizedPrice: '4,99 €' },
      { productId: 'com.deinpaket.socialpro.premium.yearly',  price: 49.99, localizedPrice: '49,99 €' },
    ]);
  }, []);

  // Laden aus Storage
  useEffect(() => {
    (async () => {
      try {
        const [rawUser, rawProfile] = await Promise.all([
          AsyncStorage.getItem(STORAGE_USER),
          AsyncStorage.getItem(STORAGE_COMPANY_PROFILE),
        ]);
        if (rawUser) setUser(JSON.parse(rawUser));
        if (rawProfile) setCompanyProfile(JSON.parse(rawProfile));
      } catch (e) {
        console.error('[Auth] load failed:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistUser = async (u: User | null) => {
    try {
      if (u) await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(u));
      else await AsyncStorage.removeItem(STORAGE_USER);
    } catch (e) {
      console.error('[Auth] persist user failed:', e);
    }
  };

  const persistCompanyProfile = async (p: CompanyProfile | null) => {
    try {
      if (p) await AsyncStorage.setItem(STORAGE_COMPANY_PROFILE, JSON.stringify(p));
      else await AsyncStorage.removeItem(STORAGE_COMPANY_PROFILE);
    } catch (e) {
      console.error('[Auth] persist profile failed:', e);
    }
  };

  // --- DEV-Login ---
  const signIn = async (email: string) => {
    const next: User = {
      id: String(Date.now()),
      email,
      subscriptionStatus: 'none',
      onboardingCompleted: false,
    };
    setUser(next);
    await persistUser(next);
  };

  const signOut = async () => {
    setUser(null);
    setCompanyProfile(null);
    await Promise.all([persistUser(null), persistCompanyProfile(null)]);
  };

  // --- IAP-Mocks ---
  const subscribe = async (plan: Plan) => {
    console.log('[Auth] subscribe', plan);
    setUser(prev => {
      const base: User = prev ?? { id: 'demo', email: 'demo@example.com', subscriptionStatus: 'none', onboardingCompleted: false };
      const next = { ...base, subscriptionStatus: 'active' as const };
      persistUser(next);
      return next;
    });
  };

  const restorePurchases = async (): Promise<boolean> => {
    console.log('[Auth] restorePurchases');
    const base: User = user ?? { id: 'demo', email: 'demo@example.com', subscriptionStatus: 'none', onboardingCompleted: false };
    const next = { ...base, subscriptionStatus: 'active' as const };
    setUser(next);
    await persistUser(next);
    return true;
  };

  // --- Onboarding & Profil ---
  const updateCompanyProfile = async (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    await persistCompanyProfile(profile);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const next: User = { ...user, onboardingCompleted: true };
    setUser(next);
    await persistUser(next);
  };

  return useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    products,
    companyProfile,
    signIn,
    signOut,
    subscribe,
    restorePurchases,
    updateCompanyProfile,
    completeOnboarding,
    setUser,
  }), [user, isLoading, products, companyProfile]);
});

export default AuthProvider;
