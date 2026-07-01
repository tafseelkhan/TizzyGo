// components/BottomNavigation.tsx - WITH LOTTIE ANIMATION (Solid White Background)

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import { useTheme } from '../contexts/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// ✅ Import profile SERVICE
import { profileService } from '../services/profile/profileService';

// Type definitions for props
interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Define navigation param types
type RootStackParamList = {
  BottomNavigator: { screen: string };
  CustomerShop: undefined;
  Seller: undefined;
  BookCab: undefined;
  Rentes: undefined;
  Shippings: undefined;
  Chat: undefined;
  MyAds: undefined;
  Profile: undefined;
  [key: string]: any;
};

// Haptic options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const BottomNavigation = ({
  activeTab,
  setActiveTab,
}: BottomNavigationProps) => {
  const { isDark, resolvedTheme } = useTheme();
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const animationRef = useRef<LottieView>(null);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const screenWidth = Dimensions.get('window').width;

  // Safe area insets for proper spacing
  const insets = useSafeAreaInsets();

  // ✅ Fetch profile function
  useEffect(() => {
    const fetchProfile = async () => {
      const result = await profileService.fetchProfile();

      if (result.success && result.data) {
        if (result.data.image && result.data.image !== '') {
          setProfileImage(result.data.image);
          setImageError(false);
        } else {
          setProfileImage(null);
        }
      }
    };

    fetchProfile();
  }, []);

  // Haptic feedback functions
  const triggerLightHaptic = () => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  };

  const triggerMediumHaptic = () => {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  };

  const triggerHeavyHaptic = () => {
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
  };

  const triggerSuccessHaptic = () => {
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
  };

  // Dynamic colors based on theme
  const themeColors = {
    background: isDark ? '#1E293B' : '#ffffff',
    text: isDark ? '#F1F5F9' : '#6b7280',
    activeText: isDark ? '#7DD3FC' : '#0f766e',
    activeBg: isDark ? '#334155' : '#f0fdf4',
    border: isDark ? '#334155' : '#e5e7eb',
    shadow: isDark ? '#000' : '#000',
    fabBg: isDark ? 'rgba(15, 23, 42, 1)' : 'rgba(241, 245, 249, 1)',
    speedDialBg: isDark ? '#2D3748' : '#ffffff',
    speedDialText: isDark ? '#CBD5E1' : '#374151',
    speedDialShadow: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)',
  };

  const actions = [
    {
      id: 1,
      icon: 'storefront' as const,
      action: () => {
        triggerLightHaptic();
        navigation.navigate('CustomerShop');
      },
    },
    {
      id: 2,
      icon: 'two-wheeler' as const,
      action: () => {
        triggerLightHaptic();
        navigation.navigate('CustomerCab');
      },
    },
    {
      id: 3,
      icon: 'directions-car' as const,
      action: () => {
        triggerLightHaptic();
        navigation
          .getParent()
          ?.navigate('BottomNavigator', { screen: 'Rentes' });
      },
    },
    {
      id: 4,
      icon: 'local-shipping' as const,
      action: () => {
        triggerLightHaptic();
        navigation
          .getParent()
          ?.navigate('BottomNavigator', { screen: 'Shippings' });
      },
    },
  ];

  const toggleSpeedDial = () => {
    if (speedDialOpen) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      triggerLightHaptic();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      triggerMediumHaptic();
    }
    setSpeedDialOpen(!speedDialOpen);
  };

  const handleSpeedDialAction = (action: () => void) => {
    triggerSuccessHaptic();
    action();
    toggleSpeedDial();
  };

  // Solid white background style
  const solidStyle = {
    backgroundColor: themeColors.background,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: themeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  };

  const coloredSolidStyle = {
    backgroundColor: themeColors.fabBg,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: themeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  };

  const speedDialSolidStyle = {
    backgroundColor: themeColors.speedDialBg,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: themeColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  };

  // ✅ Render profile with Lottie animation (SettingsScreen jaisa)
  const renderProfileIcon = () => {
    // Agar image hai to dikhao
    if (profileImage && profileImage !== '' && !imageError) {
      return (
        <Image
          source={{ uri: profileImage }}
          style={styles.profileImage}
          resizeMode="cover"
          onError={() => {
            console.log('❌ Image load error:', profileImage);
            setImageError(true);
          }}
        />
      );
    }

    // ✅ Fallback - Lottie animation (SettingsScreen jaisa)
    return (
      <View style={styles.lottieContainer}>
        <LottieView
          ref={animationRef}
          source={require('../components/animations/lotties/Login icon (1).json')}
          style={styles.lottieAnimation}
          autoPlay={true}
          loop={true}
          resizeMode="cover"
        />
      </View>
    );
  };

  // ✅ Render profile button
  const renderProfileButton = () => {
    const isActive = activeTab === 'profile';

    return (
      <TouchableOpacity
        style={[
          styles.navButton,
          isActive && [
            styles.activeNavButton,
            { backgroundColor: themeColors.activeBg },
          ],
        ]}
        onPress={() => {
          triggerMediumHaptic();
          setActiveTab('profile');
          navigation.navigate('Profile');
        }}
      >
        <View style={styles.profileIconContainer}>
          {renderProfileIcon()}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.bottomNav,
        solidStyle,
        {
          bottom: Math.max(insets.bottom, 16),
          left: Math.max(insets.left, 16),
          right: Math.max(insets.right, 16),
        },
      ]}
    >
      <View style={styles.navContent}>
        {/* Home Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'home' && [
              styles.activeNavButton,
              { backgroundColor: themeColors.activeBg },
            ],
          ]}
          onPress={() => {
            triggerLightHaptic();
            setActiveTab('home');
            navigation.navigate('CustomerShop');
          }}
        >
          <View style={styles.navIconContainer}>
            <Image
              source={require('../../assets/images/tizzy-logo.jpg')}
              style={styles.navIconImage}
            />
          </View>
        </TouchableOpacity>

        {/* Chat Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'chat' && [
              styles.activeNavButton,
              { backgroundColor: themeColors.activeBg },
            ],
          ]}
          onPress={() => {
            triggerLightHaptic();
            setActiveTab('chat');
            navigation.navigate('Chat');
          }}
        >
          <View style={styles.navIconContainer}>
            <Image
              source={require('../../assets/images/nex-logo.png')}
              style={styles.navIconImage}
            />
          </View>
        </TouchableOpacity>

        {/* Center Floating Action Button */}
        <View style={styles.fabContainer}>
          <Animated.View
            style={[
              styles.speedDial,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {actions.map((action, index) => (
              <Animated.View
                key={action.id}
                style={[
                  styles.speedDialAction,
                  {
                    transform: [
                      {
                        translateY: opacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.speedDialButton, speedDialSolidStyle]}
                  onPress={() => handleSpeedDialAction(action.action)}
                >
                  <MaterialIcon
                    name={action.icon}
                    size={24}
                    color={isDark ? '#0d9488' : '#0f766e'}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>

          <TouchableOpacity
            style={[styles.fab, coloredSolidStyle]}
            onPress={toggleSpeedDial}
          >
            <Icon
              name={speedDialOpen ? 'close' : 'add'}
              size={28}
              color={isDark ? '#0d9488' : '#0f766e'}
            />
          </TouchableOpacity>
        </View>

        {/* My Ads Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            activeTab === 'ads' && [
              styles.activeNavButton,
              { backgroundColor: themeColors.activeBg },
            ],
          ]}
          onPress={() => {
            triggerLightHaptic();
            setActiveTab('ads');
            navigation.navigate('MyAds');
          }}
        >
          <Icon
            name="notifications"
            size={22}
            color={
              activeTab === 'ads'
                ? isDark
                  ? '#F59E0B'
                  : '#ea580c'
                : themeColors.text
            }
          />
        </TouchableOpacity>

        {/* ✅ Profile Button with Lottie Animation */}
        {renderProfileButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    borderRadius: 24,
    paddingVertical: 8,
    zIndex: 1000,
    elevation: 50,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 48,
    borderRadius: 16,
    gap: 4,
  },
  activeNavButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ scale: 1.1 }],
  },
  navIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  navIconImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // ✅ Profile image styles with Lottie
  profileIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  lottieContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 40,
    height: 40,
  },
  navText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  activeNavText: {
    fontWeight: '700',
  },
  fabContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: -30,
    zIndex: 1001,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
  },
  speedDial: {
    position: 'absolute',
    bottom: 70,
    flexDirection: 'row',
    gap: 12,
    zIndex: 999,
    paddingHorizontal: 8,
  },
  speedDialAction: {
    alignItems: 'center',
  },
  speedDialButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
});

export default BottomNavigation;