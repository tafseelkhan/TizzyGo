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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS } from '../../../../../api/constants/FWSAirport';
import { Suggestion } from '../../../../types/FWSAirportTypes';
import { GOOGLE_API_KEY } from '../../../../../api/constants/mapConfig';
import { AnimatedPressable } from '../AnimatedPressable';

// ✅ IMPORT LOCATION HELPER
import {
  requestLocationPermission,
  fetchCurrentLocation,
} from '../../../../utils/cabs/locationHelper';

interface LocationInputScreenProps {
  navigation: any;
  route: any;
}

// ✅ NEW: Trip Type Options
type TripTypeOption = 'AIRPORT_TO_LOCATION' | 'LOCATION_TO_AIRPORT' | null;

const LocationInputScreen: React.FC<LocationInputScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();

  // Get initial values from navigation params
  const initialPickupText = route.params?.pickupText || '';
  const initialDropText = route.params?.dropText || '';
  const initialPickup = route.params?.pickup || null;
  const initialDrop = route.params?.drop || null;

  // Refs
  const pickupInputRef = useRef<TextInput>(null);
  const dropInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const optionsFadeAnim = useRef(new Animated.Value(0)).current;

  // States
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

  // ✅ NEW: Selected trip type option
  const [selectedOption, setSelectedOption] = useState<TripTypeOption>(null);

  // ✅ Location fetch states
  const [fetchingLocation, setFetchingLocation] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showSuggestions ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showSuggestions]);

  // ✅ NEW: Animate options when both pickup and drop are selected
  useEffect(() => {
    if (pickup && drop && !showSuggestions) {
      Animated.timing(optionsFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(optionsFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [pickup, drop, showSuggestions]);

  // ✅ Reverse geocode function
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

  // ✅ Fetch current location on mount
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

  // Search locations
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

  // Select suggestion
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
          // ✅ auto-shift focus to drop field
          if (!dropText) {
            setTimeout(() => {
              setSearchType('drop');
              dropInputRef.current?.focus();
            }, 200);
          }
        } else {
          setDrop(locationData);
          setDropText(address);
          Keyboard.dismiss();
          dropInputRef.current?.blur();
          // ✅ NEW: Reset selected option when drop changes
          setSelectedOption(null);
        }
      }
    } catch (error) {
      console.log('Place details error:', error);
    }
  };

  // ✅ NEW: Select trip type option
  const handleSelectOption = (option: TripTypeOption) => {
    setSelectedOption(option);
  };

  // ✅ SEARCH BUTTON - Navigate to BookingScreen with selected option
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

    // ✅ Navigate to BookingScreen with location data + selected option
    navigation.navigate('FWSAirport', {
      pickup,
      drop,
      pickupText,
      dropText,
      selectedOption: selectedOption, // ✅ NEW: Pass selected option
    });

    setIsSearching(false);
  };

  // Swap locations
  const swapLocations = () => {
    if (pickup && drop) {
      const tempPickup = pickup;
      const tempPickupText = pickupText;
      setPickup(drop);
      setPickupText(dropText);
      setDrop(tempPickup);
      setDropText(tempPickupText);
      setSelectedOption(null); // ✅ Reset selection on swap
    }
  };

  // Clear functions
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
        <Icon name="location-on" size={18} color={COLORS.textSecondary} />
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
      <Icon name="north-west" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  // ✅ NEW: Render trip type options
  const renderTripOptions = () => {
    if (!pickup || !drop || showSuggestions) return null;

    return (
      <Animated.View
        style={[
          styles.optionsContainer,
          { opacity: optionsFadeAnim, transform: [{ scale: optionsFadeAnim }] },
        ]}
      >
        <Text style={styles.optionsTitle}>How would you like to travel?</Text>

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
            <View style={styles.optionIconWrap}>
              <Icon
                name="flight-takeoff"
                size={24}
                color={
                  selectedOption === 'AIRPORT_TO_LOCATION'
                    ? COLORS.green
                    : COLORS.textSecondary
                }
              />
            </View>
            <Text
              style={[
                styles.optionTitle,
                selectedOption === 'AIRPORT_TO_LOCATION' &&
                  styles.optionTitleSelected,
              ]}
            >
              Airport to Location
            </Text>
            <Text style={styles.optionSubtitle}>
              From airport to your destination
            </Text>
            {selectedOption === 'AIRPORT_TO_LOCATION' && (
              <View style={styles.checkmark}>
                <Icon name="check-circle" size={20} color={COLORS.green} />
              </View>
            )}
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
            <View style={styles.optionIconWrap}>
              <Icon
                name="flight-land"
                size={24}
                color={
                  selectedOption === 'LOCATION_TO_AIRPORT'
                    ? COLORS.green
                    : COLORS.textSecondary
                }
              />
            </View>
            <Text
              style={[
                styles.optionTitle,
                selectedOption === 'LOCATION_TO_AIRPORT' &&
                  styles.optionTitleSelected,
              ]}
            >
              Location to Airport
            </Text>
            <Text style={styles.optionSubtitle}>
              From your location to the airport
            </Text>
            {selectedOption === 'LOCATION_TO_AIRPORT' && (
              <View style={styles.checkmark}>
                <Icon name="check-circle" size={20} color={COLORS.green} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            showSuggestions ? closeSuggestions() : navigation.goBack()
          }
          activeOpacity={0.7}
        >
          <Icon
            name={showSuggestions ? 'close' : 'arrow-back'}
            size={22}
            color={COLORS.ink}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showSuggestions
            ? searchType === 'pickup'
              ? 'Set pickup'
              : 'Set drop'
            : 'Where to?'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Location Card */}
      <View style={styles.inputContainer}>
        {fetchingLocation ? (
          <View style={styles.loadingContainer}>
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
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.card}>
              {/* Pickup */}
              <View
                style={[
                  styles.locationRow,
                  focusedField === 'pickup' && styles.locationRowFocused,
                ]}
              >
                <View style={styles.railWrap}>
                  <View style={styles.dotPickup} />
                  <View style={styles.railLine} />
                </View>
                <TextInput
                  ref={pickupInputRef}
                  style={styles.locationInput}
                  placeholder="Pickup location"
                  placeholderTextColor={COLORS.textMuted}
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
                  >
                    <Icon name="close" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.divider} />

              {/* Drop */}
              <View
                style={[
                  styles.locationRow,
                  focusedField === 'drop' && styles.locationRowFocused,
                ]}
              >
                <View style={styles.railWrap}>
                  <View style={styles.dotDrop} />
                </View>
                <TextInput
                  ref={dropInputRef}
                  style={styles.locationInput}
                  placeholder="Where to?"
                  placeholderTextColor={COLORS.textMuted}
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
                  >
                    <Icon name="close" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Swap Button */}
              <AnimatedPressable
                style={styles.swapButton}
                onPress={swapLocations}
                scaleTo={0.85}
              >
                <Icon name="swap-vert" size={18} color={COLORS.ink} />
              </AnimatedPressable>
            </View>

            {/* ✅ NEW: Trip Type Options */}
            {renderTripOptions()}

            {/* ✅ SEARCH BUTTON - hidden while suggestion sheet is open */}
            {!showSuggestions && (
              <AnimatedPressable
                style={[
                  styles.searchButton,
                  (!pickup || !drop || !selectedOption || isSearching) &&
                    styles.searchButtonDisabled,
                ]}
                onPress={handleSearch}
                disabled={!pickup || !drop || !selectedOption || isSearching}
                scaleTo={0.95}
              >
                {isSearching ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.searchButtonText}>Search Rides</Text>
                    <Icon name="arrow-forward" size={20} color={COLORS.white} />
                  </>
                )}
              </AnimatedPressable>
            )}

            {/* ✅ Full-screen immersive suggestions sheet */}
            {showSuggestions && (
              <Animated.View
                style={[styles.suggestionsSheet, { opacity: fadeAnim }]}
              >
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.suggestionsHeaderText}>
                    {searchLoading ? 'SEARCHING…' : 'SUGGESTIONS'}
                  </Text>
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
                      <Icon
                        name="search-off"
                        size={28}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.emptyStateText}>
                        Keep typing to find a place
                      </Text>
                    </View>
                  )
                )}
              </Animated.View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.ink,
  },
  headerRight: {
    width: 40,
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  loadingSubText: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.green,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    position: 'relative',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  locationRowFocused: {},
  divider: {
    height: 1,
    backgroundColor: COLORS.hairline,
    marginLeft: 24,
  },
  railWrap: {
    width: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  railLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.borderStrong,
    marginTop: 4,
    borderRadius: 1,
  },
  dotPickup: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.green,
  },
  dotDrop: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: COLORS.ink,
  },
  locationInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: COLORS.ink,
    padding: 0,
  },
  swapButton: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -14,
    backgroundColor: COLORS.surfaceSunken,
    borderRadius: 11,
    padding: 7,
    zIndex: 5,
  },
  // ✅ NEW: Options Styles
  optionsContainer: {
    marginTop: 20,
    backgroundColor: COLORS.canvas,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 14,
    textAlign: 'center',
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenMuted,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
  },
  optionTitleSelected: {
    color: COLORS.green,
  },
  optionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  checkmark: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  // ✅ SEARCH BUTTON
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 8,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  // ✅ Suggestions Sheet
  suggestionsSheet: {
    flex: 1,
    marginTop: 14,
    backgroundColor: COLORS.bg,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  suggestionsHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink,
  },
  suggestionSecondary: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: COLORS.hairline,
    marginLeft: 46,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textMuted,
  },
});

export default LocationInputScreen;