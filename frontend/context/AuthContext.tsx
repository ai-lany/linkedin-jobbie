import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterData, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load token and user from storage on mount
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('currentUser');
      
      console.log('Loading auth data...', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUser 
      });
      
      if (storedToken) {
        setToken(storedToken);
        
        // Set stored user immediately for faster UI
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            console.log('Setting cached user:', user.username);
            setCurrentUser(user);
          } catch (err) {
            console.error('Failed to parse stored user:', err);
          }
        }
        
        // Fetch fresh user data in background
        await fetchCurrentUser(storedToken);
      } else {
        console.log('No stored token found');
      }
    } catch (err) {
      console.error('Failed to load auth data:', err);
    } finally {
      setIsLoading(false);
      console.log('Auth loading complete');
    }
  };

  const fetchCurrentUser = async (authToken: string) => {
    try {
      console.log('Fetching current user with token:', authToken.substring(0, 20) + '...');
      const response = await fetch(`${API_URL}/users/current`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Current user response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('Fetched user data:', userData.username);
        const user = {
          id: userData._id,
          username: userData.username,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          resume: userData.resume,
          workHistory: userData.workHistory,
          additionalInfo: userData.additionalInfo,
        };
        setCurrentUser(user);
        
        // Store user data for faster loading next time
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        // Token is invalid, clear it
        const errorText = await response.text();
        console.log('Token invalid, status:', response.status, 'error:', errorText);
        await logout();
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      // Don't logout on network errors, keep using cached user data
      // setError('Failed to load user data');
    }
  };

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.email || data.password || 'Login failed');
        setIsLoading(false);
        return false;
      }

      // Store token
      await AsyncStorage.setItem('authToken', data.token);
      setToken(data.token);

      // Set user data
      const user = {
        id: data.user._id,
        username: data.user.username,
        email: data.user.email,
        phoneNumber: data.user.phoneNumber,
        resume: data.user.resume,
        workHistory: data.user.workHistory,
        additionalInfo: data.user.additionalInfo,
      };
      setCurrentUser(user);
      
      // Store user data
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
      setIsLoading(false);
      return false;
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (responseData.errors) {
          const errorMessages = Object.values(responseData.errors).join(', ');
          setError(errorMessages);
        } else {
          setError(responseData.message || 'Registration failed');
        }
        setIsLoading(false);
        return false;
      }

      // Store token
      await AsyncStorage.setItem('authToken', responseData.token);
      setToken(responseData.token);

      // Set user data
      const user = {
        id: responseData.user._id,
        username: responseData.user.username,
        email: responseData.user.email,
        phoneNumber: responseData.user.phoneNumber,
        resume: responseData.user.resume,
        workHistory: responseData.user.workHistory,
        additionalInfo: responseData.user.additionalInfo,
      };
      setCurrentUser(user);
      
      // Store user data
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('currentUser');
      setToken(null);
      setCurrentUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    try {
      await fetchCurrentUser(token);
      return true;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return false;
    }
  }, [token]);

  const updateUserPreferences = useCallback(async (preferences: Partial<User['additionalInfo']>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/users/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to update preferences');
        setIsLoading(false);
        return false;
      }

      // Update currentUser with new data
      setCurrentUser({
        id: data.user._id,
        username: data.user.username,
        email: data.user.email,
        phoneNumber: data.user.phoneNumber,
        resume: data.user.resume,
        workHistory: data.user.workHistory,
        additionalInfo: data.user.additionalInfo,
      });

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Preferences update error:', err);
      setError('Network error. Please try again.');
      setIsLoading(false);
      return false;
    }
  }, [token]);

  const value: AuthContextType = useMemo(() => ({
    currentUser,
    isLoading,
    error,
    token,
    login,
    register,
    logout,
    clearError,
    refreshUser,
    updateUserPreferences,
    isAuthenticated: !!currentUser && !!token,
  }), [currentUser, isLoading, error, token, login, register, logout, clearError, refreshUser, updateUserPreferences]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
