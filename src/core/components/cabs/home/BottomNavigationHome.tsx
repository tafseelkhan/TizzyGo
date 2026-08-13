import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { profileService } from '../../../services/profile/profileService';

const { width } = Dimensions.get('window');

// Haptic options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// Speed Dial Actions with Navigation
const DEFAULT_ACTIONS = [
  {
    id: 1,
    icon: 'storefront' as const,
    label: 'Shop',
    action: (navigation: any) => {
      console.log('🔍 Navigating to Shop');
      if (navigation) {
        navigation.navigate('CustomerShop');
      }
    },
  },
  {
    id: 2,
    icon: 'two-wheeler' as const,
    label: 'Cab',
    action: (navigation: any) => {
      console.log('🔍 Navigating to Cab');
      if (navigation) {
        navigation.navigate('CustomerCab');
      }
    },
  },
  {
    id: 3,
    icon: 'directions-car' as const,
    label: 'Rent',
    action: (navigation: any) => {
      console.log('🔍 Navigating to Rent');
      if (navigation) {
        // Try parent navigation first
        const parent = navigation.getParent?.();
        if (parent) {
          parent.navigate('BottomNavigator', { screen: 'Rentes' });
        } else {
          navigation.navigate('Rentes');
        }
      }
    },
  },
  {
    id: 4,
    icon: 'local-shipping' as const,
    label: 'Ship',
    action: (navigation: any) => {
      console.log('🔍 Navigating to Ship');
      if (navigation) {
        // Try parent navigation first
        const parent = navigation.getParent?.();
        if (parent) {
          parent.navigate('BottomNavigator', { screen: 'Shippings' });
        } else {
          navigation.navigate('Shippings');
        }
      }
    },
  },
];

interface BottomNavigationProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
  onSearchPress?: () => void;
  onProfilePress?: () => void;
  onChatPress?: () => void;
  onHomePress?: () => void;
  navigation?: any;
  actions?: typeof DEFAULT_ACTIONS;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = 'home',
  onTabPress,
  onSearchPress,
  onProfilePress,
  onChatPress,
  onHomePress,
  navigation,
  actions = DEFAULT_ACTIONS,
}) => {
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const animationRef = useRef<LottieView>(null);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Fetch profile image
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await profileService.fetchProfile();
        if (result.success && result.data) {
          if (result.data.image && result.data.image !== '') {
            setProfileImage(result.data.image);
            setImageError(false);
          } else {
            setProfileImage(null);
          }
        }
      } catch (error) {
        console.log('Error fetching profile:', error);
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

  const triggerSuccessHaptic = () => {
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
  };

  // Toggle Speed Dial
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

  const handleSpeedDialAction = (action: (nav: any) => void) => {
    triggerSuccessHaptic();
    action(navigation);
    toggleSpeedDial();
  };

  const renderProfileIcon = () => {
    if (profileImage && profileImage !== '' && !imageError) {
      return (
        <Image
          source={{ uri: profileImage }}
          style={styles.profileImageSmall}
          resizeMode="cover"
          onError={() => {
            console.log('❌ Image load error:', profileImage);
            setImageError(true);
          }}
        />
      );
    }

    return (
      <View style={styles.lottieContainerSmall}>
        <LottieView
          ref={animationRef}
          source={require('../../../components/animations/lotties/Login icon (1).json')}
          style={styles.lottieAnimationSmall}
          autoPlay={true}
          loop={true}
          resizeMode="cover"
        />
      </View>
    );
  };

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNavBar}>
        {/* Home Button */}
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
          onPress={() => {
            triggerLightHaptic();
            if (onTabPress) onTabPress('home');
            if (onHomePress) onHomePress();
            if (navigation) {
              navigation.navigate('CustomerCab');
            }
          }}
        >
          <Octicons name="home" size={24} color="#000" />
        </TouchableOpacity>

        {/* Chat Button */}
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'chat' && styles.navItemActive]}
          onPress={() => {
            triggerLightHaptic();
            if (onTabPress) onTabPress('chat');
            if (onChatPress) onChatPress();
            if (navigation) {
              console.log('🔍 Navigating to Chat');
              navigation.navigate('Chat');
            }
          }}
        >
          <Image
            source={require('../../../../assets/images/nex-logo.png')}
            style={styles.navIconImage}
          />
        </TouchableOpacity>

        {/* CENTER PLUS BUTTON */}
        <View style={styles.fabContainer}>
          {/* Speed Dial Actions */}
          <Animated.View
            style={[
              styles.speedDial,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {actions.map(action => (
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
                  style={[styles.speedDialButton, styles.speedDialSolidStyle]}
                  onPress={() => handleSpeedDialAction(action.action)}
                >
                  <MaterialIcon name={action.icon} size={24} color="#000" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Plus Button */}
          <TouchableOpacity
            style={[
              styles.fabButton,
              speedDialOpen ? styles.fabButtonOpen : styles.fabButtonClosed,
            ]}
            onPress={toggleSpeedDial}
          >
            <Ionicons
              name={speedDialOpen ? 'close' : 'add'}
              size={32}
              color="#000"
            />
          </TouchableOpacity>
        </View>

        {/* Profile Button */}
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'profile' && styles.navItemActive,
          ]}
          onPress={() => {
            triggerMediumHaptic();
            if (onTabPress) onTabPress('profile');
            if (onProfilePress) onProfilePress();
            if (navigation) {
              console.log('🔍 Navigating to Profile');
              navigation.navigate('Profile');
            }
          }}
        >
          {renderProfileIcon()}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavBar: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    width: width * 0.85,
    height: 65,
    borderRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  navItem: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: '#2ECC71',
  },
  navIconImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    resizeMode: 'cover',
  },
  fabContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  fabButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  fabButtonClosed: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fabButtonOpen: {
    backgroundColor: '#2ECC71',
    borderWidth: 0,
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
    right: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedDialSolidStyle: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileImageSmall: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  lottieContainerSmall: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  lottieAnimationSmall: {
    width: 50,
    height: 50,
  },
});

export default BottomNavigation;
