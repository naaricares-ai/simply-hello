import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole =
  | 'admin'
  | 'super_admin'
  | 'teacher'
  | 'parent'
  | 'staff'
  | 'principal';

interface UserProfile {
  fullName: string;
  full_name: string;
  email: string;
}

interface AuthContextType {
  user: any;
  role: UserRole | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  authInitialized: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; role: UserRole | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Fetch role from user_roles table
const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0].role as UserRole;
  } catch {
    return null;
  }
};

const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) return null;
    return { fullName: data.full_name, full_name: data.full_name, email: data.email };
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const mounted = useRef(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setRole(null);
    setProfile(null);
    setIsAuthenticated(false);
  }, []);

  const forceLogout = useCallback(async () => {
    clearAuth();
    try { await supabase.auth.signOut(); } catch {}
    try { sessionStorage.removeItem('sms-auth'); } catch {}
    window.location.href = '/login';
  }, [clearAuth]);

  // Listen for global auth:logout events from React Query error handler
  useEffect(() => {
    const handler = () => { forceLogout(); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [forceLogout]);

  useEffect(() => {
    mounted.current = true;

    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted.current) return;

        if (error || !session?.user) {
          clearAuth();
          setAuthInitialized(true);
          return;
        }

        const [userRole, userProfile] = await Promise.all([
          fetchUserRole(session.user.id),
          fetchProfile(session.user.id),
        ]);

        if (!mounted.current) return;

        if (!userRole) {
          await supabase.auth.signOut();
          clearAuth();
          setAuthInitialized(true);
          return;
        }

        setUser(session.user);
        setRole(userRole);
        setProfile(userProfile);
        setIsAuthenticated(true);
        setAuthInitialized(true);
      } catch (err) {
        console.error('[AUTH] Init error:', err);
        clearAuth();
        setAuthInitialized(true);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;

      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        clearAuth();
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        if (!session?.user) {
          // Token refresh failed — session is dead
          console.warn('[AUTH] Token refresh failed, forcing logout');
          forceLogout();
          return;
        }
        // Token refreshed successfully — update the user object with fresh data
        setUser(session.user);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const userRole = await fetchUserRole(session.user.id);
        if (mounted.current && userRole) {
          const userProfile = await fetchProfile(session.user.id);
          setUser(session.user);
          setRole(userRole);
          setProfile(userProfile);
          setIsAuthenticated(true);
        }
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [clearAuth, forceLogout]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message, role: null };
      if (!data.user) return { error: 'Login failed', role: null };

      const [userRole, userProfile] = await Promise.all([
        fetchUserRole(data.user.id),
        fetchProfile(data.user.id),
      ]);

      if (!userRole) {
        await supabase.auth.signOut();
        return {
          error: 'Account not configured. Contact administrator.',
          role: null,
        };
      }

      setUser(data.user);
      setRole(userRole);
      setProfile(userProfile);
      setIsAuthenticated(true);

      return { error: null, role: userRole };
    } catch (err: any) {
      return { error: err.message || 'Login failed', role: null };
    }
  }, []);

  const logout = useCallback(async () => {
    clearAuth();
    try { await supabase.auth.signOut(); } catch {}
    try { sessionStorage.removeItem('sms-auth'); } catch {}
    window.location.href = '/login';
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        profile,
        isAuthenticated,
        authInitialized,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
