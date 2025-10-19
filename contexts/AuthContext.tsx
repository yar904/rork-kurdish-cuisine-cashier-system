import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'guest' | 'staff' | 'admin';

interface User {
  role: UserRole;
  authenticated: boolean;
}

const AUTH_STORAGE_KEY = '@tapse_auth';

const ROLE_PASSWORDS = {
  staff: '123tapse',
  admin: 'farman12',
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User>({
    role: 'guest',
    authenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
      }
    } catch (error) {
      console.log('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    if (password === ROLE_PASSWORDS.admin) {
      const newUser: User = { role: 'admin', authenticated: true };
      setUser(newUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      return { success: true, role: 'admin' };
    } else if (password === ROLE_PASSWORDS.staff) {
      const newUser: User = { role: 'staff', authenticated: true };
      setUser(newUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      return { success: true, role: 'staff' };
    }
    
    return { success: false, error: 'Invalid password' };
  }, []);

  const logout = useCallback(async () => {
    const guestUser: User = { role: 'guest', authenticated: false };
    setUser(guestUser);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const hasAccess = useCallback((requiredRole: UserRole): boolean => {
    if (!user.authenticated) return false;
    if (requiredRole === 'guest') return true;
    if (user.role === 'admin') return true;
    if (requiredRole === 'staff' && user.role === 'staff') return true;
    return false;
  }, [user]);

  return useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    hasAccess,
  }), [user, isLoading, login, logout, hasAccess]);
});
