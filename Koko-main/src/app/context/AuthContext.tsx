import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// ============================================================
// Types
// ============================================================
export interface OrgUser {
  id: string;
  auth_user_id: string;
  org_id: string;
  branch_id: string | null;
  role: string;
  full_name: string;
  phone: string | null;
  avatar_color: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  logo_url: string | null;
  business_activity: string;
  currency: string;
  country: string;
  timezone: string;
  language: string;
  decimal_places: number;
  plan: string;
  plan_expires_at: string | null;
  max_users: number;
  max_branches: number;
  max_invoices_per_month: number;
  enable_inventory: boolean;
  enable_manufacturing: boolean;
  enable_payroll: boolean;
  enable_multi_warehouse: boolean;
  enable_multi_currency: boolean;
  enable_vat: boolean;
  vat_rate: number;
  is_active: boolean;
}

export interface Branch {
  id: string;
  org_id: string;
  name: string;
  code: string;
  is_main: boolean;
  is_active: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  orgUser: OrgUser | null;
  organization: Organization | null;
  branches: Branch[];
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasOrganization: boolean;
  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; userId?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  // Org actions
  createOrganization: (data: CreateOrgData) => Promise<{ error: string | null; orgId?: string }>;
  switchBranch: (branchId: string) => void;
  refreshOrgData: () => Promise<void>;
}

export interface CreateOrgData {
  name: string;
  slug: string;
  business_activity: string;
  country: string;
  currency: string;
  full_name: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// Provider
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [orgUser, setOrgUser] = useState<OrgUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load org data for a user
  const loadOrgData = async (userId: string) => {
    try {
      // Load org_user record
      const { data: orgUserData, error: ouError } = await supabase
        .from('org_users')
        .select('*')
        .eq('auth_user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (ouError || !orgUserData) {
        setOrgUser(null);
        setOrganization(null);
        setBranches([]);
        setCurrentBranch(null);
        return;
      }

      setOrgUser(orgUserData as OrgUser);

      // Load organization
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgUserData.org_id)
        .single();

      if (orgData) setOrganization(orgData as Organization);

      // Load branches
      const { data: branchesData } = await supabase
        .from('branches')
        .select('*')
        .eq('org_id', orgUserData.org_id)
        .eq('is_active', true)
        .order('is_main', { ascending: false });

      if (branchesData) {
        setBranches(branchesData as Branch[]);
        // Set current branch (saved in localStorage or main branch)
        const savedBranchId = localStorage.getItem(`branch_${orgUserData.org_id}`);
        const selectedBranch = branchesData.find((b: any) => b.id === savedBranchId)
          || branchesData.find((b: any) => b.is_main)
          || branchesData[0];
        setCurrentBranch(selectedBranch as Branch);
      }

      // Update last login
      await supabase
        .from('org_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', orgUserData.id);

    } catch (error) {
      console.error('Error loading org data:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadOrgData(currentSession.user.id);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          await loadOrgData(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          setOrgUser(null);
          setOrganization(null);
          setBranches([]);
          setCurrentBranch(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================
  // Auth Actions
  // ============================================================

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const errorMessages: Record<string, string> = {
        'Invalid login credentials': 'بيانات الدخول غير صحيحة',
        'Email not confirmed': 'يرجى تأكيد البريد الإلكتروني أولاً',
      };
      return { error: errorMessages[error.message] || error.message };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      const errorMessages: Record<string, string> = {
        'User already registered': 'هذا البريد مسجل مسبقاً',
        'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      };
      return { error: errorMessages[error.message] || error.message };
    }
    return { error: null, userId: data.user?.id };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOrgUser(null);
    setOrganization(null);
    setBranches([]);
    setCurrentBranch(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  // ============================================================
  // Organization Actions
  // ============================================================

  const createOrganization = async (data: CreateOrgData) => {
    if (!user) return { error: 'يجب تسجيل الدخول أولاً' };

    try {
      const { data: result, error } = await supabase.rpc('setup_new_organization', {
        p_auth_user_id: user.id,
        p_org_name: data.name,
        p_org_slug: data.slug,
        p_business_activity: data.business_activity,
        p_country: data.country,
        p_currency: data.currency,
        p_full_name: data.full_name,
      });

      if (error) {
        if (error.message.includes('duplicate key') && error.message.includes('slug')) {
          return { error: 'هذا الرابط مستخدم مسبقاً، اختر رابط آخر' };
        }
        return { error: error.message };
      }

      // Reload org data
      await loadOrgData(user.id);
      return { error: null, orgId: result as string };
    } catch (e: any) {
      return { error: e.message || 'حدث خطأ غير متوقع' };
    }
  };

  const switchBranch = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch && organization) {
      setCurrentBranch(branch);
      localStorage.setItem(`branch_${organization.id}`, branchId);
    }
  };

  const refreshOrgData = async () => {
    if (user) await loadOrgData(user.id);
  };

  return (
    <AuthContext.Provider value={{
      session, user, orgUser, organization, branches, currentBranch, setCurrentBranch,
      isLoading,
      isAuthenticated: !!session && !!user,
      hasOrganization: !!orgUser && !!organization,
      signIn, signUp, signOut, resetPassword,
      createOrganization, switchBranch, refreshOrgData,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
