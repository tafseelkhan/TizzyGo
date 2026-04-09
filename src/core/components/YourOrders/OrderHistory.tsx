import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// ✅ REPLACED: Using react-native-vector-icons instead of @expo/vector-icons
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.251.121:5000/api';

const YourOrdersScreen = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ NAVIGATION HOOK ADDED
  const navigation = useNavigation<any>();

  // ✅ NAVIGATE TO ORDER SUCCESS SCREEN FUNCTION - UPDATED WITH PAYMENT METHOD LOGIC
  const navigateToOrderSuccessScreen = (
    orderId: string,
    orderStatus: string,
  ) => {
    console.log(
      `🚀 Navigating to OrderSuccessScreen with MongoDB ID: ${orderId}, Status: ${orderStatus}`,
    );

    let source = 'order_history'; // default fallback

    if (orderStatus === 'succeeded') {
      source = 'stripe_payment'; // Online payment via Stripe
    } else if (orderStatus === 'cod_confirmed') {
      source = 'cod'; // Cash on Delivery
    }

    // ✅ CORRECT SYNTAX FOR NESTED NAVIGATION - SAME AS PaymentStep.tsx
    navigation.getParent()?.navigate('Order', {
      screen: 'OrderSuccessScreen',
      params: {
        orderId: orderId,
        source: source, // ✅ Same format as PaymentStep.tsx
      },
    });
  };

  const fetchOrdersFromAPI = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please login first. Token not found.');
      }

      const response = await fetch(`${API_BASE_URL}/orders/yourorder/my`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Server error: ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      console.error('[FINAL ERROR] in fetchOrdersFromAPI:', error);
      throw error;
    }
  };

  const fetchOrders = async () => {
    try {
      setError(null);
      const data = await fetchOrdersFromAPI();

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (data && data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else if (data && data.data && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      Alert.alert(
        'Error',
        err.message ||
          'Could not load orders. Please check your connection and try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      Alert.alert(
        'Token Info',
        token
          ? `Token exists (first 20 chars): ${token.substring(0, 20)}...`
          : 'No token found',
      );
    } catch (error) {
      console.error('Error checking token:', error);
    }
  };

  const renderOrderItem = ({ item, index }: { item: any; index: number }) => {
    const firstItem =
      item.items && item.items.length > 0 ? item.items[0] : null;
    const productData = firstItem?.productData || {};
    const selectedVariant = firstItem?.selectedVariant || {};
    const productFinalPrice =
      productData.finalPrice || selectedVariant.productFinalPrice || 0;

    const statusColor = getStatusColor(item.deliveryStatus || item.status);
    const statusIcon = getStatusIcon(item.deliveryStatus || item.status);

    return (
      <TouchableOpacity style={styles.orderCard} activeOpacity={0.9}>
        <View style={styles.cardHeader}>
          <View style={styles.orderNumberContainer}>
            <MaterialIcons name="receipt" size={16} color="#007AFF" />
            <View>
              <Text style={styles.orderNumber}>
                {item.orderId || `ORD-${index + 1}`}
              </Text>
              <Text style={styles.orderDate}>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Date not available'}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}15` },
            ]}
          >
            {statusIcon}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(item.deliveryStatus || 'PENDING').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <View style={styles.productImagePlaceholder}>
            <MaterialIcons name="inventory" size={20} color="#94A3B8" />
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {productData.title || productData.description || 'Product'}
            </Text>
            {productData.brand && (
              <Text style={styles.productBrand}>{productData.brand}</Text>
            )}
            <View style={styles.productMeta}>
              {productData.category && (
                <Text style={styles.productCategory}>
                  {productData.category}
                </Text>
              )}
              <Text style={styles.productQuantity}>
                Qty: {firstItem?.quantity || 1}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="payments" size={14} color="#64748B" />
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                ₹{productFinalPrice || item.finalAmount || 0}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="sale" size={14} color="#64748B" />
              <Text style={styles.detailLabel}>Discount</Text>
              <Text style={[styles.detailValue, styles.discountValue]}>
                -₹
                {productData.savedAmount ||
                  selectedVariant.productSavedAmount ||
                  0}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="cube-outline" size={14} color="#64748B" />
              <Text style={styles.detailLabel}>Variant</Text>
              <Text style={styles.detailValue}>
                {selectedVariant.weight || 'Standard'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Feather name="truck" size={14} color="#64748B" />
              <Text style={styles.detailLabel}>Delivery</Text>
              <Text style={styles.detailValue}>
                ₹{selectedVariant.deliveryCharge || 0}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.paymentInfo}>
            <Icon name="card-outline" size={14} color="#22C55E" />
            <Text style={styles.paymentStatus}>
              {item.status === 'succeeded' ? 'Paid' : 'Payment Pending'}
            </Text>
          </View>

          <View style={styles.trackingInfo}>
            <Feather name="map-pin" size={12} color="#64748B" />
            <Text style={styles.trackingText}>
              {item.buyerAddress?.address
                ? 'Ready for pickup'
                : 'Delivery info pending'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {/* ✅ VIEW DETAILS BUTTON UPDATED WITH NAVIGATION - PASSING ORDER STATUS */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              if (item._id) {
                // ✅ Pass both order ID and status to determine source
                navigateToOrderSuccessScreen(item._id, item.status);
              } else {
                Alert.alert(
                  'Error',
                  'Order ID not found. Cannot view details.',
                );
              }
            }}
          >
            <MaterialIcons name="receipt-long" size={14} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusIcon = (status: any) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'delivered':
      case 'succeeded':
        return <Icon name="checkmark-circle" size={12} color="#4CAF50" />;
      case 'picked_up':
      case 'shipped':
        return <Feather name="truck" size={12} color="#2196F3" />;
      case 'processing':
      case 'confirmed':
        return <Icon name="time-outline" size={12} color="#FF9800" />;
      case 'cancelled':
      case 'failed':
        return <Icon name="close-circle" size={12} color="#F44336" />;
      default:
        return <Icon name="hourglass-outline" size={12} color="#757575" />;
    }
  };

  const getStatusColor = (status: any) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'delivered':
      case 'succeeded':
        return '#4CAF50';
      case 'picked_up':
      case 'shipped':
        return '#2196F3';
      case 'processing':
      case 'confirmed':
        return '#FF9800';
      case 'cancelled':
      case 'failed':
        return '#F44336';
      case 'pending':
        return '#FFC107';
      default:
        return '#757575';
    }
  };

  const getStats = () => {
    const total = orders.length;
    const delivered = orders.filter(o =>
      ['delivered', 'succeeded'].includes(
        o.deliveryStatus?.toLowerCase() || o.status?.toLowerCase(),
      ),
    ).length;
    const active = orders.filter(o =>
      ['processing', 'confirmed', 'picked_up'].includes(
        o.deliveryStatus?.toLowerCase() || o.status?.toLowerCase(),
      ),
    ).length;
    const pending = orders.filter(o =>
      ['pending'].includes(
        o.deliveryStatus?.toLowerCase() || o.status?.toLowerCase(),
      ),
    ).length;

    return { total, delivered, active, pending };
  };

  const stats = getStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingTitle}>Loading Your Orders</Text>
          <Text style={styles.loadingSubtitle}>
            Please wait while we fetch your order history
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="shopping-bag" size={22} color="#007AFF" />
          <View>
            <Text style={styles.headerTitle}>My Orders</Text>
            <Text style={styles.headerSubtitle}>Track & manage purchases</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={checkToken}>
            <Icon name="key-outline" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={fetchOrders}>
            <Icon name="refresh-outline" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {stats.delivered}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>
            {stats.active}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={32} color="#D32F2F" />
          <Text style={styles.errorTitle}>Unable to Load Orders</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={fetchOrders}
            >
              <Icon name="refresh-outline" size={14} color="white" />
              <Text style={styles.primaryActionText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={checkToken}
            >
              <Text style={styles.secondaryActionText}>Check Token</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {orders.length === 0 && !error && (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <MaterialIcons name="inventory" size={60} color="#E0E0E0" />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start shopping to see your orders here!
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={onRefresh}>
            <Icon name="refresh-outline" size={16} color="white" />
            <Text style={styles.ctaButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {orders.length > 0 && (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item, index) =>
            item._id || item.orderId || `order-${index}-${Date.now()}`
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
              progressBackgroundColor="#FFFFFF"
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Recent Orders</Text>
              <Text style={styles.listHeaderSubtitle}>
                Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: '50%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  listHeaderSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  orderNumber: {
    fontSize: 10,
    fontWeight: '100',
    color: '#1E293B',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '200',
    letterSpacing: 0,
  },
  productInfo: {
    flexDirection: 'row',
    padding: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 18,
  },
  productBrand: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCategory: {
    fontSize: 10,
    color: '#007AFF',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontWeight: '500',
  },
  productQuantity: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  discountValue: {
    color: '#22C55E',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingText: {
    fontSize: 11,
    color: '#64748B',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 30,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 12,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 280,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  secondaryAction: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default YourOrdersScreen;
