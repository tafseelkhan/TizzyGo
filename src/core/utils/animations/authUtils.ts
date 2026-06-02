// utiles/authUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyToken } from '../../../api/features/private/splashPrivateSlice';

export const checkAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return { token, isValid: !!token };
  } catch (error) {
    console.error('Error checking auth token:', error);
    return { token: null, isValid: false };
  }
};

export const verifyAndNavigate = async (minTimeElapsed: boolean) => {
  try {
    const { token } = await checkAuthToken();

    if (!minTimeElapsed) return null;

    if (!token) {
      return { shouldNavigate: true, route: 'Signup' };
    }

    const { success } = await verifyToken();

    if (success) {
      return { shouldNavigate: true, route: 'Home' };
    } else {
      await AsyncStorage.removeItem('authToken');
      return { shouldNavigate: true, route: 'Login' };
    }
  } catch (error) {
    console.error('Auth error:', error);
    if (minTimeElapsed) {
      return { shouldNavigate: true, route: 'Signup' };
    }
    return null;
  }
};
