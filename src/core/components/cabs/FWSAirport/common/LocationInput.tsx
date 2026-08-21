// screens/cabs/centralize/LocationInputScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  FlatList,
  Keyboard,
  StatusBar,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { COLORS } from '../../../../../api/constants/FWSAirport';
import { Suggestion } from '../../../../types/FWSAirportTypes';
import { GOOGLE_API_KEY } from '../../../../../api/constants/mapConfig';
import { AnimatedPressable } from '../AnimatedPressable';
import {
  requestLocationPermission,
  fetchCurrentLocation,
} from '../../../../utils/cabs/locationHelper';

const { width } = Dimensions.get('window');

interface LocationInputScreenProps {
  navigation: any;
  route: any;
}

type TripTypeOption = 'AIRPORT_TO_LOCATION' | 'LOCATION_TO_AIRPORT' | null;

const LocationInputScreen: React.FC<LocationInputScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();

  const initialPickupText = route.params?.pickupText || '';
  const initialDropText = route.params?.dropText || '';
  const initialPickup = route.params?.pickup || null;
  const initialDrop = route.params?.drop || null;

  const pickupInputRef = useRef<TextInput>(null);
  const dropInputRef = useRef<TextInput>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const optionsFadeAnim = useRef(new Animated.Value(0)).current;
  const optionsSlideAnim = useRef(new Animated.Value(20)).current;
  const searchButtonAnim = useRef(new Animated.Value(0)).current;

  const [pickupText, setPickupText] = useState<string>(initialPickupText);
  const [dropText, setDropText] = useState<string>(initialDropText);
  const [pickup, setPickup] = useState<any>(initialPickup);
  const [drop, setDrop] = useState<any>(initialDrop);
  const [focusedField, setFocusedField] = useState<'pickup' | 'drop' | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<'pickup' | 'drop'>('pickup');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<TripTypeOption>(null);
  const [fetchingLocation, setFetchingLocation] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: showSuggestions ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: showSuggestions ? 0 : 30,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showSuggestions]);

  useEffect(() => {
    if (pickup && drop && !showSuggestions) {
      Animated.parallel([
        Animated.timing(optionsFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(optionsSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(searchButtonAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(optionsFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(optionsSlideAnim, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(searchButtonAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pickup, drop, showSuggestions]);

  const reverseGeocode = async (
    latitude: number,
    longitude: number,
  ): Promise<string> => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`,
      );
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }
      return '';
    } catch (error) {
      console.log('Reverse geocode error:', error);
      return '';
    }
  };

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setFetchingLocation(false);
      Alert.alert('Permission Denied', 'Please enable location permission.');
      return;
    }
    getCurrentUserLocation();
  };

  const getCurrentUserLocation = () => {
    setFetchingLocation(true);

    fetchCurrentLocation()
      .then(location => {
        const { latitude, longitude } = location;
        console.log('✅ Location fetched:', latitude, longitude);

        reverseGeocode(latitude, longitude)
          .then((address: string) => {
            const pickupLocation = {
              latitude,
              longitude,
              address: address || 'Current Location',
              googlePlaceId: '',
            };
            setPickup(pickupLocation);
            setPickupText(address || 'Current Location');
            setFetchingLocation(false);
          })
          .catch(() => {
            const pickupLocation = {
              latitude,
              longitude,
              address: 'Current Location',
              googlePlaceId: '',
            };
            setPickup(pickupLocation);
            setPickupText('Current Location');
            setFetchingLocation(false);
          });
      })
      .catch((error: Error) => {
        console.log('❌ Error getting location:', error);
        setFetchingLocation(false);
        Alert.alert(
          'Location Error',
          'Unable to get your location. Please try again.',
        );
      });
  };

  const searchLocations = async (text: string) => {
    if (!text || text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_API_KEY}&components=country:in`,
      );
      if (response.data.predictions) {
        const formattedSuggestions: Suggestion[] =
          response.data.predictions.map((pred: any) => ({
            placeId: pred.place_id,
            description: pred.description,
            mainText: pred.structured_formatting?.main_text || '',
            secondaryText: pred.structured_formatting?.secondary_text || '',
            latitude: 0,
            longitude: 0,
          }));
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.log('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectSuggestion = async (suggestion: Suggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.placeId}&key=${GOOGLE_API_KEY}`,
      );
      const place = response.data.result;
      const location = place.geometry?.location;
      if (location) {
        const lat = location.lat;
        const lng = location.lng;
        const address = place.formatted_address || suggestion.description;
        const locationData = {
          latitude: lat,
          longitude: lng,
          address: address,
          googlePlaceId: suggestion.placeId || place.place_id || '',
        };
        if (searchType === 'pickup') {
          setPickup(locationData);
          setPickupText(address);
          Keyboard.dismiss();
          pickupInputRef.current?.blur();
          if (!dropText) {
            setTimeout(() => {
              setSearchType('drop');
              dropInputRef.current?.focus();
            }, 300);
          }
        } else {
          setDrop(locationData);
          setDropText(address);
          Keyboard.dismiss();
          dropInputRef.current?.blur();
          setSelectedOption(null);
        }
      }
    } catch (error) {
      console.log('Place details error:', error);
    }
  };

  const handleSelectOption = (option: TripTypeOption) => {
    setSelectedOption(option);
  };

  const handleSearch = () => {
    if (!pickup || !drop) {
      Alert.alert('Error', 'Please select both pickup and drop locations.');
      return;
    }

    if (!selectedOption) {
      Alert.alert('Error', 'Please select a trip type.');
      return;
    }

    setIsSearching(true);

    navigation.navigate('FWSAirport', {
      pickup,
      drop,
      pickupText,
      dropText,
      selectedOption: selectedOption,
    });

    setIsSearching(false);
  };

  const swapLocations = () => {
    if (pickup && drop) {
      const tempPickup = pickup;
      const tempPickupText = pickupText;
      setPickup(drop);
      setPickupText(dropText);
      setDrop(tempPickup);
      setDropText(tempPickupText);
      setSelectedOption(null);
    }
  };

  const clearPickup = () => {
    setPickupText('');
    setPickup(null);
    setSelectedOption(null);
  };

  const clearDrop = () => {
    setDropText('');
    setDrop(null);
    setSelectedOption(null);
  };

  const closeSuggestions = () => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    setFocusedField(null);
  };

  const renderSuggestionRow = ({ item }: { item: Suggestion }) => (
    <TouchableOpacity
      style={styles.suggestionRow}
      onPress={() => selectSuggestion(item)}
      activeOpacity={0.6}
    >
      <View style={styles.suggestionIconWrap}>
        <Ionicons name="location-outline" size={20} color="#6c757d" />
      </View>
      <View style={styles.suggestionTextWrap}>
        <Text style={styles.suggestionMain} numberOfLines={1}>
          {item.mainText || item.description}
        </Text>
        {!!item.secondaryText && (
          <Text style={styles.suggestionSecondary} numberOfLines={1}>
            {item.secondaryText}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ced4da" />
    </TouchableOpacity>
  );

  const renderTripOptions = () => {
    if (!pickup || !drop || showSuggestions) return null;

    return (
      <Animated.View
        style={[
          styles.optionsContainer,
          {
            opacity: optionsFadeAnim,
            transform: [{ translateY: optionsSlideAnim }],
          },
        ]}
      >
        <View style={styles.optionsHeader}>
          <View style={styles.optionsTitleContainer}>
            <Ionicons name="airplane-outline" size={20} color="#1a1a1a" />
            <Text style={styles.optionsTitle}>Choose your journey type</Text>
          </View>
        </View>

        <View style={styles.optionsGrid}>
          {/* Option 1: Airport to Location */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'AIRPORT_TO_LOCATION' &&
                styles.optionCardSelected,
            ]}
            onPress={() => handleSelectOption('AIRPORT_TO_LOCATION')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.optionIconWrap,
                selectedOption === 'AIRPORT_TO_LOCATION' &&
                  styles.optionIconWrapSelected,
              ]}
            >
              <Ionicons
                name="airplane"
                size={24}
                color={
                  selectedOption === 'AIRPORT_TO_LOCATION'
                    ? COLORS.green
                    : '#6c757d'
                }
              />
            </View>
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionTitle,
                    selectedOption === 'AIRPORT_TO_LOCATION' &&
                      styles.optionTitleSelected,
                  ]}
                >
                  Airport → Destination
                </Text>
                <Text style={styles.optionSubtitle}>
                  From airport to your destination
                </Text>
              </View>
              {selectedOption === 'AIRPORT_TO_LOCATION' && (
                <View style={styles.checkmark}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.green}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Option 2: Location to Airport */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'LOCATION_TO_AIRPORT' &&
                styles.optionCardSelected,
            ]}
            onPress={() => handleSelectOption('LOCATION_TO_AIRPORT')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.optionIconWrap,
                selectedOption === 'LOCATION_TO_AIRPORT' &&
                  styles.optionIconWrapSelected,
              ]}
            >
              <Ionicons
                name="home-outline"
                size={24}
                color={
                  selectedOption === 'LOCATION_TO_AIRPORT'
                    ? COLORS.green
                    : '#6c757d'
                }
              />
            </View>
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionTitle,
                    selectedOption === 'LOCATION_TO_AIRPORT' &&
                      styles.optionTitleSelected,
                  ]}
                >
                  Destination → Airport
                </Text>
                <Text style={styles.optionSubtitle}>
                  From your location to the airport
                </Text>
              </View>
              {selectedOption === 'LOCATION_TO_AIRPORT' && (
                <View style={styles.checkmark}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.green}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            showSuggestions ? closeSuggestions() : navigation.goBack()
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name={showSuggestions ? 'close' : 'arrow-back'}
            size={24}
            color="#1a1a1a"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showSuggestions
            ? searchType === 'pickup'
              ? 'Choose pickup'
              : 'Choose drop-off'
            : 'Where to?'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Main Content */}
      <View style={styles.inputContainer}>
        {fetchingLocation ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.green} />
              <Text style={styles.loadingText}>Finding your location…</Text>
              <Text style={styles.loadingSubText}>
                Please make sure GPS is enabled
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setFetchingLocation(true);
                  setTimeout(() => getCurrentUserLocation(), 500);
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.contentWrapper,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Location Search Card - No gray background in inputs */}
            <View style={styles.card}>
              {/* Pickup */}
              <View style={styles.locationRow}>
                <View style={styles.railWrap}>
                  <View style={[styles.dot, styles.dotPickup]} />
                  <View style={styles.railLine} />
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={COLORS.green}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={pickupInputRef}
                    style={styles.locationInput}
                    placeholder="Pickup location"
                    placeholderTextColor="#adb5bd"
                    value={pickupText}
                    onChangeText={text => {
                      setPickupText(text);
                      searchLocations(text);
                      if (text.length === 0) {
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      setSearchType('pickup');
                      setFocusedField('pickup');
                      if (pickupText.length > 0) searchLocations(pickupText);
                    }}
                  />
                  {pickupText.length > 0 && (
                    <TouchableOpacity
                      onPress={clearPickup}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.clearButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#adb5bd" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Divider between pickup and drop */}
              <View style={styles.divider} />

              {/* Swap Button - On the right side */}
              <TouchableOpacity
                style={styles.swapButton}
                onPress={swapLocations}
                activeOpacity={0.7}
              >
                <View style={styles.swapGradient}>
                  <MaterialCommunityIcons name="swap-vertical" size={22} color="#495057" />
                </View>
              </TouchableOpacity>

              {/* Drop */}
              <View style={styles.locationRow}>
                <View style={styles.railWrap}>
                  <View style={[styles.dot, styles.dotDrop]} />
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="navigate"
                    size={20}
                    color="#495057"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={dropInputRef}
                    style={styles.locationInput}
                    placeholder="Where to?"
                    placeholderTextColor="#adb5bd"
                    value={dropText}
                    onChangeText={text => {
                      setDropText(text);
                      searchLocations(text);
                      if (text.length === 0) {
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      setSearchType('drop');
                      setFocusedField('drop');
                      if (dropText.length > 0) searchLocations(dropText);
                    }}
                  />
                  {dropText.length > 0 && (
                    <TouchableOpacity
                      onPress={clearDrop}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.clearButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#adb5bd" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Trip Type Options */}
            {renderTripOptions()}

            {/* Search Button */}
            {!showSuggestions && (
              <Animated.View
                style={{
                  opacity: searchButtonAnim,
                  transform: [{ scale: searchButtonAnim }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    (!pickup || !drop || !selectedOption || isSearching) &&
                      styles.searchButtonDisabled,
                  ]}
                  onPress={handleSearch}
                  disabled={!pickup || !drop || !selectedOption || isSearching}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      !pickup || !drop || !selectedOption || isSearching
                        ? ['#ced4da', '#dee2e6']
                        : [COLORS.green, '#34c759']
                    }
                    style={styles.searchGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isSearching ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <View style={styles.searchButtonContent}>
                        <Text style={styles.searchButtonText}>Find Rides</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={22}
                          color="#ffffff"
                        />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Suggestions Sheet */}
            {showSuggestions && (
              <Animated.View
                style={[styles.suggestionsSheet, { opacity: fadeAnim }]}
              >
                <View style={styles.suggestionsHeader}>
                  <View style={styles.suggestionsHeaderLeft}>
                    <Ionicons name="search" size={16} color="#868e96" />
                    <Text style={styles.suggestionsHeaderText}>
                      {searchLoading ? 'Searching...' : 'Places'}
                    </Text>
                  </View>
                  {searchLoading && (
                    <ActivityIndicator size="small" color={COLORS.green} />
                  )}
                </View>

                {suggestions.length > 0 ? (
                  <FlatList
                    data={suggestions}
                    renderItem={renderSuggestionRow}
                    keyExtractor={item => item.placeId}
                    keyboardShouldPersistTaps="always"
                    style={styles.suggestionsList}
                    ItemSeparatorComponent={() => (
                      <View style={styles.suggestionSeparator} />
                    )}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  !searchLoading && (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyStateIcon}>
                        <Ionicons
                          name="search-outline"
                          size={40}
                          color="#ced4da"
                        />
                      </View>
                      <Text style={styles.emptyStateTitle}>
                        No results found
                      </Text>
                      <Text style={styles.emptyStateText}>
                        Try searching with a different location
                      </Text>
                    </View>
                  )
                )}
              </Animated.View>
            )}
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  headerRight: {
    width: 44,
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  contentWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  loadingSubText: {
    marginTop: 6,
    fontSize: 13,
    color: '#868e96',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.green,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  railWrap: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  railLine: {
    width: 2,
    height: 24,
    backgroundColor: '#dee2e6',
    marginTop: 4,
    borderRadius: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPickup: {
    backgroundColor: COLORS.green,
  },
  dotDrop: {
    borderRadius: 2,
    backgroundColor: '#495057',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  clearButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginLeft: 32,
    marginRight: 56,
  },
  swapButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -20,
    zIndex: 10,
  },
  swapGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  optionsHeader: {
    marginBottom: 14,
  },
  optionsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  optionsGrid: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.green,
    backgroundColor: '#f0fdf4',
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionIconWrapSelected: {
    backgroundColor: '#d4edda',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  optionTitleSelected: {
    color: COLORS.green,
  },
  optionSubtitle: {
    fontSize: 10,
    color: '#868e96',
    marginTop: 2,
    fontWeight: '300',
  },
  checkmark: {
    marginLeft: 8,
  },
  searchButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  searchButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  searchGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  suggestionsSheet: {
    flex: 1,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  suggestionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionsHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#868e96',
    letterSpacing: 0.5,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  suggestionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  suggestionSecondary: {
    fontSize: 13,
    color: '#868e96',
    marginTop: 1,
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: '#f1f3f5',
    marginLeft: 54,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#868e96',
  },
});

export default LocationInputScreen;
