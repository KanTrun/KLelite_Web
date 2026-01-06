import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { getCurrentUser } from '../store/slices/authSlice';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';
import { storage } from '../utils/storage';

export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const theme = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getToken();
      if (token) {
        dispatch(getCurrentUser());
      }
    };
    checkAuth();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
