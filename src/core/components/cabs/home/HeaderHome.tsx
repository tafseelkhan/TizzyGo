// HeaderFWS.tsx - WITH SHINE ANIMATION & COLOR ROTATION
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
  SafeAreaView,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { profileService } from '../../../services/profile/profileService';
import { locationApi } from '../../../../api/features/private/locationPrivateSlice';
import {
  googlePlacesService,
  PlaceSuggestion,
} from '../../../services/buyers/home/googlePlacesService';
import { getCurrentGpsLocation } from '../../../utils/home/permissions';
import {
  formatCoordinates,
  parseGeoJsonCoordinates,
  hasLocationChangedSignificantly,
} from '../../../utils/home/locationUtils';

interface HeaderProps {
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  onNotificationPress?: () => void;
  userName?: string;
  userImage?: string | null;
  onLocationUpdate?: (location: string) => void;
}

const { height, width } = Dimensions.get('window');

const TYPING_TEXTS = [
  'Start your timeless adventure today.',
  'Explore the world with FWS.',
  'Book your ride in seconds.',
  'Safe • Reliable • Comfortable.',
  'Your journey begins here.',
];

const SUBTITLE_TEXTS = [
  'Anything • Anyweek • Anytime • Anywhere • Always',
  'Fast • Easy • Affordable • Reliable',
  'Book Now • Pay Later • Ride Safe',
  'Your comfort is our priority',
];

// Color combinations for text
const COLOR_COMBOS = [
  { main: '#000000', subtitle: '#2ECC71' }, // uper black, niche green
  { main: '#2ECC71', subtitle: '#000000' }, // uper green, niche black
  { main: '#000000', subtitle: '#2ECC71' }, // uper black, niche green
  { main: '#2ECC71', subtitle: '#000000' }, // uper green, niche black
];

