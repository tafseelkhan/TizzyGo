// services/signupService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signup,
  verifySignup,
} from '../../../api/features/public/authPublicSlice';

export const signupService = {
  async sendOTP(identifier: string) {
    const res = await signup({ identifier });
    return {
      success: !!res.identifier,
      identifier: res.identifier,
      message:
        res.msg ||
        (res.identifier
          ? `OTP sent to ${res.identifier}`
          : 'Something went wrong'),
    };
  },

  async verifyOTP(identifier: string, otp: string, name: string) {
    const res = await verifySignup({ identifier, otp, name });

    if (res.token && res.user && res.user._id) {
      await AsyncStorage.setItem('authToken', res.token);
      await AsyncStorage.setItem('userId', res.user._id);
      return { success: true, token: res.token, userId: res.user._id };
    }

    return { success: false, message: res.msg || 'Invalid OTP' };
  },

  async resendOTP(identifier: string) {
    return this.sendOTP(identifier);
  },
};
