/**
 * Copyright (c) 2026-present, TizzyGo, Inc. and its affiliates.
 * All rights reserved.
 */

export const API_ENDPOINTS = {
  // Authentication endpoints
  VERIFY_USER_ROUTE: '/api/v0/auth/check',
  SIGNUP: '/api/v0/auth/signup',
  VERIFY_SIGNUP: '/api/v0/auth/verify-signup',
  LOGIN: '/api/v0/auth/login',
  VERIFY_LOGIN: '/api/v0/auth/verify-login',
  RESEND_OTP: '/api/v0/auth/resend-otp',

  // Profile endpoints
  GET_PROFILE: '/api/v0/profile/me',
  UPDATE_PROFILE: '/api/v0/profile/update',
  DELETE_PROFILE_IMAGE: '/api/v0/profile/delete-image',

  // Orders endpoints
  MY_ORDERS: '/api/v0/orders/yourorder/my',
  ORDER_DETAILS: '/api/v0/orders/delivery',
  LIVE_TRACKING: '/api/v0/orders/tracking/live',

  // Cart endpoints
  PRODUCT_VARIANTS: '/api/v0/products',
  ADD_TO_CART: '/api/v0/cart/add',
  UPDATE_CART: '/api/v0/cart/update',
  REMOVE_FROM_CART: '/api/v0/cart/remove',
  CHECK_CART: '/api/v0/cart/check',

  // Buy Now endpoints
  BUYNOW_PRODUCT_VARIANTS: (productId: string) =>
    `/api/v0/products/${productId}/variants`,
  CLEAR_BUY_NOW: '/api/v0/shop/buy-now/clear',
  BUY_NOW: '/api/v0/shop/buy-now',

  // Product endpoints
  GET_PRODUCT: '/api/v0/seller/forms/categories',

  // Rating & Review endpoints
  RATING_STATS: '/api/v0/rating-review/rating/stats',
  PRODUCT_REVIEWS: '/api/v0/rating-review/rating/reviews',

  // Share endpoints
  CREATE_SHARE: '/api/v0/shares/create',

  // Comments endpoints
  FETCH_COMMENTERS: '/api/v0/comments/comments/unique-user-count',
  FETCH_COMMENTS: '/api/v0/comments/post',
  ADD_COMMENT: '/api/v0/comments/add',
  ADD_REPLY: '/api/v0/comments/reply',
  TOGGLE_COMMENT_LIKE: '/api/v0/comments/like',
  TOGGLE_REPLY_LIKE: '/api/v0/comments/like-reply',
  DELETE_COMMENT: '/api/v0/comments/delete',
  DELETE_REPLY: '/api/v0/comments/delete-reply',

  // Users endpoints
  USERS_BATCH: '/api/v0/profile/users/batch',

  // Likes endpoints
  FETCH_LIKE_STATUS: '/api/v0/likes',
  TOGGLE_LIKE: '/api/v0/likes',

  // Rating & Review endpoints
  RATING_GLOBAL_STATS: '/api/v0/ratings/stats',
  REVIEWS: '/api/v0/ratings/reviews',
  REVIEW: '/api/v0/ratings/review',
  USER_RATING: '/api/v0/ratings/user-rating',

  // Payment endpoints
  CREATE_PAYMENT_INTENT: '/api/v0/payment/create-payment-intent',
  PROCESS_PAYMENT: '/api/v0/payment/process-payment',
  CONFIRM_COD: '/api/v0/payment/confirm-cod',

  // Checkout endpoints
  CALCULATE_CHECKOUT: '/api/v0/buyer/buy',
  GET_SESSION_STATUS: '/checkout/session/:checkoutSessionId',

  // Search endpoints
  SEARCH_PRODUCTS: '/api/v0/search/products',
  RECENT_SEARCHES: '/api/v0/search/recent',
  POPULAR_SEARCHES: '/api/v0/search/popular',
  REMOVE_RECENT_SEARCH: '/api/v0/search/recent',
  CLEAR_RECENT_SEARCHES: '/api/v0/search/recent/all',

  // Stories endpoints
  FETCH_STORIES: '/api/v0/stories',
  MARK_STORY_VIEWED: '/api/v0/story/viewed',
  FETCH_VIEWED_STORIES: '/api/v0/story/viewed',

  // Product Rating endpoints
  GET_RATING_STATS: '/api/v0/rating-review/rating/stats',
  GET_REVIEWS: '/api/v0/rating-review/rating/reviews',
  GET_USER_REVIEW: '/api/v0/rating-review/rating/user',
  CREATE_REVIEW: '/api/v0/rating-review/rating',
  UPDATE_REVIEW: '/api/v0/rating-review/rating',
  DELETE_REVIEW: '/api/v0/rating-review/rating',

  // Location endpoints
  POST_LOCATION_ADDRESS: '/api/v0/user/address/location',
  POST_GPS_TRACKING_ENABLED: '/api/v0/user/address/gps-tracking',
  GET_FULL_LOCATION: '/api/v0/user/address/get-location',

  // ================================
  // RIDE ENDPOINTS (NEW)KW
  // ================================
  RIDE_OPTIONS: '/api/v0/ride/options',
  RIDE_BOOK: '/api/v0/ride/book',
  RIDE_SEARCH_STATUS: '/api/v0/ride/search-status',
  RIDE_RETRY: '/api/v0/ride/retry',
  RIDE_CANCEL: '/api/v0/ride/cancel',
  RIDE_BOOKING: '/api/v0/ride/booking',
  RIDE_CUSTOMER_BOOKINGS: '/api/v0/ride/bookings/customer',
  RIDE_DRIVER_BOOKINGS: '/api/v0/ride/bookings/driver',
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
