// utiles/signupValidation.ts
export const validateSignupForm = (name: string, emailOrPhone: string) => {
  const newErrors = {
    name: !name ? 'Please enter your name' : '',
    emailOrPhone: !emailOrPhone ? 'Please enter your email or phone' : '',
  };
  return newErrors;
};

export const isPhoneNumber = (value: string): boolean => {
  return /^\d{4}/.test(value);
};

export const isEmailAddress = (value: string): boolean => {
  return value.includes('@');
};