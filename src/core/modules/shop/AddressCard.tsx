// src/components/AddressCard.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { useAddressSearch } from '../../hooks/useAddressSearch';
import { ShippingAddress, CheckoutData } from '../../types/ShopTypes';
import { isValidCoordinates } from '../../utils/shop/validationUtils';
import {
  formatCoordinate,
  truncateText,
} from '../../utils/shop/formatterUtils';
import { getAddressDisplayText } from '../../utils/shop/addressUtils';

const { height } = Dimensions.get('window');

interface AddressCardProps {
  shippingAddress: ShippingAddress;
  updateCheckoutData?: (key: keyof CheckoutData, value: any) => void;
  updateShippingAddress?: (field: keyof ShippingAddress, value: any) => void;
  onAddressSelected?: (address: ShippingAddress) => void;
  onSelectFromMap: () => void;
  onViewMap: () => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  shippingAddress,
  updateCheckoutData,
  updateShippingAddress,
  onAddressSelected,
  onSelectFromMap,
  onViewMap,
}) => {
  const { isDark } = useTheme();
  const searchInputRef = useRef<TextInput>(null);

  const {
    searchQuery,
    searchResults,
    isSearching,
    showResultsModal,
    setShowResultsModal,
    handleSearchChange,
    selectAddress,
    clearSearch,
  } = useAddressSearch({
    onAddressSelected,
    updateCheckoutData,
    updateShippingAddress,
  });

  const hasCoordinates = isValidCoordinates(
    shippingAddress.latitude,
    shippingAddress.longitude,
  );

  const renderAddressResult = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.resultItem,
        { borderBottomColor: isDark ? '#4A5568' : '#f5f5f5' },
      ]}
      onPress={() => selectAddress(item.place_id, item.description)}
    >
      <View
        style={[
          styles.resultIconContainer,
          { backgroundColor: isDark ? '#2D3748' : '#e8f0fe' },
        ]}
      >
        <MaterialIcons name="place" size={18} color="#4285F4" />
      </View>
      <View style={styles.resultTextContainer}>
        <Text
          style={[
            styles.resultPrimaryText,
            { color: isDark ? '#F1F5F9' : '#333' },
          ]}
        >
          {item.structured_formatting?.main_text ||
            item.description.split(',')[0]}
        </Text>
        <Text
          style={[
            styles.resultSecondaryText,
            { color: isDark ? '#CBD5E0' : '#666' },
          ]}
          numberOfLines={1}
        >
          {item.structured_formatting?.secondary_text || item.description}
        </Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={20}
        color={isDark ? '#CBD5E0' : '#95a5a6'}
      />
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <MaterialIcons name="location-on" size={20} color="#4285F4" />
          <Text
            style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#333' }]}
          >
            Shipping Address
          </Text>
        </View>
        {shippingAddress.address && (
          <TouchableOpacity
            onPress={clearSearch}
            style={styles.clearButtonContainer}
          >
            <MaterialIcons name="close" size={18} color="#e74c3c" />
            <Text
              style={[
                styles.clearButton,
                { color: isDark ? '#FC8181' : '#e74c3c' },
              ]}
            >
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: isDark ? '#CBD5E0' : '#555' }]}>
          Search Your Address *
        </Text>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <MaterialIcons
            name="search"
            size={20}
            color="#95a5a6"
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={[
              styles.searchInput,
              {
                borderColor: isDark ? '#4A5568' : '#ddd',
                backgroundColor: isDark ? '#2D3748' : '#fff',
                color: isDark ? '#F1F5F9' : '#333',
              },
            ]}
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Enter your address, city, pincode..."
            placeholderTextColor={isDark ? '#A0AEC0' : '#999'}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {isSearching && (
            <ActivityIndicator
              size="small"
              color="#4285f4"
              style={styles.searchLoader}
            />
          )}
        </View>
        <Text
          style={[
            styles.instructionText,
            { color: isDark ? '#A0AEC0' : '#95a5a6' },
          ]}
        >
          <Feather name="info" size={12} color="#95a5a6" /> Start typing and
          select from suggestions
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.selectLocationButton,
          { backgroundColor: isDark ? '#3182CE' : '#4285F4' },
        ]}
        onPress={onSelectFromMap}
      >
        <View style={styles.selectLocationButtonContent}>
          <MaterialIcons name="map" size={20} color="#fff" />
          <Text style={styles.selectLocationButtonText}>
            Select Location from Map
          </Text>
        </View>
        <Text style={styles.selectLocationButtonSubtext}>
          Tap to pick exact location on map
        </Text>
      </TouchableOpacity>

      {shippingAddress.address && (
        <View
          style={[
            styles.locationCard,
            {
              backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
              borderColor: isDark ? '#4A5568' : '#e0e0e0',
            },
          ]}
        >
          <View style={styles.locationTitleContainer}>
            <MaterialIcons
              name={hasCoordinates ? 'check-circle' : 'warning'}
              size={16}
              color={hasCoordinates ? '#2ecc71' : '#f39c12'}
            />
            <Text
              style={[
                styles.locationTitle,
                { color: isDark ? '#CBD5E0' : '#555' },
              ]}
            >
              {hasCoordinates
                ? 'Selected Address Details'
                : 'Address Selected - Coordinates Pending'}
            </Text>
          </View>

          <View style={styles.addressDisplay}>
            <View style={styles.addressLabelContainer}>
              <MaterialIcons name="home" size={14} color="#666" />
              <Text
                style={[
                  styles.addressLabel,
                  { color: isDark ? '#A0AEC0' : '#777' },
                ]}
              >
                Full Address:
              </Text>
            </View>
            <Text
              style={[
                styles.addressValue,
                { color: isDark ? '#F7FAFC' : '#333' },
              ]}
            >
              {getAddressDisplayText(shippingAddress)}
            </Text>
          </View>

          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateContainer}>
              <View style={styles.coordinateLabelContainer}>
                <MaterialIcons name="my-location" size={14} color="#666" />
                <Text
                  style={[
                    styles.coordinateLabel,
                    { color: isDark ? '#A0AEC0' : '#777' },
                  ]}
                >
                  Latitude
                </Text>
              </View>
              <View
                style={[
                  styles.coordinateValueContainer,
                  {
                    backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
                    borderColor: isDark ? '#4A5568' : '#e0e0e0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.coordinateValue,
                    { color: isDark ? '#F7FAFC' : '#333' },
                  ]}
                >
                  {formatCoordinate(shippingAddress.latitude)}
                </Text>
              </View>
            </View>
            <View style={styles.coordinateContainer}>
              <View style={styles.coordinateLabelContainer}>
                <MaterialIcons name="my-location" size={14} color="#666" />
                <Text
                  style={[
                    styles.coordinateLabel,
                    { color: isDark ? '#A0AEC0' : '#777' },
                  ]}
                >
                  Longitude
                </Text>
              </View>
              <View
                style={[
                  styles.coordinateValueContainer,
                  {
                    backgroundColor: isDark ? '#2D3748' : '#f8f9fa',
                    borderColor: isDark ? '#4A5568' : '#e0e0e0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.coordinateValue,
                    { color: isDark ? '#F7FAFC' : '#333' },
                  ]}
                >
                  {formatCoordinate(shippingAddress.longitude)}
                </Text>
              </View>
            </View>
          </View>

          {hasCoordinates && (
            <View style={styles.mapActionsContainer}>
              <TouchableOpacity
                style={[
                  styles.mapPreview,
                  { backgroundColor: isDark ? '#2A4365' : '#4a90e2' },
                ]}
                onPress={onViewMap}
                activeOpacity={0.7}
              >
                <View style={styles.mapPreviewOverlay}>
                  <MaterialIcons name="map" size={24} color="#fff" />
                  <Text style={styles.mapPreviewText}>View on Map</Text>
                </View>
                <View
                  style={[
                    styles.mapCoordinatesPreview,
                    { backgroundColor: 'rgba(0,0,0,0.7)' },
                  ]}
                >
                  <Text style={styles.mapCoordinatesText}>
                    {shippingAddress.latitude!.toFixed(6)},{' '}
                    {shippingAddress.longitude!.toFixed(6)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <Modal
        visible={showResultsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowResultsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? '#1E293B' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDark ? '#F1F5F9' : '#333' },
                ]}
              >
                Select Address
              </Text>
              <TouchableOpacity
                onPress={() => setShowResultsModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.resultsCountContainer,
                { backgroundColor: isDark ? '#2D3748' : '#f8f9fa' },
              ]}
            >
              <Text
                style={[
                  styles.resultsCountText,
                  { color: isDark ? '#A0AEC0' : '#666' },
                ]}
              >
                {searchResults.length} address
                {searchResults.length !== 1 ? 'es' : ''} found
              </Text>
            </View>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderAddressResult}
                keyExtractor={item => item.place_id}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={50} color="#ddd" />
                <Text
                  style={[
                    styles.noResultsText,
                    { color: isDark ? '#A0AEC0' : '#999' },
                  ]}
                >
                  No addresses found
                </Text>
                <Text
                  style={[
                    styles.noResultsSubtext,
                    { color: isDark ? '#718096' : '#bbb' },
                  ]}
                >
                  Try different keywords
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  clearButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  clearButton: { fontSize: 14, fontWeight: '500' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 15,
  },
  searchLoader: { position: 'absolute', right: 12 },
  instructionText: {
    fontSize: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectLocationButton: {
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectLocationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  selectLocationButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  selectLocationButtonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
  },
  locationCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  locationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  locationTitle: { fontSize: 14, fontWeight: '600' },
  addressDisplay: { marginBottom: 12 },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  addressLabel: { fontSize: 12, fontWeight: '500' },
  addressValue: { fontSize: 14, lineHeight: 20 },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  coordinateContainer: { flex: 1 },
  coordinateLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  coordinateLabel: { fontSize: 12, fontWeight: '500' },
  coordinateValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordinateValue: { fontSize: 13, fontFamily: 'monospace' },
  mapActionsContainer: { marginTop: 16 },
  mapPreview: {
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPreviewOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  mapPreviewText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  mapCoordinatesPreview: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapCoordinatesText: { color: '#fff', fontSize: 10, fontFamily: 'monospace' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalCloseButton: { padding: 4 },
  resultsCountContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  resultsCountText: { fontSize: 12, fontWeight: '500' },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  resultIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextContainer: { flex: 1 },
  resultPrimaryText: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  resultSecondaryText: { fontSize: 12, lineHeight: 16 },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: { fontSize: 14 },
});
