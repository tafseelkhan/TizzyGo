// components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../contexts/theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import your components
import SearchBar from './SearchBarHome';
import FilterDropdown from './Common/FilterDropDownHome';
import CartButton from './CartButtonHome';

// Import Lottie animations
const xaiAnimation = require('../../components/animations/lotties/Artificial Intelligence.json');

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

interface LocationSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
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

// Define navigation param types
type RootStackParamList = {
  '/': undefined;
  '/xai': undefined;
  [key: string]: any;
};

// Define geolocation types for web
interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Get theme from ThemeContext (fallback to parent prop)
  const themeContext = useTheme();
  const isDark =
    parentIsDark !== undefined ? parentIsDark : themeContext?.isDark || false;

  // Theme-based colors
  const getThemeColors = () => {
    return {
      headerBg: isDark ? '#00000000' : '#00000000',
      textColor: isDark ? '#F1F5F9' : '#374151',
      locationBarBg: isDark ? '#1F2937' : '#F3F4F6',
      locationTextColor: isDark ? '#F1F5F9' : '#374151',
      modalBg: isDark ? '#1F2937' : '#FFFFFF',
      inputBg: isDark ? '#374151' : '#F9FAFB',
      inputBorder: isDark ? '#4B5563' : '#E5E7EB',
      suggestionText: isDark ? '#F1F5F9' : '#374151',
      suggestionSecondaryText: isDark ? '#9CA3AF' : '#6B7280',
    };
  };

  const themeColors = getThemeColors();

  // Animated values for header hide/show using scrollY
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

  // Search active status track
  useEffect(() => {
    setIsSearchActive(searchQuery.length > 0 && hasSearchResults);
  }, [searchQuery, hasSearchResults]);

  // Scroll effect for background change
  useEffect(() => {
    if (disableScrollEffect) return;

    const listener = scrollY.addListener(({ value }) => {
      setIsScrolled(value > 20);
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, disableScrollEffect]);

  // Google Places API search
  const searchGooglePlaces = async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      return;
    }

    setLoadingLocations(true);
    try {
      // Replace with your actual Google Places API endpoint
      const response = await fetch(
        `/api/google-places/autocomplete?input=${encodeURIComponent(query)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setLocationSuggestions(data.predictions || []);
      } else {
        console.error('Failed to fetch location suggestions');
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Debounce location search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchLocationQuery) {
        searchGooglePlaces(searchLocationQuery);
      } else {
        setLocationSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchLocationQuery]);

  // Save selected location
  const saveSelectedLocation = async (selectedLocation: LocationSuggestion) => {
    setSavingLocation(true);
    try {
      // Get detailed address information
      const detailsResponse = await fetch(
        `/api/google-places/details?place_id=${selectedLocation.place_id}`
      );
      
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        const formattedAddress = details.result.formatted_address;
        
        // Call your post address API
        const saveResponse = await fetch('/api/user/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            address: formattedAddress,
            placeId: selectedLocation.place_id,
            locationDetails: details.result,
          }),
        });

        if (saveResponse.ok) {
          setLocation(formattedAddress);
          setLocationModalVisible(false);
          setSearchLocationQuery('');
          setLocationSuggestions([]);
        } else {
          console.error('Failed to save location');
          Alert.alert('Error', 'Failed to save location. Please try again.');
        }
      } else {
        // Fallback to using the description if details fetch fails
        setLocation(selectedLocation.description);
        setLocationModalVisible(false);
        setSearchLocationQuery('');
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      // Fallback to using the description
      setLocation(selectedLocation.description);
      setLocationModalVisible(false);
      setSearchLocationQuery('');
      setLocationSuggestions([]);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setSavingLocation(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (Platform.OS === 'web') {
      // Use globalThis with type assertion for web environment
      const globalObj = globalThis as any;
      
      if (globalObj && globalObj.navigator && globalObj.navigator.geolocation) {
        globalObj.navigator.geolocation.getCurrentPosition(
          async (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            // Reverse geocode to get address
            try {
              const response = await fetch(
                `/api/google-places/reverse-geocode?lat=${latitude}&lng=${longitude}`
              );
              if (response.ok) {
                const data = await response.json();
                const address = data.results[0]?.formatted_address || 'Current Location';
                setLocation(address);
                setLocationModalVisible(false);
              } else {
                setLocation('Current Location');
                setLocationModalVisible(false);
              }
            } catch (error) {
              console.error('Error getting address from coordinates:', error);
              setLocation('Current Location');
              setLocationModalVisible(false);
            }
          },
          (error: GeolocationError) => {
            console.error('Error getting current location:', error.message);
            // Show user-friendly error message
            Alert.alert(
              'Location Error',
              'Unable to get your location. Please enable location services or search manually.'
            );
          }
        );
      } else {
        Alert.alert(
          'Not Supported',
          'Geolocation is not supported by your browser. Please search manually.'
        );
      }
    } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // For React Native mobile platforms, you'd use a library like @react-native-community/geolocation
      console.log('Mobile geolocation would be implemented here');
      Alert.alert(
        'Coming Soon',
        'Location services will be available soon. Please search manually for now.'
      );
    }
  };

  // Filter button show/hide logic
  const shouldShowFilterButton = showFilterButton && isSearchActive;

  const headerBackground = isScrolled
    ? [styles.scrolledHeader, { backgroundColor: themeColors.headerBg }]
    : styles.normalHeader;

  const { width } = Dimensions.get('window');

  return (
    <>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.header,
          headerBackground,
          {
            transform: [{ translateY: disableScrollEffect ? 0 : translateY }],
            opacity: disableScrollEffect ? 1 : opacity,
          },
        ]}
      >
        {/* Status Bar Background for Mobile */}
        {Platform.OS !== 'web' && width < 1024 && (
          <View
            style={[
              styles.statusBarBackground,
              {
                backgroundColor: isDark ? '#0F172A' : 'white',
              },
            ]}
          >
            <StatusBar
              barStyle={isDark ? 'light-content' : 'dark-content'}
              translucent
              backgroundColor="transparent"
            />
          </View>
        )}

        {/* Location Bar - Replaces Announcement */}
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
            <Icon name="location-on" size={20} color={isDark ? '#F1F5F9' : '#374151'} />
            <View style={styles.locationTextContainer}>
              <Text style={[styles.locationLabel, { color: themeColors.locationTextColor }]}>
                Delivery to:
              </Text>
              <Text 
                style={[styles.locationAddress, { color: themeColors.locationTextColor }]}
                numberOfLines={1}
              >
                {location || 'Select your location'}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={isDark ? '#F1F5F9' : '#374151'} />
          </View>
        </TouchableOpacity>

        {/* Mobile Search Bar */}
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

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: themeColors.modalBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.locationTextColor }]}>
                Select Delivery Location
              </Text>
              <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={themeColors.locationTextColor} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchInputContainer, { 
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.inputBorder,
            }]}>
              <Icon name="search" size={20} color={themeColors.suggestionSecondaryText} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.locationTextColor }]}
                placeholder="Search for area, street, or landmark..."
                placeholderTextColor={themeColors.suggestionSecondaryText}
                value={searchLocationQuery}
                onChangeText={setSearchLocationQuery}
              />
              {searchLocationQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchLocationQuery('')}>
                  <Icon name="clear" size={20} color={themeColors.suggestionSecondaryText} />
                </TouchableOpacity>
              )}
            </View>

            {/* Current Location Button */}
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
            >
              <Icon name="my-location" size={20} color={isDark ? '#F1F5F9' : '#374151'} />
              <Text style={[styles.currentLocationText, { color: themeColors.locationTextColor }]}>
                Use current location
              </Text>
            </TouchableOpacity>

            {/* Suggestions List */}
            {loadingLocations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={isDark ? '#F1F5F9' : '#374151'} />
                <Text style={[styles.loadingText, { color: themeColors.suggestionSecondaryText }]}>
                  Searching locations...
                </Text>
              </View>
            ) : (
              <FlatList
                data={locationSuggestions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => saveSelectedLocation(item)}
                    disabled={savingLocation}
                  >
                    <Icon name="location-on" size={20} color={themeColors.suggestionSecondaryText} />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={[styles.suggestionMainText, { color: themeColors.suggestionText }]}>
                        {item.structured_formatting?.main_text || item.description}
                      </Text>
                      {item.structured_formatting?.secondary_text && (
                        <Text style={[styles.suggestionSecondaryText, { color: themeColors.suggestionSecondaryText }]}>
                          {item.structured_formatting.secondary_text}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  searchLocationQuery.length > 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: themeColors.suggestionSecondaryText }]}>
                        No locations found. Try searching with a different term.
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}

            {savingLocation && (
              <View style={styles.savingOverlay}>
                <ActivityIndicator size="large" color={isDark ? '#F1F5F9' : '#374151'} />
                <Text style={[styles.savingText, { color: themeColors.locationTextColor }]}>
                  Saving location...
                </Text>
              </View>
            )}
          </View>
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
    backgroundColor: 'white',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  normalHeader: {
    backgroundColor: 'transparent',
  },
  scrolledHeader: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop:
      Platform.OS !== 'web' && width < 1024
        ? Platform.OS === 'ios'
          ? 44
          : StatusBar.currentHeight
        : 0,
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
    fontSize: 14,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  mainHeader: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  desktopHeader: {
    display: width >= 1024 ? 'flex' : 'none',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 24,
  },
  mobileHeader: {
    display: width >= 1024 ? 'none' : 'flex',
    paddingVertical: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  logoWrapper: {
    position: 'relative',
  },
  logoBackground: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoTextContainer: {
    flexDirection: 'column',
    minWidth: 0,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'billabong',
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  hiddenSubtitle: {
    opacity: 0,
    height: 0,
  },
  searchContainer: {
    flexGrow: 1,
    maxWidth: 672,
  },
  locationContainer: {
    flexShrink: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiButton: {
    padding: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lottieContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  lottieAnimation: {
    width: 40,
    height: 40,
  },
  mobileTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  mobileLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  mobileLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mobileLogoImage: {
    width: '100%',
    height: '100%',
  },
  mobileLogoText: {
    flexDirection: 'column',
  },
  mobileLogoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'billabong',
  },
  mobileLogoSubtitle: {
    fontSize: 10,
    fontWeight: '600',
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileAiButton: {
    padding: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  mobileLottieContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    overflow: 'hidden',
  },
  mobileLottie: {
    width: 20,
    height: 20,
  },
  mobileSearchContainer: {
    paddingBottom: 8,
    marginBottom: 180,
  },
  mobileLocationContainer: {
    paddingBottom: 67,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    minHeight: height * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    gap: 8,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionSecondaryText: {
    fontSize: 12,
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
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
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
    borderRadius: 20,
  },
  savingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Header;