const Header: React.FC<HeaderProps> = ({
  onSearchPress,
  onFilterPress,
  onNotificationPress,
  userName = 'Martin',
  userImage: propUserImage,
  onLocationUpdate,
}) => {
  // -------- States --------
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const animationRef = useRef<LottieView>(null);

  // Location States
  const [location, setLocation] = useState<string>('Select your location');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<
    PlaceSuggestion[]
  >([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [isGpsTrackingEnabled, setIsGpsTrackingEnabled] = useState(false);
  const [isGettingGpsLocation, setIsGettingGpsLocation] = useState(false);
  const [updatingGpsStatus, setUpdatingGpsStatus] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Text States - Direct change without animation
  const [displayText, setDisplayText] = useState(TYPING_TEXTS[0]);
  const [displaySubtitle, setDisplaySubtitle] = useState(SUBTITLE_TEXTS[0]);
  const [textIndex, setTextIndex] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [currentColors, setCurrentColors] = useState(COLOR_COMBOS[0]);

  // Shine Animation
  const shineAnim = useRef(new Animated.Value(-width)).current;

  const isMounted = useRef(true);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // -------- Effects --------
  useEffect(() => {
    isMounted.current = true;
    fetchProfile();
    loadUserLocation();
    startShineAnimation();

    // Main text rotation - 2 seconds
    const textInterval = setInterval(() => {
      if (isMounted.current) {
        const nextIndex = (textIndex + 1) % TYPING_TEXTS.length;
        setTextIndex(nextIndex);
        setDisplayText(TYPING_TEXTS[nextIndex]);
      }
    }, 2000);

    // Subtitle rotation - 2 seconds
    const subtitleInterval = setInterval(() => {
      if (isMounted.current) {
        const nextIndex = (subtitleIndex + 1) % SUBTITLE_TEXTS.length;
        setSubtitleIndex(nextIndex);
        setDisplaySubtitle(SUBTITLE_TEXTS[nextIndex]);
      }
    }, 2000);

    // Color rotation - every 2 seconds (same as text change)
    const colorInterval = setInterval(() => {
      if (isMounted.current) {
        const nextColorIndex = (colorIndex + 1) % COLOR_COMBOS.length;
        setColorIndex(nextColorIndex);
        setCurrentColors(COLOR_COMBOS[nextColorIndex]);
      }
    }, 2000);

    return () => {
      isMounted.current = false;
      clearInterval(textInterval);
      clearInterval(subtitleInterval);
      clearInterval(colorInterval);
      stopGpsTracking();
    };
  }, []);

  useEffect(() => {
    if (propUserImage) {
      setProfileImage(propUserImage);
    }
  }, [propUserImage]);

  useEffect(() => {
    if (isGpsTrackingEnabled) {
      startGpsTracking();
    } else {
      stopGpsTracking();
    }
    return () => stopGpsTracking();
  }, [isGpsTrackingEnabled]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Debounce location search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchLocationQuery) {
        searchPlaces(searchLocationQuery);
      } else {
        setLocationSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchLocationQuery]);

  // -------- Shine Animation --------
  const startShineAnimation = () => {
    shineAnim.setValue(-width);
    Animated.timing(shineAnim, {
      toValue: width,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      // Repeat after 2 seconds
      setTimeout(() => startShineAnimation(), 2000);
    });
  };

  // -------- Functions --------
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
      console.log('Profile fetch error:', error);
    }
  };

  const loadUserLocation = async () => {
    try {
      const result = await locationApi.getLocation();
      if (result.success && result.data) {
        if (result.data.gpsTrackingEnabled !== undefined) {
          setIsGpsTrackingEnabled(result.data.gpsTrackingEnabled);
        }
        if (result.data.location?.coordinates) {
          const coords = result.data.location.coordinates;
          if (coords && coords.length >= 2) {
            setCurrentCoordinates({ lat: coords[0], lng: coords[1] });
            if (result.data.location.address) {
              setLocation(result.data.location.address);
              if (onLocationUpdate)
                onLocationUpdate(result.data.location.address);
            } else {
              const formatted = `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
              setLocation(formatted);
              if (onLocationUpdate) onLocationUpdate(formatted);
            }
          }
        }
      }
    } catch (error) {
      console.log('Error loading location:', error);
    }
  };

  const searchPlaces = async (query: string) => {
    setLoadingLocations(true);
    try {
      const suggestions = await googlePlacesService.searchPlaces(query);
      setLocationSuggestions(suggestions || []);
    } catch (error) {
      console.log('Search error:', error);
      setLocationSuggestions([]);
    }
    setLoadingLocations(false);
  };

  const saveSelectedLocation = async (selectedLocation: PlaceSuggestion) => {
    if (!selectedLocation?.place_id) {
      Alert.alert('Error', 'Invalid location selected. Please try again.');
      return;
    }

    setSavingLocation(true);
    try {
      const details = await googlePlacesService.getPlaceDetails(
        selectedLocation.place_id,
      );

      if (!details) {
        Alert.alert(
          'Error',
          'Could not fetch location details. Please try again.',
        );
        setSavingLocation(false);
        return;
      }

      const locationData = {
        lat: details.lat || 0,
        lng: details.lng || 0,
        address: details.address || selectedLocation.description || 'Unknown',
        city: details.city || 'Unknown',
        state: details.state || 'Unknown',
        country: details.country || 'India',
        pinCode: details.pinCode || '000000',
        placeId: selectedLocation.place_id || '',
      };

      if (locationData.lat === 0 && locationData.lng === 0) {
        Alert.alert(
          'Error',
          'Invalid coordinates for this location. Please try another.',
        );
        setSavingLocation(false);
        return;
      }

      const result = await locationApi.saveLocation(
        locationData.lat,
        locationData.lng,
        locationData.address,
        locationData.city,
        locationData.state,
        locationData.country,
        locationData.pinCode,
        locationData.placeId,
      );

      if (result.success) {
        setLocation(locationData.address);
        if (onLocationUpdate) onLocationUpdate(locationData.address);
        setLocationModalVisible(false);
        setSearchLocationQuery('');
        setLocationSuggestions([]);
        Alert.alert('Success', 'Location saved successfully!');
        await loadUserLocation();
      } else {
        Alert.alert(
          'Error',
          result.message || 'Failed to save location. Please try again.',
        );
      }
    } catch (error: any) {
      console.error('Error saving location:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to save location. Please try again.',
      );
    } finally {
      setSavingLocation(false);
    }
  };

  const toggleGpsTracking = async () => {
    const newState = !isGpsTrackingEnabled;
    setUpdatingGpsStatus(true);
    try {
      const result = await locationApi.updateGpsTracking(newState);
      if (result.success) {
        setIsGpsTrackingEnabled(newState);
      } else if (
        result.message?.includes('Please save your delivery location first')
      ) {
        Alert.alert(
          'Location Required',
          'Please set your delivery location first before enabling GPS tracking.',
          [{ text: 'OK', onPress: () => setLocationModalVisible(true) }],
        );
      } else {
        Alert.alert(
          'Error',
          result.message || 'Failed to update GPS tracking preference.',
        );
      }
    } catch (error) {
      console.error('Toggle GPS error:', error);
      Alert.alert('Error', 'Failed to update GPS tracking preference.');
    } finally {
      setUpdatingGpsStatus(false);
    }
  };

  const getCurrentLocationAndUpdate = async () => {
    if (isGettingGpsLocation) return;
    setIsGettingGpsLocation(true);
    try {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      const gpsLocation = await getCurrentGpsLocation();
      if (gpsLocation) {
        setCurrentCoordinates(gpsLocation);
        const addressInfo = await googlePlacesService.reverseGeocode(
          gpsLocation.lat,
          gpsLocation.lng,
        );
        if (addressInfo) {
          setLocation(addressInfo.address);
          if (onLocationUpdate) onLocationUpdate(addressInfo.address);
          const result = await locationApi.saveLocation(
            gpsLocation.lat,
            gpsLocation.lng,
            addressInfo.address,
            addressInfo.city || 'Unknown',
            addressInfo.state || 'Unknown',
            addressInfo.country || 'India',
            addressInfo.pinCode || '000000',
            '',
          );
          if (result.success) {
            Alert.alert(
              'Location Updated',
              `Your location has been set to: ${addressInfo.address}`,
            );
            setLocationModalVisible(false);
            await loadUserLocation();
          } else {
            Alert.alert('Error', result.message || 'Failed to save location');
          }
        } else {
          Alert.alert(
            'Location Error',
            'Unable to get address. Please try searching instead.',
          );
        }
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get current location. Please check your GPS.',
        );
      }
    } catch (error) {
      console.error('Manual location update error:', error);
      Alert.alert('Error', 'Failed to get current location.');
    } finally {
      setIsGettingGpsLocation(false);
      if (isGpsTrackingEnabled) startGpsTracking();
    }
  };

  const startGpsTracking = () => {
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    locationIntervalRef.current = setInterval(async () => {
      if (isGettingGpsLocation) return;
      if (isGpsTrackingEnabled) {
        const gpsLocation = await getCurrentGpsLocation();
        if (gpsLocation) {
          setCurrentCoordinates(gpsLocation);
          const formatted = `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}`;
          setLocation(formatted);
          if (onLocationUpdate) onLocationUpdate(formatted);
        }
      }
    }, 30000);
  };

  const stopGpsTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const renderProfileIcon = () => {
    if (profileImage && profileImage !== '' && !imageError) {
      return (
        <Image
          source={{ uri: profileImage }}
          style={styles.profileImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
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
    <>
      {/* Header Panel */}
      <View style={styles.headerPanel}>
        <View style={styles.headerRow}>
          <View style={styles.leftHeaderComponent}>{renderProfileIcon()}</View>

          <View style={styles.centerHeaderComponent}>
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={() => setLocationModalVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color="#2ECC71"
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={14}
                color="#666"
              />
            </TouchableOpacity>
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

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Hello {userName}! 👋</Text>
          <Text style={[styles.welcomeSubtitle, { color: currentColors.main }]}>
            {displayText}
          </Text>
        </View>

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
              <Text style={[styles.searchPlaceholder, { color: currentColors.subtitle }]}>
                {displaySubtitle}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={onFilterPress}
            activeOpacity={0.8}
          >
            <View style={styles.filterButtonContent}>
              <FontAwesome6 name="sliders" size={15} color="#A3A3A3" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Redesigned Location Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <SafeAreaView style={styles.safeAreaContainer}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <TouchableOpacity
                      onPress={() => {
                        setLocationModalVisible(false);
                        Keyboard.dismiss();
                      }}
                      style={styles.backButton}
                    >
                      <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Set Location</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setLocationModalVisible(false);
                      Keyboard.dismiss();
                    }}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#1A1A1A" />
                  </TouchableOpacity>
                </View>

                {/* Current Location Section */}
                {!keyboardVisible && currentCoordinates && (
                  <View style={styles.currentLocationCard}>
                    <View style={styles.currentLocationHeader}>
                      <View style={styles.locationIconBig}>
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={24}
                          color="#2ECC71"
                        />
                      </View>
                      <View style={styles.currentLocationInfo}>
                        <Text style={styles.currentLocationTitle}>
                          Current Location
                        </Text>
                        <Text style={styles.currentLocationCoords}>
                          {currentCoordinates.lat.toFixed(6)},{' '}
                          {currentCoordinates.lng.toFixed(6)}
                        </Text>
                      </View>
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Update Location Button with Shine Animation */}
                {!keyboardVisible && (
                  <TouchableOpacity
                    style={styles.updateLocationButton}
                    onPress={getCurrentLocationAndUpdate}
                    disabled={isGettingGpsLocation}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#1A1A1A', '#2D2D2D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.updateButtonGradient}
                    >
                      {isGettingGpsLocation ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="crosshairs-gps"
                            size={20}
                            color="white"
                          />
                          <Text style={styles.updateLocationButtonText}>
                            Update Current Location
                          </Text>
                        </>
                      )}
                      {/* Shine Effect Overlay */}
                      <Animated.View
                        style={[
                          styles.shineOverlay,
                          {
                            transform: [{ translateX: shineAnim }],
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={[
                            'transparent',
                            'rgba(255,255,255,0.3)',
                            'transparent',
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.shineGradient}
                        />
                      </Animated.View>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* GPS Tracking Toggle */}
                {!keyboardVisible && (
                  <View style={styles.gpsCard}>
                    <View style={styles.gpsCardHeader}>
                      <View style={styles.gpsIconContainer}>
                        <MaterialCommunityIcons
                          name="gps"
                          size={20}
                          color="#4F46E5"
                        />
                      </View>
                      <Text style={styles.gpsCardTitle}>GPS Tracking</Text>
                    </View>
                    <View style={styles.gpsToggleContainer}>
                      <View style={styles.gpsToggleInfo}>
                        <Text style={styles.gpsToggleText}>
                          Automatic Location Updates
                        </Text>
                        <Text style={styles.gpsToggleSubtext}>
                          Get real-time location updates every 30 seconds
                        </Text>
                      </View>
                      <Switch
                        value={isGpsTrackingEnabled}
                        onValueChange={toggleGpsTracking}
                        disabled={updatingGpsStatus}
                        trackColor={{ false: '#E5E7EB', true: '#2ECC71' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                    {isGpsTrackingEnabled && (
                      <View style={styles.infoBadge}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={14}
                          color="#2ECC71"
                        />
                        <Text style={styles.infoBadgeText}>
                          GPS tracking is active
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Divider */}
                {!keyboardVisible && (
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerCircle}>
                      <Text style={styles.dividerText}>OR</Text>
                    </View>
                    <View style={styles.dividerLine} />
                  </View>
                )}

                {/* Search Section */}
                <View style={styles.searchCard}>
                  <View style={styles.searchCardHeader}>
                    <View style={styles.searchIconContainer}>
                      <Feather name="search" size={18} color="#8B5CF6" />
                    </View>
                    <Text style={styles.searchCardTitle}>Search Address</Text>
                  </View>

                  <View style={styles.searchInputContainer}>
                    <Feather
                      name="search"
                      size={20}
                      color="#A3A3A3"
                      style={styles.searchInputIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search for area, street, or landmark..."
                      placeholderTextColor="#A3A3A3"
                      value={searchLocationQuery}
                      onChangeText={setSearchLocationQuery}
                      returnKeyType="search"
                    />
                    {searchLocationQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchLocationQuery('')}
                        style={styles.clearButton}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#A3A3A3"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Suggestions */}
                {loadingLocations ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2ECC71" />
                    <Text style={styles.loadingText}>
                      Searching locations...
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={locationSuggestions}
                    keyExtractor={item => item.place_id}
                    showsVerticalScrollIndicator={false}
                    style={styles.suggestionsList}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => saveSelectedLocation(item)}
                        disabled={savingLocation}
                        activeOpacity={0.7}
                      >
                        <View style={styles.suggestionIconContainer}>
                          <MaterialCommunityIcons
                            name="map-marker"
                            size={20}
                            color="#2ECC71"
                          />
                        </View>
                        <View style={styles.suggestionTextContainer}>
                          <Text style={styles.suggestionMainText}>
                            {item.structured_formatting?.main_text ||
                              item.description}
                          </Text>
                          {item.structured_formatting?.secondary_text && (
                            <Text style={styles.suggestionSecondaryText}>
                              {item.structured_formatting.secondary_text}
                            </Text>
                          )}
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color="#A3A3A3"
                        />
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      searchLocationQuery.length > 0 ? (
                        <View style={styles.emptyContainer}>
                          <MaterialCommunityIcons
                            name="map-marker-off"
                            size={48}
                            color="#A3A3A3"
                          />
                          <Text style={styles.emptyText}>
                            No locations found
                          </Text>
                          <Text style={styles.emptySubtext}>
                            Try searching with a different term
                          </Text>
                        </View>
                      ) : null
                    }
                  />
                )}

                {savingLocation && (
                  <View style={styles.savingOverlay}>
                    <ActivityIndicator size="large" color="white" />
                    <Text style={styles.savingText}>Saving location...</Text>
                  </View>
                )}
              </SafeAreaView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Header Panel
  headerPanel: {
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
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Poppins-LightItalic',
    color: '#000',
    marginLeft: 6,
    maxWidth: 120,
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
    marginTop: 4,
    minHeight: 22,
    fontFamily: 'Poppins-Regular',
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
    minHeight: 12,
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
    overflow: 'hidden',
  },
  filterButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Redesigned Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: height * 0.88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  safeAreaContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  currentLocationCard: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  currentLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIconBig: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationInfo: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  currentLocationCoords: {
    fontSize: 12,
    color: '#047857',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  updateLocationButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  updateLocationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  shineGradient: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  gpsCard: {
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gpsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  gpsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(79,70,229,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  gpsToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsToggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  gpsToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  gpsToggleSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 6,
  },
  infoBadgeText: {
    fontSize: 12,
    color: '#2ECC71',
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  searchCard: {
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(139,92,246,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInputIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  clearButton: {
    padding: 4,
  },
  suggestionsList: {
    flex: 1,
    marginHorizontal: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(46,204,113,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  suggestionSecondaryText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  savingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});

export default Header;