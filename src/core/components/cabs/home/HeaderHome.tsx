import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import LottieView from 'lottie-react-native';
import { profileService } from '../../../services/profile/profileService';

interface HeaderProps {
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  onNotificationPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onSearchPress,
  onFilterPress,
  onNotificationPress,
}) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const animationRef = useRef<LottieView>(null);

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

  const renderProfileIcon = () => {
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

    return (
      <View style={styles.lottieContainer}>
        <LottieView
          ref={animationRef}
          source={require('../../../components/animations/lotties/Login icon (1).json')}
          style={styles.lottieAnimation}
          autoPlay={true}
          loop={true}
          resizeMode="cover"
        />
      </View>
    );
  };

  return (
    <View style={styles.whiteHeaderPanel}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.leftHeaderComponent}>{renderProfileIcon()}</View>

        <View style={styles.centerHeaderComponent}>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color="#2ECC71"
            />
            <Text style={styles.locationText}>San Francisco</Text>
          </View>
        </View>

        <View style={styles.rightHeaderComponent}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={onNotificationPress}
          >
            <Ionicons name="notifications-outline" size={20} color="#000" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Text */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Hello Martin!</Text>
        <Text style={styles.welcomeSubtitle}>
          Start your timeless adventure today.
        </Text>
      </View>

      {/* Search Bar Section */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={styles.searchFieldContainer}
          onPress={onSearchPress}
        >
          <Feather
            name="search"
            size={22}
            color="#A3A3A3"
            style={styles.searchIcon}
          />
          <View>
            <Text style={styles.searchTitle}>Which classic?</Text>
            <Text style={styles.searchPlaceholder}>
              Anything • Anyweek • Anytime • Anywhere • Always
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
          <FontAwesome6 name="sliders" size={15} color="#A3A3A3" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  whiteHeaderPanel: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  leftHeaderComponent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerHeaderComponent: {
    flex: 2,
    alignItems: 'center',
  },
  rightHeaderComponent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Poppins-LightItalic',
    color: '#000',
    marginLeft: 6,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  welcomeContainer: {
    marginTop: 25,
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  searchFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  searchPlaceholder: {
    fontSize: 8,
    fontFamily: 'Poppins-LightItalic',
    color: '#A3A3A3',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lottieContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  lottieAnimation: {
    width: 50,
    height: 50,
  },
});

export default Header;
