import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useTheme } from '../../contexts/theme/ThemeContext'; // Adjust path as needed

// React Native Vector Icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  ProductDetail: {
    productId: string;
  };
  ProductDetailInfo: {
    productId?: string;
    id?: string;
  };
};

// ============= UPDATED INTERFACES FOR NEW DATA STRUCTURE =============

interface VariantFields {
  [key: string]: string;
}

interface Variant {
  fields?: VariantFields;
  combinationKey?: string;
  mrp?: number;
  price?: number;
  savedAmount?: number;
  discount?: number;
  offerText?: string;
  finalPrice?: number;
  weight?: string;
  height?: string;
  width?: string;
  length?: string;
  inStock?: boolean;
  quantityAvailable?: number;
  sku?: string;
  images?: string[];
  video?: string;
  isDefault?: boolean;
  variantId?: string;
}

interface Product {
  _id: string;
  title: string;
  brand: string;
  description: string;
  category: string;
  subcategory: string;
  productId: string;
  mrp: number;
  price: number;
  discount: number;
  offerText: string;
  finalPrice: number;
  weight: string;
  height: string;
  width: string;
  depth: string;
  dimensions: string;
  inStock: boolean;
  quantityAvailable: number | null;
  deliveryTime: string;
  warranty: string;
  returnPolicy: string;
  shortDescription: string;
  fullDescription: string;
  highlights: string[];
  variants?: Variant[];
  variantOptions?: string[];
  variantValues?: Record<string, string[]>;
  sellerLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    googlePlaceId: string;
  };
  specs?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  verified?: boolean;
  protectPromiseFees?: number;
  freeDelivery?: boolean;
  fastDelivery?: boolean;
  safety?: boolean;
  productQuality?: boolean;
  paymentOptions?: boolean;
  manufacturer?: boolean;
  cashOnDelivery?: boolean;
  deliveryVehicleType?: boolean;
  [key: string]: any;
}

interface Review {
  _id: string;
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  rating: number;
  review: string;
  createdAt: string;
  helpful?: number;
  images?: { url: string }[];
}

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  percentage: number;
  distribution: number[];
  totalReviews: number;
}

const RATING_API_BASE = 'http://172.20.10.12:5000/api/rating-review/rating';

