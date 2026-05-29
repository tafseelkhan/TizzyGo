// services/loginService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  login,
  verifyLogin,
} from '../../../api/features/public/authPublicSlice';

export const loginService = {
  async sendOTP(identifier: string) {
    try {
      let formattedIdentifier = identifier.trim();
      if (!identifier.includes('@')) {
        formattedIdentifier = identifier.replace(/\D/g, '');
      }

      const res = await login({ identifier: formattedIdentifier });

      if (res.msg?.toLowerCase().includes('otp sent')) {
        return {
          success: true,
          message: `OTP sent to ${identifier}`,
          identifier: formattedIdentifier,
        };
      } else {
        return {
          success: false,
          message: res.msg || 'User not found. Please sign up first.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Login failed. Please try again.',
      };
    }
  },

  async verifyOTP(identifier: string, otp: string) {
    try {
      const res = await verifyLogin({ identifier, otp });

      if (res.token && res.user && res.user._id) {
        await AsyncStorage.setItem('authToken', res.token);
        await AsyncStorage.setItem('userId', res.user._id);
        return { success: true, token: res.token, userId: res.user._id };
      } else {
        return { success: false, message: 'Invalid OTP. Please try again.' };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'OTP verification failed',
      };
    }
  },

  async resendOTP(identifier: string) {
    try {
      const res = await login({ identifier });

      if (res.msg?.toLowerCase().includes('otp sent')) {
        return {
          success: true,
          message: `OTP resent to ${identifier}`,
        };
      } else {
        return {
          success: false,
          message: res.msg || 'Failed to resend OTP',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Something went wrong while resending OTP',
      };
    }
  },
};
