/**
 * Copyright (c) 2026-present, TizzyGo, Inc. and its affiliates.
 * All rights reserved.
 */

export const API_ENDPOINTS = {
  // Authentication endpoints
  VERIFY_USER_ROUTE: '/api/auth/check',
  SIGNUP: '/api/auth/signup',
  VERIFY_SIGNUP: '/api/auth/verify-signup',
  LOGIN: '/api/auth/login',
  VERIFY_LOGIN: '/api/auth/verify-login',
  RESEND_OTP: '/api/auth/resend-otp',

  // Profile endpoints
  GET_PROFILE: '/api/profile/me',
  UPDATE_PROFILE: '/api/profile/update',
};

/**
 * @API_ENDPOINTS contains the API endpoint paths used in the application.

 * @property {string} VERIFY_USER_ROUTE - The endpoint for verifying the user's authentication token.

 * @property {string} SIGNUP - The endpoint for initiating the signup process by sending an OTP.

 * @property {string} VERIFY_SIGNUP - The endpoint for verifying the OTP during signup and creating a new user account.

 * @property {string} LOGIN - The endpoint for initiating the login process by sending an OTP.

 * @property {string} VERIFY_LOGIN - The endpoint for verifying the OTP during login and authenticating the user.

 * @property {string} RESEND_OTP - The endpoint for resending the OTP to the user.

  * @property {string} GET_PROFILE - The endpoint for retrieving the authenticated user's profile information.

  * @property {string} UPDATE_PROFILE - The endpoint for updating the authenticated user's profile information.
 */