const ProductDetailInfo: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark, theme } = useTheme();

  const params = route.params as any;
  const productId = params?.productId || params?.id || null;

  console.log('🔍 ProductDetailInfo - Product ID:', productId);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSpecs, setExpandedSpecs] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    },

    // Header styles
    header: {
      backgroundColor: isDark ? '#1E293B' : '#2E8B57',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 18,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#E2E8F0' : '#FFFFFF',
      letterSpacing: 0.5,
    },

    // Card styles
    productInfoCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 12,
      padding: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    productName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginLeft: 12,
      flex: 1,
      lineHeight: 28,
    },
    metaText: {
      fontSize: 13,
      color: isDark ? '#CBD5E1' : '#6B7280',
      marginLeft: 6,
    },
    brandText: {
      fontSize: 14,
      color: isDark ? '#CBD5E1' : '#4B5563',
      marginLeft: 8,
      fontStyle: 'italic',
    },

    // Stock status
    stockWarning: {
      backgroundColor: '#DC2626',
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 10,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    stockSuccess: {
      backgroundColor: '#10B981',
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 10,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    // Section styles
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    highlightCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 10,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    highlightText: {
      fontSize: 14,
      color: isDark ? '#E2E8F0' : '#374151',
      flex: 1,
      lineHeight: 20,
    },

    // Description cards
    descriptionCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    descriptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#E2E8F0' : '#1F2937',
    },
    descriptionText: {
      fontSize: 14,
      color: isDark ? '#CBD5E1' : '#4B5563',
      lineHeight: 22,
    },
    readMoreText: {
      fontSize: 14,
      color: '#3B82F6',
      fontWeight: '500',
    },

    // Specs card
    specsCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 20,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    specsGroupTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#E2E8F0' : '#374151',
      marginBottom: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    specRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#F3F4F6',
    },
    specLabel: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
      fontWeight: '500',
      flex: 1,
    },
    specValue: {
      fontSize: 14,
      color: isDark ? '#F1F5F9' : '#1F2937',
      fontWeight: '500',
      flex: 2,
      textAlign: 'right',
    },

    // Seller card
    sellerCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 20,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    sellerInfoText: {
      fontSize: 14,
      color: isDark ? '#E2E8F0' : '#374151',
      flex: 1,
      lineHeight: 20,
    },

    // Rating overview
    ratingOverview: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    ratingNumber: {
      fontSize: 48,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    ratingOutOf: {
      fontSize: 24,
      color: isDark ? '#94A3B8' : '#6B7280',
      fontWeight: '500',
    },
    totalRatings: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#6B7280',
    },

    // Review cards
    reviewCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    reviewerName: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 4,
    },
    reviewDate: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#9CA3AF',
    },
    reviewText: {
      fontSize: 14,
      color: isDark ? '#CBD5E1' : '#4B5563',
      lineHeight: 22,
      marginBottom: 12,
    },
    helpfulText: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#6B7280',
    },

    // View all reviews button
    viewAllReviewsButton: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 10,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    viewAllReviewsText: {
      fontSize: 15,
      color: '#2E8B57',
      fontWeight: '600',
    },

    // No reviews card
    noReviewsCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 40,
      alignItems: 'center',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    noReviewsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginTop: 16,
      marginBottom: 8,
    },
    noReviewsText: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
      textAlign: 'center',
    },

    // Additional info
    additionalInfo: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 16,
      borderRadius: 12,
      padding: 20,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    infoText: {
      fontSize: 14,
      color: isDark ? '#E2E8F0' : '#374151',
      flex: 1,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#F3F4F6',
    },

    // Footer
    footer: {
      backgroundColor: isDark ? '#1E293B' : '#1F2937',
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    footerText: {
      fontSize: 10,
      color: isDark ? '#94A3B8' : '#9CA3AF',
    },

    // Modal
    modalContainer: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    },
    modalHeader: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 18,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    modalContent: {
      flex: 1,
      padding: 16,
    },
    modalReviewCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginBottom: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderWrapper: {
      alignItems: 'center',
      padding: 40,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    loadingText: {
      marginTop: 20,
      fontSize: 16,
      color: isDark ? '#E2E8F0' : '#4B5563',
      fontWeight: '500',
    },
    debugText: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#9CA3AF',
      marginTop: 8,
      fontFamily: 'monospace',
    },

    // Error states
    errorContainer: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    },
    errorContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#DC2626',
      marginBottom: 12,
    },
    errorText: {
      fontSize: 16,
      color: isDark ? '#CBD5E1' : '#6B7280',
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
    },
    backButton: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#2E8B57',
      minWidth: 140,
      justifyContent: 'center',
    },
    backButtonText: {
      color: '#2E8B57',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  useEffect(() => {
    if (productId) {
      fetchData();
    } else {
      console.error('❌ Product ID is missing!');
      setError('Product ID is missing. Please go back and try again.');
      setLoading(false);
    }
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!productId) {
        throw new Error('Missing product ID.');
      }

      console.log('📡 Fetching data for product ID:', productId);
      await Promise.all([fetchProduct(), fetchRatingStats(), fetchReviews()]);
    } catch (err: any) {
      console.error('❌ Fetch error:', err.message);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err.message ||
          'Failed to load product details.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper: Filter out variant fields and return clean product data
  const extractProductWithoutVariants = (productData: any): Product => {
    // List of fields that belong to variant, not product
    const variantFields = ['variants', 'variantOptions', 'variantValues'];

    const cleanData: any = {};

    for (const key in productData) {
      if (!variantFields.includes(key)) {
        cleanData[key] = productData[key];
      }
    }

    return cleanData as Product;
  };

  const fetchProduct = async () => {
    try {
      console.log('📡 Fetching product from API with ID:', productId);

      const response = await axios.get(
        `http://172.20.10.12:5000/api/seller/forms/categories/${productId}`,
        { timeout: 10000 },
      );

      console.log('✅ Product API Response received');

      let productData =
        response.data.product || response.data.data || response.data;

      if (response.data.success && response.data.product) {
        productData = response.data.product;
      }

      if (!productData?._id) {
        throw new Error('Invalid product data received from server');
      }

      // Extract product without variant data for this component
      const cleanProduct = extractProductWithoutVariants(productData);

      console.log('✅ Product loaded successfully:', cleanProduct.title);
      console.log('🔍 shortDescription:', cleanProduct.shortDescription);
      console.log('🔍 fullDescription:', cleanProduct.fullDescription);

      setProduct(cleanProduct);
    } catch (err: any) {
      console.error('❌ Product fetch error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      if (err.response?.status === 404) {
        throw new Error('Product not found');
      } else if (err.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection.');
      } else if (err.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`Failed to load product: ${err.message}`);
      }
    }
  };

  const fetchRatingStats = async () => {
    try {
      if (!productId) return;

      console.log('📡 Fetching rating stats for:', productId);
      const response = await axios.get(
        `${RATING_API_BASE}/stats/${productId}`,
        { timeout: 5000 },
      );

      const statsData = response.data.data || response.data;
      setRatingStats({
        totalRatings: statsData.totalRatings || 0,
        averageRating: statsData.averageRating || 0,
        percentage: statsData.percentage || 0,
        distribution: statsData.distribution || [0, 0, 0, 0, 0],
        totalReviews: statsData.totalReviews || 0,
      });
    } catch (error) {
      console.error('⚠️ Error fetching rating stats:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      if (!productId) return;

      console.log('📡 Fetching reviews for:', productId);
      const response = await axios.get(
        `${RATING_API_BASE}/reviews/${productId}?limit=10`,
        { timeout: 5000 },
      );

      const reviewsData =
        response.data.data || response.data.reviews || response.data;
      const reviewsArray = Array.isArray(reviewsData) ? reviewsData : [];
      setReviews(reviewsArray);
    } catch (error) {
      console.error('⚠️ Error fetching reviews:', error);
    }
  };

  const onRefresh = () => {
    console.log('🔄 Refreshing product data...');
    setRefreshing(true);
    fetchData();
  };

  const renderStars = (rating: number, size: number = 16) => {
    const roundedRating = Math.round(rating * 2) / 2;
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => {
          let iconName: string = 'star-border';
          if (star <= Math.floor(roundedRating)) {
            iconName = 'star';
          } else if (
            star === Math.ceil(roundedRating) &&
            roundedRating % 1 !== 0
          ) {
            iconName = 'star-half';
          }

          return (
            <MaterialIcons
              key={star}
              name={iconName}
              size={size}
              color="#FFD700"
            />
          );
        })}
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getProductSpecs = () => {
    if (!product || !product.specs || typeof product.specs !== 'object') {
      return [];
    }

    const specs: Array<{ label: string; value: string }> = [];

    Object.entries(product.specs).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() &&
        String(value) !== 'undefined'
      ) {
        let cleanValue = String(value);
        // Filter out placeholder values like "Rur", "R6r", "R7r", "Gdyd", etc.
        const placeholderPattern = /^[A-Z0-9]{2,4}$/i;
        if (!placeholderPattern.test(cleanValue) && cleanValue.length > 1) {
          specs.push({
            label:
              key.charAt(0).toUpperCase() +
              key.slice(1).replace(/([A-Z])/g, ' $1'),
            value: cleanValue,
          });
        }
      }
    });

    return specs;
  };

  const getGeneralInfo = () => {
    if (!product) return [];

    const generalInfo: Array<{ label: string; value: string }> = [];

    const infoFields = [
      { key: 'weight', label: 'Weight' },
      { key: 'height', label: 'Height' },
      { key: 'width', label: 'Width' },
      { key: 'depth', label: 'Depth' },
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'deliveryTime', label: 'Delivery Time' },
      { key: 'warranty', label: 'Warranty' },
      { key: 'returnPolicy', label: 'Return Policy' },
    ];

    infoFields.forEach(({ key, label }) => {
      const value = product[key];
      if (value && String(value).trim() && String(value) !== 'undefined') {
        generalInfo.push({ label, value: String(value) });
      }
    });

    return generalInfo;
  };

  const getHighlights = (): string[] => {
    if (!product || !product.highlights || !Array.isArray(product.highlights)) {
      return [];
    }
    return product.highlights.filter(
      h => h && String(h).trim() && String(h).length > 1,
    );
  };

  const getSellerInfo = () => {
    if (!product || !product.sellerLocation) return null;

    const { sellerLocation } = product;
    const info = [];

    if (sellerLocation.address) info.push(sellerLocation.address);

    return info.length > 0 ? info.join(', ') : null;
  };

  const getDescriptionText = () => {
    if (!product) return '';

    if (
      product.fullDescription &&
      product.fullDescription.trim() &&
      product.fullDescription.length > 5
    ) {
      return product.fullDescription;
    }

    if (
      product.description &&
      product.description.trim() &&
      product.description.length > 5
    ) {
      return product.description;
    }

    if (
      product.shortDescription &&
      product.shortDescription.trim() &&
      product.shortDescription.length > 5
    ) {
      return product.shortDescription;
    }

    return '';
  };

  const getStockStatus = () => {
    if (!product) return { isInStock: false, message: 'Product not available' };

    if (product.inStock === false) {
      return {
        isInStock: false,
        message: 'Out of Stock',
        reason: 'Product marked as out of stock',
      };
    }

    if (product.quantityAvailable !== null && product.quantityAvailable <= 0) {
      return {
        isInStock: false,
        message: 'Out of Stock',
        reason: 'No units available',
      };
    }

    return {
      isInStock: true,
      message: product.quantityAvailable
        ? `In Stock (${product.quantityAvailable} available)`
        : 'In Stock',
    };
  };

  const getProductFeatures = (): string[] => {
    if (!product) return [];

    const features: string[] = [];

    const booleanFeatures = [
      { key: 'protectPromiseFees', label: 'Protect Promise Coverage' },
      { key: 'freeDelivery', label: 'Free Delivery' },
      { key: 'fastDelivery', label: 'Fast Delivery' },
      { key: 'safety', label: 'Safety Certified' },
      { key: 'productQuality', label: 'Premium Quality Assured' },
      { key: 'paymentOptions', label: 'Multiple Payment Options' },
      { key: 'manufacturer', label: 'Direct from Manufacturer' },
      { key: 'cashOnDelivery', label: 'Cash on Delivery Available' },
    ];

    booleanFeatures.forEach(({ key, label }) => {
      if (product[key] === true) {
        features.push(label);
      }
    });

    return features;
  };

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <View style={dynamicStyles.loaderWrapper}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={dynamicStyles.loadingText}>
            Loading product details...
          </Text>
          <Text style={dynamicStyles.debugText}>
            Product ID: {productId || 'Not provided'}
          </Text>
        </View>
      </View>
    );
  }

  if (error || !productId) {
    return (
      <ScrollView
        style={dynamicStyles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={dynamicStyles.errorContainer}
      >
        <View style={dynamicStyles.errorContent}>
          <View style={styles.errorIconWrapper}>
            <MaterialIcons name="error-outline" size={80} color="#DC2626" />
          </View>
          <Text style={dynamicStyles.errorTitle}>
            Oops! Something went wrong
          </Text>
          <Text style={dynamicStyles.errorText}>
            {error || 'Product ID is missing'}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={20} color="#2E8B57" />
              <Text style={dynamicStyles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!product) {
    return (
      <View style={dynamicStyles.errorContainer}>
        <View style={dynamicStyles.errorContent}>
          <MaterialIcons name="search-off" size={80} color="#DC2626" />
          <Text style={dynamicStyles.errorTitle}>Product Not Found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const stockStatus = getStockStatus();
  const specs = getProductSpecs();
  const generalInfo = getGeneralInfo();
  const highlights = getHighlights();
  const sellerInfo = getSellerInfo();
  const descriptionText = getDescriptionText();
  const features: string[] = getProductFeatures();

  return (
    <ScrollView
      style={dynamicStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 📱 Product Info Card */}
      <View style={dynamicStyles.productInfoCard}>
        <View style={styles.productTitleRow}>
          <MaterialIcons name="inventory" size={22} color="#2E8B57" />
          <Text style={dynamicStyles.productName}>{product.title}</Text>
        </View>

        <View style={styles.productMetaRow}>
          <View style={styles.metaItem}>
            <MaterialIcons name="category" size={16} color="#666" />
            <Text style={dynamicStyles.metaText}>{product.category}</Text>
          </View>
          {product.subcategory && (
            <>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <FontAwesome5 name="layer-group" size={14} color="#666" />
                <Text style={dynamicStyles.metaText}>
                  {product.subcategory}
                </Text>
              </View>
            </>
          )}
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <FontAwesome5 name="tag" size={14} color="#666" />
            <Text style={dynamicStyles.metaText}>ID: {product.productId}</Text>
          </View>
        </View>

        {product.brand && (
          <View style={styles.brandRow}>
            <MaterialIcons name="business" size={18} color="#4B5563" />
            <Text style={dynamicStyles.brandText}>{product.brand}</Text>
          </View>
        )}
      </View>

      {/* ⚠️ Stock Status */}
      {!stockStatus.isInStock ? (
        <View style={dynamicStyles.stockWarning}>
          <MaterialIcons name="error" size={24} color="#FFFFFF" />
          <Text style={styles.stockWarningText}>SOLD OUT</Text>
          <Text style={styles.stockWarningSubtext}>Currently unavailable</Text>
        </View>
      ) : (
        <View style={dynamicStyles.stockSuccess}>
          <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
          <Text style={styles.stockSuccessText}>IN STOCK</Text>
          {product.quantityAvailable && (
            <Text style={styles.stockSuccessSubtext}>
              {product.quantityAvailable} units available
            </Text>
          )}
        </View>
      )}

      {/* ✨ Highlights Section */}
      {highlights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconTitle}>
              <MaterialIcons name="stars" size={22} color="#F59E0B" />
              <Text style={dynamicStyles.sectionTitle}>Key Highlights</Text>
            </View>
          </View>
          <View style={styles.highlightsGrid}>
            {highlights.map((highlight, index) => (
              <View key={index} style={dynamicStyles.highlightCard}>
                <MaterialIcons name="check-circle" size={18} color="#10B981" />
                <Text style={dynamicStyles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 📝 Description Sections */}
      {descriptionText && (
        <View style={styles.descriptionSection}>
          <View style={dynamicStyles.descriptionCard}>
            <View style={styles.descriptionHeader}>
              <MaterialIcons name="article" size={20} color="#3B82F6" />
              <Text style={dynamicStyles.descriptionTitle}>
                Product Description
              </Text>
            </View>
            <Text
              style={dynamicStyles.descriptionText}
              numberOfLines={showFullDescription ? undefined : 4}
            >
              {descriptionText}
            </Text>
            {descriptionText.length > 200 && (
              <TouchableOpacity
                onPress={() => setShowFullDescription(!showFullDescription)}
                style={styles.readMoreButton}
              >
                <Text style={dynamicStyles.readMoreText}>
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </Text>
                <MaterialIcons
                  name={showFullDescription ? 'expand-less' : 'expand-more'}
                  size={20}
                  color="#3B82F6"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* 🎯 Product Features */}
      {features.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconTitle}>
              <MaterialIcons name="verified" size={22} color="#10B981" />
              <Text style={dynamicStyles.sectionTitle}>Product Features</Text>
            </View>
          </View>
          <View style={styles.highlightsGrid}>
            {features.map((feature, index) => (
              <View key={index} style={dynamicStyles.highlightCard}>
                <MaterialIcons name="verified" size={18} color="#10B981" />
                <Text style={dynamicStyles.highlightText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 📊 Specifications Section */}
      {(specs.length > 0 || generalInfo.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconTitle}>
              <MaterialIcons name="settings" size={22} color="#8B5CF6" />
              <Text style={dynamicStyles.sectionTitle}>Specifications</Text>
            </View>
            {specs.length > 5 && (
              <TouchableOpacity
                onPress={() => setExpandedSpecs(!expandedSpecs)}
                style={styles.expandButton}
              >
                <Text style={styles.expandButtonText}>
                  {expandedSpecs ? 'Show Less' : 'Show All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={dynamicStyles.specsCard}>
            {/* General Info */}
            {generalInfo.length > 0 && (
              <View style={styles.specsGroup}>
                <Text style={dynamicStyles.specsGroupTitle}>
                  General Information
                </Text>
                {generalInfo.map((info, index) => (
                  <View key={`gen-${index}`} style={dynamicStyles.specRow}>
                    <Text style={dynamicStyles.specLabel}>{info.label}</Text>
                    <Text style={dynamicStyles.specValue}>{info.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Product Specs */}
            {specs.length > 0 && (
              <View style={styles.specsGroup}>
                <Text style={dynamicStyles.specsGroupTitle}>
                  Technical Specifications
                </Text>
                {specs
                  .slice(0, expandedSpecs ? specs.length : 5)
                  .map((spec, index) => (
                    <View key={`spec-${index}`} style={dynamicStyles.specRow}>
                      <Text style={dynamicStyles.specLabel}>{spec.label}</Text>
                      <Text style={dynamicStyles.specValue}>{spec.value}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>

          {specs.length > 5 && !expandedSpecs && (
            <Text style={styles.moreSpecsHint}>
              + {specs.length - 5} more specifications available
            </Text>
          )}
        </View>
      )}

      {/* 🏪 Seller Information */}
      {sellerInfo && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconTitle}>
              <MaterialIcons name="store" size={22} color="#EF4444" />
              <Text style={dynamicStyles.sectionTitle}>Seller Information</Text>
            </View>
          </View>
          <View style={dynamicStyles.sellerCard}>
            <View style={styles.sellerInfoRow}>
              <MaterialIcons name="location-on" size={20} color="#EF4444" />
              <Text style={dynamicStyles.sellerInfoText}>{sellerInfo}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ⭐ Customer Reviews */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconTitle}>
            <MaterialIcons name="reviews" size={22} color="#F59E0B" />
            <Text style={dynamicStyles.sectionTitle}>Customer Reviews</Text>
          </View>
        </View>

        {ratingStats && ratingStats.totalReviews > 0 ? (
          <>
            {/* Overall Rating */}
            <View style={dynamicStyles.ratingOverview}>
              <View style={styles.ratingScore}>
                <Text style={dynamicStyles.ratingNumber}>
                  {ratingStats.averageRating.toFixed(1)}
                </Text>
                <Text style={dynamicStyles.ratingOutOf}>/5</Text>
              </View>
              <View style={styles.ratingDetails}>
                {renderStars(ratingStats.averageRating, 20)}
                <Text style={dynamicStyles.totalRatings}>
                  Based on {ratingStats.totalReviews} reviews
                </Text>
              </View>
            </View>

            {/* Review Cards */}
            {reviews.length > 0 && (
              <View style={styles.reviewsContainer}>
                {reviews.slice(0, 3).map(review => (
                  <View key={review._id} style={dynamicStyles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerAvatar}>
                          <Text style={styles.avatarText}>
                            {review.userId.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={dynamicStyles.reviewerName}>
                            {review.userId.name}
                          </Text>
                          {renderStars(review.rating, 14)}
                        </View>
                      </View>
                      <Text style={dynamicStyles.reviewDate}>
                        {formatDate(review.createdAt)}
                      </Text>
                    </View>
                    <Text style={dynamicStyles.reviewText}>
                      {review.review}
                    </Text>
                    {review.helpful && review.helpful > 0 && (
                      <View style={styles.helpfulRow}>
                        <MaterialIcons name="thumb-up" size={14} color="#666" />
                        <Text style={dynamicStyles.helpfulText}>
                          {review.helpful} found helpful
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* View All Reviews Button */}
            {ratingStats.totalReviews > 3 && (
              <TouchableOpacity
                style={dynamicStyles.viewAllReviewsButton}
                onPress={() => setShowAllReviews(true)}
              >
                <Text style={dynamicStyles.viewAllReviewsText}>
                  View All {ratingStats.totalReviews} Reviews
                </Text>
                <MaterialIcons name="chevron-right" size={20} color="#2E8B57" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={dynamicStyles.noReviewsCard}>
            <MaterialIcons name="rate-review" size={48} color="#D1D5DB" />
            <Text style={dynamicStyles.noReviewsTitle}>No Reviews Yet</Text>
            <Text style={dynamicStyles.noReviewsText}>
              Be the first to share your experience!
            </Text>
          </View>
        )}
      </View>

      {/* 📦 Additional Info */}
      <View style={dynamicStyles.additionalInfo}>
        {product.deliveryTime && (
          <View style={dynamicStyles.infoRow}>
            <MaterialIcons name="local-shipping" size={20} color="#3B82F6" />
            <Text style={dynamicStyles.infoText}>
              Delivery: {product.deliveryTime}
            </Text>
          </View>
        )}
        {product.warranty && (
          <View style={dynamicStyles.infoRow}>
            <MaterialIcons name="verified" size={20} color="#10B981" />
            <Text style={dynamicStyles.infoText}>
              Warranty: {product.warranty}
            </Text>
          </View>
        )}
        {product.returnPolicy && (
          <View style={dynamicStyles.infoRow}>
            <MaterialIcons name="assignment-return" size={20} color="#8B5CF6" />
            <Text style={dynamicStyles.infoText}>
              Return: {product.returnPolicy}
            </Text>
          </View>
        )}
        {product.mrp && product.finalPrice && (
          <View style={dynamicStyles.infoRow}>
            <MaterialIcons name="currency-rupee" size={20} color="#F59E0B" />
            <Text style={dynamicStyles.infoText}>
              Price: ₹{product.finalPrice}{' '}
              {product.mrp > product.finalPrice && `(MRP: ₹${product.mrp})`}
            </Text>
          </View>
        )}
      </View>

      {/* 📝 Product Meta */}
      <View style={dynamicStyles.footer}>
        <Text style={dynamicStyles.footerText}>
          Added on {formatDate(product.createdAt)}
        </Text>
        {product.verified && (
          <View style={styles.verifiedTag}>
            <MaterialIcons name="verified" size={14} color="#10B981" />
            <Text style={styles.verifiedText}>Verified Product</Text>
          </View>
        )}
      </View>

      {/* 🗣️ All Reviews Modal */}
      <Modal
        visible={showAllReviews}
        animationType="slide"
        onRequestClose={() => setShowAllReviews(false)}
      >
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => setShowAllReviews(false)}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={isDark ? '#F1F5F9' : '#000'}
              />
            </TouchableOpacity>
            <Text style={dynamicStyles.modalTitle}>All Reviews</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={dynamicStyles.modalContent}>
            {reviews.map(review => (
              <View key={review._id} style={dynamicStyles.modalReviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.avatarText}>
                        {review.userId.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={dynamicStyles.reviewerName}>
                        {review.userId.name}
                      </Text>
                      {renderStars(review.rating, 14)}
                    </View>
                  </View>
                  <Text style={dynamicStyles.reviewDate}>
                    {formatDate(review.createdAt)}
                  </Text>
                </View>
                <Text style={dynamicStyles.reviewText}>{review.review}</Text>
                {review.helpful && review.helpful > 0 && (
                  <View style={styles.helpfulRow}>
                    <MaterialIcons name="thumb-up" size={14} color="#666" />
                    <Text style={dynamicStyles.helpfulText}>
                      {review.helpful} found helpful
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Static styles that don't depend on theme
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockWarningText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  stockWarningSubtext: {
    color: '#FECACA',
    fontSize: 14,
    marginLeft: 8,
  },
  stockSuccessText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  stockSuccessSubtext: {
    color: '#A7F3D0',
    fontSize: 14,
    marginLeft: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightsGrid: {
    paddingHorizontal: 16,
    gap: 10,
  },
  descriptionSection: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  specsGroup: {
    marginBottom: 24,
  },
  expandButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
  },
  expandButtonText: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  moreSpecsHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  sellerInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  ratingScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingDetails: {
    alignItems: 'center',
    gap: 8,
  },
  reviewsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E8B57',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpfulRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconWrapper: {
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  retryButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 140,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ProductDetailInfo;
