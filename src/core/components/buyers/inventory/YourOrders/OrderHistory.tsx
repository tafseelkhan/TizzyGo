// screens/YourOrdersScreen.tsx
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
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Icons
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Services & Utils
import {
  orderService,
  Order,
} from '../../../../services/inventory/yourOrders/orderService';
import {
  getFirstProductData,
  getStatusColor,
  getNavigationSource,
  formatOrderDate,
} from '../../../../utils/inventory/yourOrders/orderUtils';

const { width } = Dimensions.get('window');

// Extend the product data type to include image
interface ExtendedProductData {
  title?: string;
  description?: string;
  brand?: string;
  category?: string;
  finalPrice?: number;
  savedAmount?: number;
  image?: string;
}

const YourOrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const fetchOrders = async () => {
    try {
      setError(null);
      const data = await orderService.getUserOrders();
      setOrders(data);
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

  const navigateToOrderSuccessScreen = (
    orderId: string,
    orderStatus: string,
  ) => {
    console.log(`🚀 Navigating with ID: ${orderId}, Status: ${orderStatus}`);

    const source = getNavigationSource(orderStatus);

    navigation.getParent()?.navigate('Order', {
      screen: 'OrderSuccessScreen',
      params: {
        orderId: orderId,
        source: source,
      },
    });
  };

  const stats = orderService.getOrderStats(orders);

  const renderOrderItem = ({ item, index }: { item: Order; index: number }) => {
    const { firstItem, productData, selectedVariant, productFinalPrice } =
      getFirstProductData(item);
    const statusColor = getStatusColor(item.deliveryStatus || item.status);
    const orderDate = formatOrderDate(item.createdAt);

    // Cast productData to extended type
    const extendedProductData = productData as ExtendedProductData;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => {
          if (item._id) {
            navigateToOrderSuccessScreen(item._id, item.status || '');
          } else {
            Alert.alert('Error', 'Order ID not found. Cannot view details.');
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderNumberContainer}>
            <View style={styles.receiptIcon}>
              <MaterialIcons name="receipt" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.orderNumber}>
                {item.orderId || `ORD-${index + 1}`}
              </Text>
              <Text style={styles.orderDate}>
                <Icon name="calendar-outline" size={10} color="#94A3B8" />{' '}
                {orderDate}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '15' },
            ]}
          >
            <MaterialIcons
              name={
                (item.deliveryStatus || 'PENDING') === 'DELIVERED'
                  ? 'check-circle'
                  : (item.deliveryStatus || 'PENDING') === 'CANCELLED'
                    ? 'cancel'
                    : (item.deliveryStatus || 'PENDING') === 'SHIPPED'
                      ? 'local-shipping'
                      : 'pending'
              }
              size={12}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(item.deliveryStatus || 'PENDING').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.productInfo}>
          <View style={styles.productImageContainer}>
            {extendedProductData.image ? (
              <Image
                source={{ uri: extendedProductData.image }}
                style={styles.productImage}
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <MaterialIcons name="inventory" size={24} color="#94A3B8" />
              </View>
            )}
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {extendedProductData.title ||
                extendedProductData.description ||
                'Product'}
            </Text>
            {extendedProductData.brand && (
              <View style={styles.brandContainer}>
                <MaterialIcons name="verified" size={12} color="#007AFF" />
                <Text style={styles.productBrand}>
                  {extendedProductData.brand}
                </Text>
              </View>
            )}
            <View style={styles.productMeta}>
              {extendedProductData.category && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryText}>
                    {extendedProductData.category}
                  </Text>
                </View>
              )}
              <View style={styles.quantityTag}>
                <Feather name="shopping-bag" size={10} color="#64748B" />
                <Text style={styles.productQuantity}>
                  Qty: {firstItem?.quantity || 1}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <MaterialIcons name="payments" size={14} color="#007AFF" />
              </View>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                ₹{productFinalPrice || item.finalAmount || 0}
              </Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailItem}>
              <View
                style={[
                  styles.detailIconContainer,
                  { backgroundColor: '#F0FDF4' },
                ]}
              >
                <MaterialCommunityIcons name="sale" size={14} color="#22C55E" />
              </View>
              <Text style={styles.detailLabel}>Discount</Text>
              <Text style={[styles.detailValue, styles.discountValue]}>
                -₹
                {extendedProductData.savedAmount ||
                  selectedVariant.productSavedAmount ||
                  0}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View
                style={[
                  styles.detailIconContainer,
                  { backgroundColor: '#FEF3C7' },
                ]}
              >
                <Icon name="cube-outline" size={14} color="#F59E0B" />
              </View>
              <Text style={styles.detailLabel}>Variant</Text>
              <Text style={styles.detailValue}>
                {selectedVariant.weight || 'Standard'}
              </Text>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailItem}>
              <View
                style={[
                  styles.detailIconContainer,
                  { backgroundColor: '#EDE9FE' },
                ]}
              >
                <Feather name="truck" size={14} color="#8B5CF6" />
              </View>
              <Text style={styles.detailLabel}>Delivery</Text>
              <Text style={styles.detailValue}>
                ₹{selectedVariant.deliveryCharge || 0}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentIconContainer}>
              <MaterialIcons
                name={
                  item.status === 'succeeded'
                    ? 'check-circle'
                    : 'hourglass-empty'
                }
                size={12}
                color={item.status === 'succeeded' ? '#22C55E' : '#F59E0B'}
              />
            </View>
            <Text
              style={[
                styles.paymentStatus,
                { color: item.status === 'succeeded' ? '#22C55E' : '#F59E0B' },
              ]}
            >
              {item.status === 'succeeded' ? 'Paid' : 'Pending'}
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
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => {
              if (item._id) {
                navigateToOrderSuccessScreen(item._id, item.status || '');
              } else {
                Alert.alert(
                  'Error',
                  'Order ID not found. Cannot view details.',
                );
              }
            }}
          >
            <MaterialIcons name="receipt-long" size={16} color="#FFFFFF" />
            <Text style={styles.primaryActionButtonText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportButton}>
            <Feather name="message-circle" size={16} color="#007AFF" />
            <Text style={styles.supportButtonText}>Help</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.loadingContent}>
          <View style={styles.loadingAnimation}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
          <Text style={styles.loadingTitle}>Loading Your Orders</Text>
          <Text style={styles.loadingSubtitle}>
            Please wait while we fetch your order history
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <MaterialIcons name="shopping-bag" size={22} color="#007AFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>My Orders</Text>
            <Text style={styles.headerSubtitle}>Track & manage purchases</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={checkToken}>
            <Icon name="key-outline" size={18} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={fetchOrders}>
            <Icon name="refresh-outline" size={18} color="#64748B" />
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
          <Text style={[styles.statNumber, styles.deliveredStat]}>
            {stats.delivered}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.activeStat]}>
            {stats.active}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.pendingStat]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <View style={styles.errorIconContainer}>
            <MaterialIcons name="error-outline" size={40} color="#DC2626" />
          </View>
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
            <MaterialIcons name="inventory" size={64} color="#CBD5E1" />
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
              <View>
                <Text style={styles.listHeaderTitle}>Recent Orders</Text>
                <Text style={styles.listHeaderSubtitle}>
                  Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.filterButton}>
                <Feather name="sliders" size={16} color="#007AFF" />
              </TouchableOpacity>
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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  deliveredStat: {
    color: '#22C55E',
  },
  activeStat: {
    color: '#3B82F6',
  },
  pendingStat: {
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: '50%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  listHeaderSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FAFBFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  receiptIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  productInfo: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#0F172A',
    marginBottom: 4,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  productBrand: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
  quantityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productQuantity: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountValue: {
    color: '#22C55E',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFBFC',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  primaryActionButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supportButtonText: {
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
  loadingAnimation: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
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
  errorIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 16,
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
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
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
