// utils/searchUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export const getUserIdFromToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return null;

    const decoded: any = jwtDecode(token);
    return decoded.userId || decoded.id || decoded.sub || null;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

export const placeholderWords = [
  'phone',
  'laptop',
  'watch',
  'shoes',
  'bag',
  'dress',
  'shirt',
  'jeans',
  'jacket',
  'sunglass',
  'perfume',
  'ring',
  'necklace',
  'tv',
  'speaker',
  'headphone',
  'camera',
  'drone',
  'toy',
  'book',
  'pen',
  'gift',
  'furniture',
  'lamp',
  'mattress',
  'pillow',
  'curtain',
  'carpet',
  'sports',
  'fitness',
  'bike',
  'car',
  'helmet',
];

export const getNextWordIndex = (
  currentIndex: number,
  totalWords: number,
): number => {
  return (currentIndex + 1) % totalWords;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
