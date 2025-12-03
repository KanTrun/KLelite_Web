import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  login as loginAction, 
  register as registerAction, 
  logout as logoutAction,
  getCurrentUser,
  clearError,
  updateUserProfile
} from '@/store/slices/authSlice';
import type { LoginCredentials, RegisterData, User } from '@/types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  // Login
  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await dispatch(loginAction(credentials));
    return result;
  }, [dispatch]);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    const result = await dispatch(registerAction(data));
    return result;
  }, [dispatch]);

  // Logout
  const logout = useCallback(async () => {
    await dispatch(logoutAction());
  }, [dispatch]);

  // Update profile
  const updateProfile = useCallback((data: Partial<User>) => {
    dispatch(updateUserProfile(data));
  }, [dispatch]);

  // Clear error
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearAuthError,
  };
};
