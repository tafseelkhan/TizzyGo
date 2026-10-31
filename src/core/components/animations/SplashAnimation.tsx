// TizzyGo.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../contexts/theme/ThemeContext';
import {
  createScaleAnimation,
  createEntryAnimations,
} from '../../utils/animations/animationUtils';

// ✅ Splash auth — direct API + token check
import { me } from '../../../api/features/public/authPublicSlice';
import { getToken } from '../../../api/connections/token/tokenSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type RootStackParamList = {
  CustomerShop: undefined;
  Login: undefined;
  Signup: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function TizzyGo() {
  const { isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [isPressed, setIsPressed] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const lottieAnim = useRef(new Animated.Value(0)).current;

  // Colors based on theme
  const backgroundColor = isDark ? '#0F172A' : '#FFFFFF';
  const primaryColor = isDark ? '#34D399' : '#10B981';
  const subtitleColor = isDark ? '#94A3B8' : '#6b7280';

  const handleTap = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
  };

  // Start animations on mount
  useEffect(() => {
    createEntryAnimations(fadeAnim, logoScaleAnim, lottieAnim).start();
  }, []);

  // Handle press animation
  useEffect(() => {
    createScaleAnimation(scaleAnim, isPressed);
  }, [isPressed]);

  // ============================================================
  // AUTH CHECK & NAVIGATION — direct Connect API calls
  // ============================================================
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(minTimer);
  }, []);

  useEffect(() => {
    if (!minTimeElapsed) return;

    let cancelled = false;

    const checkAndNavigate = async () => {
      try {
        // Step 1: do we even have an access token?
        const accessToken = await getToken();

        if (cancelled) return;

        if (!accessToken) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Signup' }],
          });
          return;
        }

        // Step 2: validate session with `me()`
        // If the access token is expired, apiClient auto-refreshes
        // using the stored session token. If refresh fails,
        // apiClient clears tokens and throws.
        const response = await me();

        if (cancelled) return;

        if (response?.success && response?.user) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CustomerShop' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch {
        // Network error, expired refresh token, etc.
        // apiClient already cleared tokens on refresh failure.
        if (!cancelled) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    };

    checkAndNavigate();

    return () => {
      cancelled = true;
    };
  }, [minTimeElapsed, navigation]);

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={[styles.container, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/tizzy-logo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.Text
            style={[
              styles.tizzygotagline,
              {
                color: isPressed ? primaryColor : subtitleColor,
                transform: [{ scale: isPressed ? 1.02 : 1 }],
              },
            ]}
          >
            TizzyGo
          </Animated.Text>

          <Animated.View
            style={[styles.lottieContainer, { opacity: lottieAnim }]}
          >
            <LottieView
              source={require('../../../assets/lotties/Welcome.json')}
              autoPlay
              loop
              style={styles.lottie}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.Text
            style={[
              styles.tagline,
              {
                color: isPressed ? primaryColor : subtitleColor,
                transform: [{ scale: isPressed ? 1.02 : 1 }],
              },
            ]}
          >
            Tap anywhere
          </Animated.Text>

          <Animated.Text
            style={[
              styles.footerText,
              { color: subtitleColor, opacity: fadeAnim },
            ]}
          >
            Built with Quton ❤️
          </Animated.Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 160,
    height: 160,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: '100%', height: '100%' },
  lottieContainer: {
    width: 200,
    height: 100,
    marginTop: 10,
    marginBottom: 20,
  },
  lottie: { width: '100%', height: '100%' },
  tizzygotagline: {
    fontSize: 30,
    fontFamily: 'Poppins-Light',
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '300',
    textAlign: 'center',
    position: 'absolute',
    bottom: 40,
  },
});