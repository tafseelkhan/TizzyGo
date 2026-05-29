// utiles/loginAnimations.ts
import { Animated } from 'react-native';

export const setupKeyboardAnimations = (
  setIsKeyboardVisible: (visible: boolean) => void,
  lottieOpacity: Animated.Value,
) => {
  return {
    onKeyboardShow: () => {
      setIsKeyboardVisible(true);
      Animated.timing(lottieOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    onKeyboardHide: () => {
      setIsKeyboardVisible(false);
      Animated.timing(lottieOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
  };
};

export const startLoginAnimations = (
  headerOpacity: Animated.Value,
  headerTranslateY: Animated.Value,
  formOpacity: Animated.Value,
  formScale: Animated.Value,
  identifierInputOpacity: Animated.Value,
  identifierInputTranslateX: Animated.Value,
  buttonOpacity: Animated.Value,
  buttonTranslateY: Animated.Value,
) => {
  // Header animation
  Animated.parallel([
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }),
    Animated.timing(headerTranslateY, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }),
  ]).start();

  // Form animation
  setTimeout(() => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(formScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, 200);

  // Input animations
  setTimeout(() => {
    Animated.parallel([
      Animated.timing(identifierInputOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(identifierInputTranslateX, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, 400);

  // Button animation
  setTimeout(() => {
    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, 600);
};
