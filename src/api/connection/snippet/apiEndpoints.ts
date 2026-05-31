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

  // Orders endpoints
  MY_ORDERS: '/api/orders/yourorder/my',
  ORDER_DETAILS: '/api/orders/delivery',
  LIVE_TRACKING: '/api/orders/tracking/live',

  // Cart endpoints
  PRODUCT_VARIANTS: '/api/products',
  ADD_TO_CART: '/api/cart/add',
  UPDATE_CART: '/api/cart/update',
  REMOVE_FROM_CART: '/api/cart/remove',
  CHECK_CART: '/api/cart/check',

  // Buy Now endpoints
  BUYNOW_PRODUCT_VARIANTS: (productId: string) =>
    `/api/products/${productId}/variants`,
  CLEAR_BUY_NOW: '/api/buy-now/clear',
  BUY_NOW: '/api/buy-now',

  // Product endpoints
  GET_PRODUCT: '/api/seller/forms/categories',

  // Rating & Review endpoints
  RATING_STATS: '/api/rating-review/rating/stats',
  PRODUCT_REVIEWS: '/api/rating-review/rating/reviews',

  // Share endpoints
  CREATE_SHARE: '/api/shares/create',

  // Comments endpoints
  FETCH_COMMENTERS: '/api/comments/comments/unique-user-count',
  FETCH_COMMENTS: '/api/comments/post',
  ADD_COMMENT: '/api/comments/add',
  ADD_REPLY: '/api/comments/reply',
  TOGGLE_COMMENT_LIKE: '/api/comments/like',
  TOGGLE_REPLY_LIKE: '/api/comments/like-reply',
  DELETE_COMMENT: '/api/comments/delete',
  DELETE_REPLY: '/api/comments/delete-reply',

  // Users endpoints
  USERS_BATCH: '/api/profile/users/batch',

  // Likes endpoints
  FETCH_LIKE_STATUS: '/api/likes',
  TOGGLE_LIKE: '/api/likes',

  // Rating & Review endpoints
  RATING_GLOBAL_STATS: '/api/ratings/stats',
  REVIEWS: '/api/ratings/reviews',
  REVIEW: '/api/ratings/review',
  USER_RATING: '/api/ratings/user-rating',

  // Payment endpoints
  CREATE_PAYMENT_INTENT: '/api/payment/create-payment-intent',
  PROCESS_PAYMENT: '/api/payment/process-payment',
  CONFIRM_COD: '/api/payment/confirm-cod',

  // Checkout endpoints
  CALCULATE_CHECKOUT: '/api/buyer/buy',

  // Search endpoints
  SEARCH_PRODUCTS: '/api/search/products',
  RECENT_SEARCHES: '/api/search/recent',
  POPULAR_SEARCHES: '/api/search/popular',
  REMOVE_RECENT_SEARCH: '/api/search/recent',
  CLEAR_RECENT_SEARCHES: '/api/search/recent/all',

  // Stories endpoints
  FETCH_STORIES: '/api/stories',
  MARK_STORY_VIEWED: '/api/story/viewed',
  FETCH_VIEWED_STORIES: '/api/story/viewed',

  // Product Rating endpoints
  GET_RATING_STATS: '/api/rating-review/rating/stats',
  GET_REVIEWS: '/api/rating-review/rating/reviews',
  GET_USER_REVIEW: '/api/rating-review/rating/user',
  CREATE_REVIEW: '/api/rating-review/rating',
  UPDATE_REVIEW: '/api/rating-review/rating',
  DELETE_REVIEW: '/api/rating-review/rating',
};

/**
 * @API_ENDPOINTS contains the API endpoint paths used in the application.
 */

/**
 * @property {string} VERIFY_USER_ROUTE - The endpoint for verifying the user's authentication token.

 * @property {string} SIGNUP - The endpoint for initiating the signup process by sending an OTP.

 * @property {string} VERIFY_SIGNUP - The endpoint for verifying the OTP during signup and creating a new user account.

 * @property {string} LOGIN - The endpoint for initiating the login process by sending an OTP.

 * @property {string} VERIFY_LOGIN - The endpoint for verifying the OTP during login and authenticating the user.

 * @property {string} RESEND_OTP - The endpoint for resending the OTP to the user.

  * @property {string} GET_PROFILE - The endpoint for retrieving the authenticated user's profile information.

  * @property {string} UPDATE_PROFILE - The endpoint for updating the authenticated user's profile information.

  * @property {string} MY_ORDERS - The endpoint for fetching the authenticated user's order history.

  * @property {string} ORDER_DETAILS - The endpoint for retrieving detailed information about a specific order.

  * @property {string} LIVE_TRACKING - The endpoint for fetching live tracking information for a specific order.

  * @property {string} PRODUCT_VARIANTS - The endpoint for fetching product variants based on category and subcategory.


 */
