'use client';

import { useCallback, useEffect, useState } from 'react';

type AuthSession = {
  accessToken: string | null;
  refreshToken: string | null;
  userEmail: string | null;
  userId: string | null;
  userName: string | null;
};

const authStorageKeys = ['accessToken', 'refreshToken', 'userId', 'userEmail', 'userName'] as const;

const emptySession: AuthSession = {
  accessToken: null,
  refreshToken: null,
  userEmail: null,
  userId: null,
  userName: null,
};

const readSession = (): AuthSession => {
  if (typeof window === 'undefined') return emptySession;

  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    userEmail: localStorage.getItem('userEmail'),
    userId: localStorage.getItem('userId'),
    userName: localStorage.getItem('userName'),
  };
};

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession>(readSession);

  useEffect(() => {
    setSession(readSession());
  }, []);

  const saveSession = useCallback((nextSession: Partial<AuthSession>) => {
    Object.entries(nextSession).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    });

    setSession(readSession());
  }, []);

  const clearSession = useCallback(() => {
    authStorageKeys.forEach((key) => localStorage.removeItem(key));
    setSession(readSession());
  }, []);

  return {
    ...session,
    clearSession,
    isAuthenticated: Boolean(session.accessToken),
    saveSession,
  };
}

export type { AuthSession };
