// src/components/AddressCouponStep.tsx (Complete Fixed Version)
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
// ✅ FIX: Correct import for MaterialIcons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { AddressCard } from '../../../modules/shop/AddressCard';
import { CouponCard } from '../../../modules/shop/CouponCard';
import { DeliveryInfoCard } from '../../../modules/shop/DeliveryInfoCard';
import { useDeliveryInfo } from '../../../hooks/useDeliveryInfo';
import {
  Product,
  CheckoutData,
  ShippingAddress,
  CalculatedData,
} from '../../../types/ShopTypes';
import MapSelectionModal from './MapSelectionModal';
import MapViewModal from './MapViewModal';
import { isValidCoordinates } from '../../../utils/buyers/shop/validationUtils';

interface AddressCouponStepProps {
  checkoutData: CheckoutData;
  updateCheckoutData: (key: keyof CheckoutData, value: any) => void;
  updateShippingAddress: (
    field: keyof ShippingAddress,
    value: string | number | null,
  ) => void;
  onApplyCoupon: (couponCode: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
  isApplyingCoupon: boolean;
  product: Product | null;
  calculatedData: CalculatedData | null;
  loading: boolean;
  onAddressSelected?: (address: ShippingAddress) => void;
  couponError?: string | null;
  couponSuccess?: string | null;
  clearCouponMessages?: () => void;
  isDark?: boolean;
}

const AddressCouponStep: React.FC<AddressCouponStepProps> = ({
  checkoutData,
  updateCheckoutData,
  updateShippingAddress,
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
  product,
  calculatedData,
  loading,
  onAddressSelected,
  couponError,
  couponSuccess,
  clearCouponMessages,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = contextIsDark;

  const [showSelectLocationModal, setShowSelectLocationModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  const shippingAddress = checkoutData.shippingAddress || {
    address: '',
    latitude: null,
    longitude: null,
    googlePlaceId: '',
  };

  const {
    isFreeDelivery,
    deliveryCharge,
    distance,
    distanceKm,
    shouldShowDeliveryInfo,
    showPaidDeliveryWarning,
  } = useDeliveryInfo({
    product,
    calculatedData,
    shippingAddress,
  });

  const hasCoordinates = isValidCoordinates(
    shippingAddress.latitude,
    shippingAddress.longitude,
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0F172A' : '#ffffff' },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Address Card */}
      <AddressCard
        shippingAddress={shippingAddress}
        updateCheckoutData={updateCheckoutData}
        updateShippingAddress={updateShippingAddress}
        onAddressSelected={onAddressSelected}
        onSelectFromMap={() => setShowSelectLocationModal(true)}
        onViewMap={() => hasCoordinates && setShowMapModal(true)}
      />

      {/* Coupon Card */}
      <CouponCard
        initialCode={checkoutData.couponCode}
        onApplyCoupon={onApplyCoupon}
        onRemoveCoupon={onRemoveCoupon}
        isApplyingCoupon={isApplyingCoupon}
        couponError={couponError}
        couponSuccess={couponSuccess}
        clearCouponMessages={clearCouponMessages}
        calculatedData={calculatedData}
      />

      {/* Delivery Info Card */}
      {shouldShowDeliveryInfo && (
        <DeliveryInfoCard
          isFreeDelivery={isFreeDelivery}
          deliveryCharge={deliveryCharge}
          distance={distance}
          distanceKm={distanceKm}
        />
      )}

      {/* Warning for paid delivery without location */}
      {showPaidDeliveryWarning && (
        <View
          style={[
            styles.warningCard,
            {
              backgroundColor: isDark ? '#2D3748' : '#fff3cd',
              borderColor: isDark ? '#4A5568' : '#ffeaa7',
            },
          ]}
        >
          <View style={styles.warningHeader}>
            <MaterialIcons name="warning" size={18} color="#e74c3c" />
            <Text
              style={[
                styles.warningTitle,
                { color: isDark ? '#F6AD55' : '#856404' },
              ]}
            >
              Address Required
            </Text>
          </View>
          <Text
            style={[
              styles.warningText,
              { color: isDark ? '#FBD38D' : '#856404' },
            ]}
          >
            This product has paid delivery. Please select a delivery address to
            calculate delivery charges.
          </Text>
        </View>
      )}

      {/* Loading Overlay */}
      {(loading || isApplyingCoupon) && (
        <View
          style={[
            styles.loadingCard,
            { backgroundColor: isDark ? '#1E293B' : '#fff' },
          ]}
        >
          <ActivityIndicator size="small" color="#2ecc71" />
          <Text
            style={[styles.loadingText, { color: isDark ? '#CBD5E0' : '#666' }]}
          >
            {isApplyingCoupon
              ? 'Applying coupon...'
              : 'Calculating with backend...'}
          </Text>
        </View>
      )}

      {/* Modals */}
      <MapSelectionModal
        visible={showSelectLocationModal}
        onClose={() => setShowSelectLocationModal(false)}
        shippingAddress={shippingAddress}
        updateCheckoutData={updateCheckoutData}
        updateShippingAddress={updateShippingAddress}
      />

      <MapViewModal
        visible={showMapModal}
        onClose={() => setShowMapModal(false)}
        shippingAddress={shippingAddress}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  warningCard: { marginTop: 16, padding: 14, borderRadius: 10, borderWidth: 1 },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  warningTitle: { fontSize: 14, fontWeight: '600' },
  warningText: { fontSize: 13, lineHeight: 18 },
  loadingCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14 },
});

export default AddressCouponStep;
