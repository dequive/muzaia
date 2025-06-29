// Authentication hook
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuthStore } from '@/store';
import { authApi } from '@/lib/api';
import type { User, Session } from '@/types';
import { toast } from 'react-hot-toast';

export function useAuth() {
  const router = useRouter();
  const { user, session, isAuthenticated, setUser, setSession } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const supabase = createClientComponentClient();

  // Inicializar autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verificar sessão do Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          return;
        }

        if (session?.user) {
          const userSession: Session = {
            user: {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name,
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
              metadata: session.user.user_metadata,
            },
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          };

          setSession(userSession);
          
          // Salvar token para API
          localStorage.setItem('mozaia_token', session.access_token);
        }
      } catch (error) {
        console.error('Erro na inicialização da auth:', error);
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    initAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          const userSession: Session = {
            user: {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name,
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
              metadata: session.user.user_metadata,
            },
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          };

          setSession(userSession);
          localStorage.setItem('mozaia_token', session.access_token);
          toast.success('Login realizado com sucesso!');
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          localStorage.removeItem('mozaia_token');
          router.push('/login');
          toast.success('Logout realizado com sucesso!');
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          localStorage.setItem('mozaia_token', session.access_token);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setSession, router]);

  // Funções de autenticação
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      toast.success('Conta criada com sucesso! Verifique seu email.');
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro no registro:', error);
      toast.error(error.message || 'Erro ao criar conta');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro no logout:', error);
      toast.error(error.message || 'Erro ao fazer logout');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Email de recuperação enviado!');
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.message || 'Erro ao enviar email de recuperação');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        throw error;
      }

      // Atualizar store local
      if (user) {
        setUser({ ...user, ...updates });
      }

      toast.success('Perfil atualizado com sucesso!');
      return { success: true, data };
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error.message || 'Erro ao atualizar perfil');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estado
    user,
    session,
    isAuthenticated,
    loading,
    initializing,

    // Funções
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };
}
