// utils/storiesUtils.ts
import { Dimensions } from 'react-native';

export const { width: screenWidth, height: screenHeight } =
  Dimensions.get('window');

export type TimeoutId = ReturnType<typeof setTimeout>;

export interface Story {
  id: string;
  video?: string;
  productId: string;
  title: string;
  price: number;
  description: string;
  duration?: number;
  isViewed?: boolean;
  category: string;
  _id: string;
  createdAt: Date;
}

export const getProgressIncrement = (duration: number): number => {
  return 100 / (duration / 100);
};

export const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString()}`;
};

export const getStoryDisplayDate = (): string => {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};
