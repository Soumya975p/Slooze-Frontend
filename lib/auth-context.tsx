'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { User, AuthPayload } from './types';
import { LOGIN_MUTATION, ME_QUERY } from './graphql/auth';
import { resetApolloClient } from './apollo-client';

interface MeQueryResult { me: User; }
interface LoginMutationResult { login: AuthPayload; }

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [loginMutation] = useMutation<LoginMutationResult>(LOGIN_MUTATION);
  const [fetchMe] = useLazyQuery<MeQueryResult>(ME_QUERY, { fetchPolicy: 'network-only' });

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('slooze_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((result) => {
        const me = (result.data as MeQueryResult | undefined)?.me;
        if (me) setUser(me);
      })
      .catch(() => {
        localStorage.removeItem('slooze_token');
        Cookies.remove('slooze_token');
        Cookies.remove('slooze_role');
      })
      .finally(() => setLoading(false));
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const result = await loginMutation({ variables: { email, password } });
    const { access_token, user: loggedInUser } = (result.data as LoginMutationResult).login;

    // Store token in localStorage and cookies
    localStorage.setItem('slooze_token', access_token);
    Cookies.set('slooze_token', access_token, { expires: 7 });
    Cookies.set('slooze_role', loggedInUser.role, { expires: 7 });

    setUser(loggedInUser);

    // Redirect based on role
    if (loggedInUser.role === 'MANAGER') {
      router.push('/dashboard');
    } else {
      router.push('/products');
    }
  };

  const logout = () => {
    localStorage.removeItem('slooze_token');
    Cookies.remove('slooze_token');
    Cookies.remove('slooze_role');
    setUser(null);
    resetApolloClient();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
