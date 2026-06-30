// src/components/Header.tsx - FINAL WITH DRAGGABLE MODAL & SHIMMER EFFECT
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
  PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import LinearGradient from 'react-native-linear-gradient';

// Import components
import SearchBar from './SearchBarHome';

// Import services and utils
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

interface SearchResult {
  category: string;
  products: Array<{
    _id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
  }>;
}

interface HeaderProps {
  location: string;
  setLocation: (location: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  handleCategoryClick: (category: string) => void;
  onSearchResults?: (results: SearchResult[]) => void;
  onRefresh?: () => Promise<void>;
  userId?: string;
  disableScrollEffect?: boolean;
  refreshing?: boolean;
  showFilterButton?: boolean;
  hasSearchResults?: boolean;
  scrollY: Animated.Value;
  isDark?: boolean;
}

// Shimmer animation value
const shimmerAnim = new Animated.Value(0);

const Header: React.FC<HeaderProps> = ({
  location,
  setLocation,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  handleCategoryClick,
  onSearchResults,
  onRefresh,
  userId = 'default-user',
  disableScrollEffect = false,
  refreshing = false,
  showFilterButton = false,
  hasSearchResults = false,
  scrollY,
  isDark: parentIsDark,
}) => {
  // State
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
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
  const [modalHeight] = useState(new Animated.Value(500));
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const navigation = useNavigation<any>();
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const searchInputRef = useRef<TextInput>(null);

  // Theme
  const themeContext = useTheme();
  const isDark =
    parentIsDark !== undefined ? parentIsDark : themeContext?.isDark || false;

  // Start shimmer animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // PanResponder for draggable modal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = Math.max(
          300,
          Math.min(
            Dimensions.get('window').height - 100,
            500 - gestureState.dy,
          ),
        );
        modalHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        const finalHeight = 500 - gestureState.dy;
        if (finalHeight > 550) {
          Animated.spring(modalHeight, {
            toValue: Dimensions.get('window').height - 100,
            useNativeDriver: false,
          }).start();
        } else if (finalHeight < 400) {
          Animated.spring(modalHeight, {
            toValue: 400,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.spring(modalHeight, {
            toValue: 500,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const getThemeColors = () => ({
    headerBg: isDark ? '#00000000' : '#00000000',
    textColor: isDark ? '#F1F5F9' : '#374151',
    locationBarBg: isDark ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0)',
    locationTextColor: isDark ? '#F1F5F9' : '#374151',
    modalBg: isDark ? '#1F2937' : '#FFFFFF',
    inputBg: isDark ? '#374151' : '#F9FAFB',
    inputBorder: isDark ? '#4B5563' : '#E5E7EB',
    suggestionText: isDark ? '#F1F5F9' : '#374151',
    suggestionSecondaryText: isDark ? '#9CA3AF' : '#6B7280',
    switchTrackColor: isDark ? '#4B5563' : '#E5E7EB',
    cardBg: isDark ? '#1F2937' : '#FFFFFF',
    borderColor: isDark ? '#374151' : '#E5E7EB',
  });

  const themeColors = getThemeColors();

  // Shimmer interpolation for gradient
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const headerHeight = 120;
  const translateY = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });
  const opacity = scrollY.interpolate({
    inputRange: [0, headerHeight / 2, headerHeight],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    setIsSearchActive(searchQuery.length > 0 && hasSearchResults);
  }, [searchQuery, hasSearchResults]);

  useEffect(() => {
    if (disableScrollEffect) return;
    const listener = scrollY.addListener(({ value }) =>
      setIsScrolled(value > 20),
    );
    return () => scrollY.removeListener(listener);
  }, [scrollY, disableScrollEffect]);

  useEffect(() => {
    loadDataFromBackend();
  }, [userId]);

  useEffect(() => {
    if (isGpsTrackingEnabled) {
      startGpsTracking();
    } else {
      stopGpsTracking();
    }
    return () => stopGpsTracking();
  }, [isGpsTrackingEnabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchLocationQuery) {
        searchPlacesDebounced(searchLocationQuery);
      } else {
        setLocationSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchLocationQuery]);

  const loadDataFromBackend = async () => {
    try {
      const result = await locationApi.getLocation();
      if (!result.success || !result.data) {
        console.log('No location found. User needs to set location first.');
        return;
      }
      if (result.data.gpsTrackingEnabled !== undefined) {
        setIsGpsTrackingEnabled(result.data.gpsTrackingEnabled);
      }
      if (result.data.location?.coordinates) {
        const coords = parseGeoJsonCoordinates(
          result.data.location.coordinates,
        );
        if (coords) {
          setCurrentCoordinates(coords);
          if (result.data.location.address) {
            setLocation(result.data.location.address);
          } else {
            setLocation(formatCoordinates(coords.lat, coords.lng));
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const searchPlacesDebounced = async (query: string) => {
    setLoadingLocations(true);
    const suggestions = await googlePlacesService.searchPlaces(query);
    setLocationSuggestions(suggestions);
    setLoadingLocations(false);
  };

  const saveSelectedLocation = async (selectedLocation: PlaceSuggestion) => {
    setSavingLocation(true);
    try {
      const details = await googlePlacesService.getPlaceDetails(
        selectedLocation.place_id,
      );
      if (details) {
        setLocation(details.address);
        const result = await locationApi.saveLocation(
          details.lat,
          details.lng,
          details.address,
          details.city,
          details.state,
          details.country,
          details.pinCode,
          details.placeId,
        );
        if (result.success) {
          setLocationModalVisible(false);
          setSearchLocationQuery('');
          setLocationSuggestions([]);
          Alert.alert('Success', 'Location saved successfully!');
          await loadDataFromBackend();
        } else {
          Alert.alert('Error', result.message || 'Failed to save location');
        }
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location.');
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
          const result = await locationApi.saveLocation(
            gpsLocation.lat,
            gpsLocation.lng,
            addressInfo.address,
            addressInfo.city,
            addressInfo.state,
            addressInfo.country,
            addressInfo.pinCode,
            '',
          );
          if (result.success) {
            Alert.alert(
              'Location Updated',
              `Your location has been set to: ${addressInfo.address}`,
            );
            setLocationModalVisible(false);
            await loadDataFromBackend();
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
          if (
            currentCoordinates &&
            hasLocationChangedSignificantly(
              currentCoordinates.lat,
              currentCoordinates.lng,
              gpsLocation.lat,
              gpsLocation.lng,
              50,
            )
          ) {
            await locationApi.saveLocation(
              gpsLocation.lat,
              gpsLocation.lng,
              formatCoordinates(gpsLocation.lat, gpsLocation.lng),
              'Unknown',
              'Unknown',
              'India',
              '000000',
              '',
            );
            setLocation(formatCoordinates(gpsLocation.lat, gpsLocation.lng));
          } else if (!currentCoordinates) {
            await locationApi.saveLocation(
              gpsLocation.lat,
              gpsLocation.lng,
              formatCoordinates(gpsLocation.lat, gpsLocation.lng),
              'Unknown',
              'Unknown',
              'India',
              '000000',
              '',
            );
            setLocation(formatCoordinates(gpsLocation.lat, gpsLocation.lng));
          }
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

  const handleUpdateLocation = async () => {
    await getCurrentLocationAndUpdate();
  };

  const { width } = Dimensions.get('window');

  // Shimmer effect component
  const ShimmerOverlay = () => (
    <Animated.View
      style={[
        styles.shimmerOverlay,
        {
          transform: [{ translateX: shimmerTranslate }],
        },
      ]}
    >
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );

  return (
    <>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.header,
          {
            transform: [{ translateY: disableScrollEffect ? 0 : translateY }],
            opacity: disableScrollEffect ? 1 : opacity,
          },
        ]}
      >
        {/* Status Bar Background */}
        {Platform.OS !== 'web' && width < 1024 && (
          <View style={[styles.statusBarBackground]}>
            <StatusBar
              barStyle={isDark ? 'light-content' : 'dark-content'}
              translucent
              backgroundColor="transparent"
            />
          </View>
        )}

        {/* Location Bar - OUTER UI */}
        <TouchableOpacity
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.8}
          style={[
            styles.locationBar,
            {
              backgroundColor: themeColors.locationBarBg,
              marginTop:
                Platform.OS !== 'web' && width < 1024
                  ? Platform.OS === 'ios'
                    ? 44
                    : StatusBar.currentHeight
                  : 0,
            },
          ]}
        >
          <View style={styles.locationBarContent}>
            <Icon
              name="my-location"
              size={15}
              color={isDark ? '#F1F5F9' : '#374151'}
            />
            <View style={styles.locationTextContainer}>
              <Text
                style={[
                  styles.locationLabel,
                  { color: themeColors.locationTextColor },
                ]}
              >
                Delivery to:
              </Text>
              <Text
                style={[
                  styles.locationAddress,
                  { color: themeColors.locationTextColor },
                ]}
                numberOfLines={1}
              >
                {location || 'Select your location'}
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={20}
              color={isDark ? '#F1F5F9' : '#374151'}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.mobileSearchContainer}>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchResults={onSearchResults}
            userId={userId}
            handleCategoryClick={handleCategoryClick}
            isMobile={true}
            isDark={isDark}
          />
        </View>
      </Animated.View>

      {/* Draggable Half-Screen Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: themeColors.modalBg,
                height: modalHeight,
                maxHeight: Dimensions.get('window').height - 80,
              },
            ]}
          >
            {/* Draggable Handle */}
            <View {...panResponder.panHandlers} style={styles.modalDragHandle}>
              <View style={styles.dragIndicator} />
              <Text
                style={[
                  styles.dragText,
                  { color: themeColors.suggestionSecondaryText },
                ]}
              >
                Drag to resize
              </Text>
            </View>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: themeColors.locationTextColor },
                ]}
              >
                Select Delivery Location
              </Text>
              <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon
                  name="close"
                  size={24}
                  color={themeColors.locationTextColor}
                />
              </TouchableOpacity>
            </View>

            {/* GPS Tracking Section */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.borderColor,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#4F46E5', '#6366F1']}
                  style={styles.sectionIconContainer}
                >
                  <Fontisto name="map-marker-alt" size={16} color="#FFFFFF" />
                </LinearGradient>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: themeColors.locationTextColor },
                  ]}
                >
                  Location Tracking
                </Text>
              </View>

              <View style={styles.gpsToggleContainer}>
                <View style={styles.gpsToggleLeft}>
                  <Text
                    style={[
                      styles.gpsToggleText,
                      { color: themeColors.locationTextColor },
                    ]}
                  >
                    Automatic Tracking
                  </Text>
                  <Text
                    style={[
                      styles.gpsToggleSubtext,
                      { color: themeColors.suggestionSecondaryText },
                    ]}
                  >
                    Get real-time location updates
                  </Text>
                </View>
                <Switch
                  value={isGpsTrackingEnabled}
                  onValueChange={toggleGpsTracking}
                  disabled={updatingGpsStatus}
                  trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {isGpsTrackingEnabled && (
                <View style={styles.infoBadge}>
                  <Icon name="info" size={14} color="#4F46E5" />
                  <Text style={styles.infoBadgeText}>
                    Updates every 30 seconds
                  </Text>
                </View>
              )}
            </View>

            {/* Current Location Section */}
            {currentCoordinates && (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.borderColor,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.sectionIconContainer}
                  >
                    <Icon name="gps-fixed" size={16} color="#FFFFFF" />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: themeColors.locationTextColor },
                    ]}
                  >
                    Current Location
                  </Text>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.coordinatesText}>
                  {currentCoordinates.lat.toFixed(6)},{' '}
                  {currentCoordinates.lng.toFixed(6)}
                </Text>
              </View>
            )}

            {/* Update Location Button with Shimmer Effect */}
            <TouchableOpacity
              style={styles.updateLocationButton}
              onPress={handleUpdateLocation}
              disabled={isGettingGpsLocation}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#4F46E5', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.updateButtonGradient}
              >
                {isGettingGpsLocation ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="my-location" size={20} color="white" />
                    <Text style={styles.updateLocationButtonText}>
                      Update Current Location
                    </Text>
                  </>
                )}
              </LinearGradient>
              <ShimmerOverlay />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text
                style={[
                  styles.dividerText,
                  { color: themeColors.suggestionSecondaryText },
                ]}
              >
                OR
              </Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Search Section with Shimmer Effect on Input */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.borderColor,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.sectionIconContainer}
                >
                  <Icon name="search" size={16} color="#FFFFFF" />
                </LinearGradient>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: themeColors.locationTextColor },
                  ]}
                >
                  Search Address
                </Text>
              </View>

              <View
                style={[
                  styles.searchInputContainer,
                  {
                    backgroundColor: themeColors.inputBg,
                    borderColor: themeColors.inputBorder,
                  },
                ]}
              >
                <Icon
                  name="search"
                  size={20}
                  color={themeColors.suggestionSecondaryText}
                />
                <TextInput
                  ref={searchInputRef}
                  style={[
                    styles.searchInput,
                    { color: themeColors.locationTextColor },
                  ]}
                  placeholder="Search for area, street, or landmark..."
                  placeholderTextColor={themeColors.suggestionSecondaryText}
                  value={searchLocationQuery}
                  onChangeText={setSearchLocationQuery}
                />
                {searchLocationQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchLocationQuery('')}
                    style={styles.clearButton}
                  >
                    <Icon
                      name="clear"
                      size={18}
                      color={themeColors.suggestionSecondaryText}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Suggestions List */}
            {loadingLocations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text
                  style={[
                    styles.loadingText,
                    { color: themeColors.suggestionSecondaryText },
                  ]}
                >
                  Searching locations...
                </Text>
              </View>
            ) : (
              <FlatList
                data={locationSuggestions}
                keyExtractor={item => item.place_id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.suggestionItem,
                      { borderBottomColor: themeColors.borderColor },
                    ]}
                    onPress={() => saveSelectedLocation(item)}
                    disabled={savingLocation}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionIconContainer}>
                      <Icon name="location-on" size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.suggestionTextContainer}>
                      <Text
                        style={[
                          styles.suggestionMainText,
                          { color: themeColors.suggestionText },
                        ]}
                      >
                        {item.structured_formatting?.main_text ||
                          item.description}
                      </Text>
                      {item.structured_formatting?.secondary_text && (
                        <Text
                          style={[
                            styles.suggestionSecondaryText,
                            { color: themeColors.suggestionSecondaryText },
                          ]}
                        >
                          {item.structured_formatting.secondary_text}
                        </Text>
                      )}
                    </View>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={themeColors.suggestionSecondaryText}
                    />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  searchLocationQuery.length > 0 ? (
                    <View style={styles.emptyContainer}>
                      <Icon
                        name="location-off"
                        size={48}
                        color={themeColors.suggestionSecondaryText}
                      />
                      <Text
                        style={[
                          styles.emptyText,
                          { color: themeColors.suggestionSecondaryText },
                        ]}
                      >
                        No locations found
                      </Text>
                      <Text
                        style={[
                          styles.emptySubtext,
                          { color: themeColors.suggestionSecondaryText },
                        ]}
                      >
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
                <Text style={[styles.savingText, { color: '#FFFFFF' }]}>
                  Saving location...
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
    height: 950,
    overflow: 'hidden',
  },
  statusBarBackground: {
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight,
    backgroundColor: 'transparent',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  locationBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  locationBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '300',
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '300',
    flex: 1,
  },
  mobileSearchContainer: {
    paddingBottom: 8,
    marginBottom: 180,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalDragHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  dragText: {
    fontSize: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  gpsToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsToggleLeft: {
    flex: 1,
  },
  gpsToggleText: {
    fontSize: 15,
    fontWeight: '500',
  },
  gpsToggleSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  infoBadgeText: {
    fontSize: 11,
    color: '#4F46E5',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  coordinatesText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  updateLocationButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  updateLocationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  clearButton: {
    padding: 4,
  },
  suggestionsList: {
    paddingBottom: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4F46E510',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 15,
    fontWeight: '500',
  },
  suggestionSecondaryText: {
    fontSize: 13,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  savingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Header;
