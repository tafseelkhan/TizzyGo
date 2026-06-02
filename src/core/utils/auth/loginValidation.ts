// utiles/loginValidation.ts
export const validateIdentifier = (
  identifier: string,
): { isValid: boolean; error: string; formattedIdentifier?: string } => {
  if (!identifier.trim()) {
    return { isValid: false, error: 'Please enter your email or phone number' };
  }

  const isEmail = identifier.includes('@');
  const isPhone = /^\d+$/.test(identifier.replace(/\D/g, ''));

  if (isEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier.trim())) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true, formattedIdentifier: identifier.trim(), error: '' };
  }

  if (isPhone) {
    const cleanPhone = identifier.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return {
        isValid: false,
        error: 'Please enter a valid 10-digit phone number',
      };
    }
    return { isValid: true, formattedIdentifier: cleanPhone, error: '' };
  }

  return {
    isValid: false,
    error: 'Please enter a valid email or phone number',
  };
};

export const validateOTP = (
  otp: string,
): { isValid: boolean; error: string } => {
  if (!otp) {
    return { isValid: false, error: 'Please enter the OTP' };
  }
  if (otp.length !== 6) {
    return { isValid: false, error: 'Please enter a valid 6-digit OTP' };
  }
  return { isValid: true, error: '' };
};
