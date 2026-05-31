// components/BottomNavigation.tsx - WITH PROFILE API INTEGRATION

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// ✅ Import profile API
import { profileApi } from '../../../api/features/private/profilePrivateSlice';

// Type definitions for props
interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Define navigation param types
type RootStackParamList = {
  BottomNavigator: { screen: string };
  Home: undefined;
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
  const [profileLoading, setProfileLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const screenWidth = Dimensions.get('window').width;

  // Safe area insets for proper spacing
  const insets = useSafeAreaInsets();

  // ✅ Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // ✅ Fetch profile function using your existing profileApi
  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await profileApi.getProfile();

      if (response && response.data) {
        const userData = response.data;

        // Set profile image from Firebase URL
        // The image field contains the Firebase Storage URL
        if (userData.image) {
          setProfileImage(userData.image);
        } else if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        } else if (userData.avatar) {
          setProfileImage(userData.avatar);
        }

        // Set user name
        if (userData.name) {
          setUserName(userData.name);
        } else if (userData.fullName) {
          setUserName(userData.fullName);
        } else if (userData.displayName) {
          setUserName(userData.displayName);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

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
        navigation
          .getParent()
          ?.navigate('BottomNavigator', { screen: 'Seller' });
      },
    },
    {
      id: 2,
      icon: 'two-wheeler' as const,
      action: () => {
        triggerLightHaptic();
        navigation
          .getParent()
          ?.navigate('BottomNavigator', { screen: 'BookCab' });
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

  // ✅ Render profile icon with real image
  const renderProfileIcon = () => {
    if (profileLoading) {
      return (
        <View style={styles.profileLoadingContainer}>
          <ActivityIndicator
            size="small"
            color={isDark ? '#7DD3FC' : '#0f766e'}
          />
        </View>
      );
    }

    if (profileImage) {
      return (
        <Image
          source={{ uri: profileImage }}
          style={styles.profileImage}
          resizeMode="cover"
        />
      );
    }

    // Fallback icon if no image
    return (
      <Icon
        name="person"
        size={20}
        color={
          activeTab === 'profile'
            ? isDark
              ? '#A78BFA'
              : '#7c3aed'
            : themeColors.text
        }
      />
    );
  };

  // ✅ Render user avatar or default icon with notification badge
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
          {/* Optional: Add notification badge */}
          {userName && !profileLoading && <View style={styles.profileBadge} />}
        </View>
        {/* Optional: Show user name initial if needed */}
        {userName && !profileLoading && (
          <Text
            style={[
              styles.navText,
              { color: themeColors.text },
              isActive && [
                styles.activeNavText,
                { color: isDark ? '#A78BFA' : '#7c3aed' },
              ],
            ]}
            numberOfLines={1}
          >
            {userName.length > 8 ? userName.substring(0, 6) + '..' : userName}
          </Text>
        )}
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
            navigation.navigate('Home');
          }}
        >
          <View style={styles.navIconContainer}>
            <Image
              source={require('../../../assets/images/tizzy-logo.jpg')}
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
              source={require('../../../assets/images/nex-logo.png')}
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
            size={20}
            color={
              activeTab === 'ads'
                ? isDark
                  ? '#F59E0B'
                  : '#ea580c'
                : themeColors.text
            }
          />
        </TouchableOpacity>

        {/* ✅ Profile Button with Real Image */}
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
  // ✅ New styles for profile image
  profileIconContainer: {
    position: 'relative',
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  profileLoadingContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#ffffff',
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
