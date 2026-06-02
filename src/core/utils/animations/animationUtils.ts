// utiles/animationUtils.ts
import { Animated, Easing } from 'react-native';

export const createScaleAnimation = (
  scaleAnim: Animated.Value,
  isPressed: boolean,
) => {
  Animated.spring(scaleAnim, {
    toValue: isPressed ? 0.98 : 1,
    friction: 3,
    tension: 40,
    useNativeDriver: true,
  }).start();
};

export const createEntryAnimations = (
  fadeAnim: Animated.Value,
  logoScaleAnim: Animated.Value,
  lottieAnim: Animated.Value,
) => {
  return Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }),
    Animated.spring(logoScaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }),
    Animated.timing(lottieAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }),
  ]);
};
