export type Product = {
  _id: string;
  title: string;
  price: number;
  originalPrice?: number;
  FinalPrice?: number;
  Discount?: number;
  averageRating: number;
  reviewCount: number;
  Offer?: number;
  description: string;
  images: string[];
  videos?: string[];
  brand: string;
  seller: {
    name: string;
    id: string;
  };
  likes: string[];
  category: string;
  comments: Comment[];
  views: number;
  rating: number;
};

export type Comment = {
  _id: string;
  text: string;
  user: {
    name: string;
    id: string;
  };
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  iconName: string;
};

export type Banner = {
  id: string;
  image: string;
  link: string;
};

export interface RatingStats {
  totalRatings: number;
  averageRating: string;
  percentage: string;
  distribution: number[];
  totalReviews: number;
}

export interface User {
  _id: string;
  name?: string;
  image?: string;
}

export interface LikeDislikeStatus {
  likes: number;
  dislikes: number;
  userAction: 'like' | 'dislike' | null;
  userLiked?: boolean;
  userDisliked?: boolean;
}

export interface RawReview {
  _id: string;
  userId: string;
  rating: number;
  review: string;
  images: { url: string; publicId: string }[];
  createdAt: string;
}

export interface Review {
  _id: string;
  userId: User;
  rating: number;
  review: string;
  images: { url: string; publicId: string }[];
  createdAt: string;
  likeDislike?: LikeDislikeStatus;
  updatedAt: string; // Make sure this is included
}

export interface UserRating {
  _id?: string;
  rating: number;
  review: string;
  images: { url: string; publicId: string }[];
}

export interface JwtPayload {
  _id: string;
}

export interface OrderProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  finalPrice?: number;
  offer?: number;
  discount?: number;
  category: string;
  location: { country: string; state: string; city: string; lat?: number; lng?: number };
  shippingPrice?: number;
  gst?: number;
  CashOnDelivery?: string;
  Delivery?: string;
}

export interface Order {
  orderId: string;
  product: Product;
  quantity: number;
  coupon?: { code: string; discountAmount: number };
  breakdown: {
    productPrice: number;
    offer: number;
    discount: number;
    couponDiscount: number;
    gst: number;
    packaging: number;
    shipping: number;
    platformFee: number;
    total: number;
  };
  sellerLocation: { country: string; state: string; city: string };
  status: 'pending' | 'paid';
  qrVersion: number;
  expiresAt: string;
  payment: {
    gateway: string;
    paymentStatus: string;
    razorpayOrderId: string;
    paymentLink: string;
    paymentLinkId: string;
  };
}

export interface BuyNowResponse {
  orderId: string;
  order: Order;
  paymentUrl: string;
  qrDataUrl: string;
  expiresAt: string;
}

export interface RefreshQRResponse {
  paymentUrl: string;
  qrDataUrl: string;
  expiresAt: string;
}