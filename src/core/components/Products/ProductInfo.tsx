import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  NavigationProp,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';

// Import your components
import LikeComponent from '../global/LikeGlobal';
import CommentComponent from '../global/CommentGlobal';
import ShareWithStats from '../global/ShareGlobal';
import RatingReviewSystem from '../global/RatingGlobal';
import ProductHighlights from '../Mappings/Icons';
import { useUser } from '../../contexts/auth/UserContext';
import { useTheme } from '../../contexts/theme/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface Variant {
  fields?: Array<{
    [key: string]: any;
    images?: string[];
  }>;
  images?: string[];
  video?: string;
}

// Define navigation param list
type RootStackParamList = {
  Home: undefined;
  ProductDetail: {
    productId: string;
  };
  TizzyChat: {
    userId: string;
    id: string;
  };
};

interface Product {
  _id: string;
  id: string;
  category: string;
  title: string;
  brand: string;
  description: string;
  subcategory: string;
  productId: string;
  mrp: number;
  price: number;
  discount: number;
  offerText: string;
  finalPrice: number;
  variants: Variant[];
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
  sellerLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    googlePlaceId: string;
  };
  specs?: Record<string, any>;
  reviewCount?: number;
  originalPrice?: number;
  stock?: number;
  rating?: number;
  averageRating?: number;
  Discount?: number;
  Offer?: number;
  FinalPrice?: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  protectPromiseFees?: number;
  save?: number;
  [key: string]: any;
}

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  percentage: number;
  distribution: number[];
  totalReviews: number;
}

interface Review {
  userId: {
    _id: string;
    name: string;
    image?: string;
  };
  rating: number;
  review?: string;
  createdAt?: string;
}

// 🎨 Stock Status Component
interface StockStatusProps {
  inStock?: boolean;
  stock?: number;
  quantityAvailable?: number | null;
  isDark: boolean;
}

const StockStatus: React.FC<StockStatusProps> = ({
  inStock,
  stock,
  quantityAvailable,
  isDark,
}) => {
  const availableStock = quantityAvailable || stock;
  const isOutOfStock = inStock === false;

  const styles = StockStatusStyles(isDark);

  if (isOutOfStock) {
    return (
      <View style={[styles.stockBadge, styles.outOfStockBadge]}>
        <Icon name="error-outline" size={14} color="#DC2626" />
        <Text style={styles.outOfStockText}>Out of Stock</Text>
      </View>
    );
  }

  return (
    <View style={[styles.stockBadge, styles.inStockBadge]}>
      <Icon name="check-circle" size={14} color="#10B981" />
      <Text style={styles.inStockText}>In Stock</Text>
      {availableStock && availableStock < 10 && (
        <Text style={styles.lowStockText}> • {availableStock} left</Text>
      )}
    </View>
  );
};

// 🎨 Protect Promise Fees Component
interface ProtectPromiseFeesProps {
  protectPromiseFees?: number;
  isDark: boolean;
}

const ProtectPromiseFees: React.FC<ProtectPromiseFeesProps> = ({
  protectPromiseFees,
  isDark,
}) => {
  const [showModal, setShowModal] = useState(false);
  const styles = ProtectPromiseStyles(isDark);

  const shouldDisplay = () => {
    if (protectPromiseFees === undefined || protectPromiseFees === null) {
      return false;
    }
    return protectPromiseFees > 0;
  };

  if (!shouldDisplay()) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={styles.protectPromiseContainer}
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.protectPromiseIcon}>
          <Icon name="security" size={20} color="#10B981" />
        </View>
        <View style={styles.protectPromiseContent}>
          <Text style={styles.protectPromiseTitle}>Protect Promise</Text>
          <Text style={styles.protectPromiseDescription}>
            Extra protection for your purchase
          </Text>
        </View>
        <View style={styles.protectPromiseRight}>
          <Text style={styles.protectPromiseValue}>₹{protectPromiseFees}</Text>
          <Icon name="info-outline" size={18} color="#6B7280" />
        </View>
      </TouchableOpacity>

      {/* Protect Promise Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.protectModalOverlay}>
          <View style={styles.protectModalContent}>
            <View style={styles.protectModalHeader}>
              <View style={styles.protectModalTitleContainer}>
                <Icon name="security" size={24} color="#10B981" />
                <Text style={styles.protectModalTitle}>Protect Promise</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.protectModalCloseButton}
              >
                <Icon
                  name="close"
                  size={24}
                  color={isDark ? '#CBD5E1' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.protectModalScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.protectModalImageContainer}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  }}
                  style={styles.protectModalImage}
                  resizeMode="cover"
                />
                <View style={styles.protectModalImageOverlay}>
                  <Icon name="security" size={48} color="#FFFFFF" />
                  <Text style={styles.protectModalImageTitle}>
                    Extra Protection
                  </Text>
                  <Text style={styles.protectModalImageSubtitle}>
                    For Your Peace of Mind
                  </Text>
                </View>
              </View>

              <View style={styles.protectFeesDisplay}>
                <Text style={styles.protectFeesLabel}>
                  Protect Promise Fees:
                </Text>
                <Text style={styles.protectFeesValue}>
                  ₹{protectPromiseFees}
                </Text>
              </View>

              <View style={styles.protectBenefitsContainer}>
                <Text style={styles.protectSectionTitle}>
                  Why Choose Protect Promise?
                </Text>

                <View style={styles.protectBenefitItem}>
                  <View style={styles.protectBenefitIcon}>
                    <Icon name="verified-user" size={22} color="#10B981" />
                  </View>
                  <View style={styles.protectBenefitContent}>
                    <Text style={styles.protectBenefitTitle}>
                      Extended Warranty
                    </Text>
                    <Text style={styles.protectBenefitText}>
                      Get additional warranty coverage beyond the standard
                      period.
                    </Text>
                  </View>
                </View>

                <View style={styles.protectBenefitItem}>
                  <View style={styles.protectBenefitIcon}>
                    <Icon name="policy" size={22} color="#3B82F6" />
                  </View>
                  <View style={styles.protectBenefitContent}>
                    <Text style={styles.protectBenefitTitle}>
                      Accidental Damage Protection
                    </Text>
                    <Text style={styles.protectBenefitText}>
                      Protection against accidental drops, spills, and other
                      mishaps.
                    </Text>
                  </View>
                </View>

                <View style={styles.protectBenefitItem}>
                  <View style={styles.protectBenefitIcon}>
                    <Icon name="support-agent" size={22} color="#8B5CF6" />
                  </View>
                  <View style={styles.protectBenefitContent}>
                    <Text style={styles.protectBenefitTitle}>
                      Priority Support
                    </Text>
                    <Text style={styles.protectBenefitText}>
                      24/7 dedicated support line for quick assistance.
                    </Text>
                  </View>
                </View>

                <View style={styles.protectBenefitItem}>
                  <View style={styles.protectBenefitIcon}>
                    <Icon name="local-shipping" size={22} color="#F59E0B" />
                  </View>
                  <View style={styles.protectBenefitContent}>
                    <Text style={styles.protectBenefitTitle}>
                      Express Replacement
                    </Text>
                    <Text style={styles.protectBenefitText}>
                      Fast-track replacement service in case of defects.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.protectCoverageContainer}>
                <Text style={styles.protectSectionTitle}>What's Covered</Text>

                <View style={styles.coverageItem}>
                  <Icon name="check-circle" size={18} color="#10B981" />
                  <Text style={styles.coverageText}>Manufacturing defects</Text>
                </View>

                <View style={styles.coverageItem}>
                  <Icon name="check-circle" size={18} color="#10B981" />
                  <Text style={styles.coverageText}>Accidental damage</Text>
                </View>

                <View style={styles.coverageItem}>
                  <Icon name="check-circle" size={18} color="#10B981" />
                  <Text style={styles.coverageText}>Battery replacement</Text>
                </View>

                <View style={styles.coverageItem}>
                  <Icon name="check-circle" size={18} color="#10B981" />
                  <Text style={styles.coverageText}>Screen replacement</Text>
                </View>
              </View>

              <View style={styles.protectTermsContainer}>
                <Text style={styles.protectSectionTitle}>
                  Terms & Conditions
                </Text>
                <Text style={styles.protectTermsText}>
                  • Protect Promise is valid for 12 months from date of purchase
                  {'\n'}• Service available in select cities only{'\n'}•
                  Excludes cosmetic damage and normal wear & tear{'\n'}•
                  Original purchase invoice required{'\n'}• Non-transferable to
                  other products
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.protectCloseButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.protectCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// 🎨 Instructions Component
const InstructionsSection = ({ isDark }: { isDark: boolean }) => {
  const styles = InstructionsStyles(isDark);

  return (
    <View style={styles.instructionsContainer}>
      <View style={styles.instructionsHeader}>
        <Icon name="local-shipping" size={24} color="#3B82F6" />
        <View>
          <Text style={styles.instructionsTitle}>Delivery & Safety</Text>
          <Text style={styles.instructionsSubtitle}>Our promises to you</Text>
        </View>
      </View>

      <View style={styles.instructionsGrid}>
        <View style={styles.instructionCard}>
          <View
            style={[styles.instructionIcon, { backgroundColor: '#DCFCE7' }]}
          >
            <Icon name="verified-user" size={22} color="#16A34A" />
          </View>
          <Text style={styles.instructionCardTitle}>Quality Checked</Text>
          <Text style={styles.instructionCardText}>
            Every product undergoes thorough quality checks
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <View
            style={[styles.instructionIcon, { backgroundColor: '#DBEAFE' }]}
          >
            <Icon name="local-shipping" size={22} color="#2563EB" />
          </View>
          <Text style={styles.instructionCardTitle}>Fast Delivery</Text>
          <Text style={styles.instructionCardText}>
            Quick delivery with real-time tracking
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <View
            style={[styles.instructionIcon, { backgroundColor: '#F3E8FF' }]}
          >
            <Icon name="policy" size={22} color="#7C3AED" />
          </View>
          <Text style={styles.instructionCardTitle}>Easy Returns</Text>
          <Text style={styles.instructionCardText}>
            7-day easy return policy
          </Text>
        </View>

        <View style={styles.instructionCard}>
          <View
            style={[styles.instructionIcon, { backgroundColor: '#FEF3C7' }]}
          >
            <Icon name="support-agent" size={22} color="#D97706" />
          </View>
          <Text style={styles.instructionCardTitle}>24/7 Support</Text>
          <Text style={styles.instructionCardText}>
            Our team is always ready to help
          </Text>
        </View>
      </View>
    </View>
  );
};

// 🎨 TizzyChat Button Component
interface TizzyChatButtonProps {
  onChat: () => void;
  isDark: boolean;
}

const TizzyChatButton: React.FC<TizzyChatButtonProps> = ({
  onChat,
  isDark,
}) => {
  const styles = TizzyChatStyles(isDark);

  return (
    <TouchableOpacity
      style={styles.tizzyChatButton}
      onPress={onChat}
      activeOpacity={0.7}
    >
      <View style={styles.tizzyChatButtonContent}>
        <Image
          source={require('../../../assets/images/nex-logo.png')}
          style={styles.tizzyChatLogo}
        />
        <View style={styles.tizzyChatTextContainer}>
          <Text style={styles.tizzyChatTitle}>Message Seller</Text>
          <Text style={styles.tizzyChatSubtitle}>
            Chat directly via TizzyChat
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 🎨 ProductHeader Component
interface ProductHeaderProps {
  title: string;
  brand: string;
  productId: string;
  category?: string;
  subcategory?: string;
  verified: boolean;
  inStock?: boolean;
  quantityAvailable?: number | null;
  isDark: boolean;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({
  title,
  brand,
  productId,
  category,
  subcategory,
  verified,
  inStock,
  quantityAvailable,
  isDark,
}) => {
  const styles = ProductHeaderStyles(isDark);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        {verified && (
          <View style={styles.verifiedContainer}>
            <Icon name="verified" size={14} color="#10B981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        <StockStatus
          inStock={inStock}
          quantityAvailable={quantityAvailable}
          isDark={isDark}
        />
      </View>

      <Text style={styles.productTitle}>{title}</Text>

      <View style={styles.productMeta}>
        {brand && (
          <View style={styles.metaItem}>
            <Icon
              name="business"
              size={14}
              color={isDark ? '#CBD5E1' : '#6B7280'}
            />
            <Text style={styles.brandText}>{brand}</Text>
          </View>
        )}

        <View style={styles.metaItem}>
          <Icon
            name="qr-code-scanner"
            size={14}
            color={isDark ? '#CBD5E1' : '#6B7280'}
          />
          <Text style={styles.productIdText}>ID: {productId}</Text>
        </View>
      </View>
    </View>
  );
};

// 🎨 PriceDisplay Component
interface PriceDisplayProps {
  mrp: number;
  price: number;
  save?: number;
  finalPrice: number;
  discount: number;
  offerText?: string;
  protectPromiseFees?: number;
  inStock?: boolean;
  isDark: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  mrp,
  price,
  save = 0,
  finalPrice,
  discount,
  offerText,
  protectPromiseFees,
  inStock,
  isDark,
}) => {
  const styles = PriceDisplayStyles(isDark);

  const parsedSave = typeof save === 'string' ? parseInt(save, 10) : save;
  const isOutOfStock = inStock === false;

  return (
    <View style={styles.priceContainer}>
      {isOutOfStock && (
        <View style={styles.outOfStockWarning}>
          <Icon name="error-outline" size={18} color="#DC2626" />
          <Text style={styles.outOfStockWarningText}>
            Currently out of stock
          </Text>
        </View>
      )}

      <View style={styles.pricingSection}>
        <View style={styles.priceRow}>
          {discount > 0 && (
            <View style={styles.discountWithArrow}>
              <Ionicons name="arrow-down" size={12} color="#dc2626" />
              <Text style={styles.discountPercent}>{discount}%</Text>
            </View>
          )}

          <Text style={styles.sellingPrice}>
            FinalPrice: ₹{finalPrice.toLocaleString()}
          </Text>

          {price > finalPrice && (
            <Text style={styles.originalPrice}>
              Price: ₹{price.toLocaleString()}
            </Text>
          )}
        </View>
      </View>

      {price > 0 && parsedSave > 0 && (
        <View style={styles.savingsContainer}>
          <Icon name="savings" size={20} color="#059669" />
          <Text style={styles.savingsText}>
            • You-Save ₹{parsedSave.toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.mrpContainer}>
        <Text style={styles.mrpPrice}>• MRP: ₹{mrp.toLocaleString()}</Text>
      </View>

      {offerText && (
        <View style={styles.offerContainer}>
          <Icon name="local-offer" size={14} color="#DC2626" />
          <Text style={styles.offerText}>{offerText}</Text>
        </View>
      )}

      <ProtectPromiseFees
        protectPromiseFees={protectPromiseFees}
        isDark={isDark}
      />
    </View>
  );
};

// 🎨 Rating Section Component
interface RatingSectionProps {
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
  onAvatarClick: () => void;
  onRatingClick: () => void;
  isDark: boolean;
}

const RatingSection: React.FC<RatingSectionProps> = ({
  averageRating,
  reviewCount,
  reviews,
  onAvatarClick,
  onRatingClick,
  isDark,
}) => {
  const styles = RatingSectionStyles(isDark);

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Icon
            key={star}
            name={star <= Math.floor(rating) ? 'star' : 'star-border'}
            size={size}
            color={star <= Math.floor(rating) ? '#FFB800' : '#E5E7EB'}
          />
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.ratingContainer}
      onPress={onRatingClick}
      activeOpacity={0.7}
    >
      <View style={styles.ratingContent}>
        <View style={styles.ratingLeft}>
          <View style={styles.ratingScore}>
            <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
            <Text style={styles.ratingOutOf}>/5</Text>
          </View>
          {renderStars(averageRating, 20)}
        </View>

        <View style={styles.ratingRight}>
          <Text style={styles.reviewCountText}>{reviewCount} reviews</Text>
          <Icon
            name="chevron-right"
            size={20}
            color={isDark ? '#94A3B8' : '#9CA3AF'}
          />
        </View>
      </View>

      {reviews.length > 0 && (
        <TouchableOpacity
          style={styles.avatarGroup}
          onPress={onAvatarClick}
          activeOpacity={0.7}
        >
          <View style={styles.avatarsContainer}>
            {reviews.slice(0, 4).map((review, index) => (
              <View
                key={index}
                style={[styles.avatar, { marginLeft: index > 0 ? -8 : 0 }]}
              >
                <Icon name="person" size={16} color="#FFFFFF" />
              </View>
            ))}
            {reviews.length > 4 && (
              <View style={[styles.avatar, { marginLeft: -8 }]}>
                <Text style={styles.moreCount}>+{reviews.length - 4}</Text>
              </View>
            )}
          </View>
          <Text style={styles.verifiedBuyersText}>Verified buyers</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// 🎨 Action Buttons Section
interface ActionButtonsProps {
  productId: string;
  category?: string;
  currentUserId: string;
  productTitle: string;
  inStock?: boolean;
  onChat: () => void;
  isDark: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  productId,
  category,
  currentUserId,
  productTitle,
  inStock,
  onChat,
  isDark,
}) => {
  const styles = ActionButtonsStyles(isDark);
  const canInteract = inStock === true;

  return (
    <View style={styles.actionsContainer}>
      <TizzyChatButton onChat={onChat} isDark={isDark} />

      <View style={styles.actionsRow}>
        <View style={styles.actionItem}>
          <LikeComponent productId={productId} />
          <Text style={styles.actionLabel}>Like</Text>
        </View>

        <View style={styles.actionItem}>
          <CommentComponent productId={productId} />
          <Text style={styles.actionLabel}>Comment</Text>
        </View>

        <View style={styles.actionItem}>
          <ShareWithStats
            productId={productId}
            productTitle={productTitle}
            category={category || ''}
          />
          <Text style={styles.actionLabel}>Share</Text>
        </View>
      </View>

      {!canInteract && (
        <View style={styles.outOfStockMessage}>
          <Icon name="error-outline" size={18} color="#DC2626" />
          <Text style={styles.outOfStockMessageText}>
            This product is temporarily unavailable
          </Text>
        </View>
      )}
    </View>
  );
};

// 🎨 MAIN ProductInfo Component
const ProductInfo: React.FC<any> = props => {
  const {
    category,
    id: propId,
    variantName,
    currentPrice,
    originalPrice,
    discount,
    stock: propStock,
    inStock: propInStock,
  } = props;

  const { user } = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { isDark, theme } = useTheme();

  const params = (route.params as { productId?: string }) || {};
  const productId = params.productId || propId || null;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserId = user?._id ?? '';

  const dynamicStyles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    },
    scrollContent: {
      paddingBottom: 24,
    },
    contentContainer: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContent: {
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? '#E2E8F0' : '#6B7280',
      marginTop: 16,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContent: {
      alignItems: 'center',
      padding: 32,
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 16,
      color: isDark ? '#CBD5E1' : '#6B7280',
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    retryButton: {
      backgroundColor: '#2E8B57',
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 8,
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
    highlightsContainer: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    highlightsList: {
      gap: 12,
    },
    highlightItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    highlightText: {
      fontSize: 14,
      color: isDark ? '#E2E8F0' : '#4B5563',
      flex: 1,
      lineHeight: 20,
    },
    descriptionContainer: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    descriptionText: {
      fontSize: 15,
      color: isDark ? '#CBD5E1' : '#6B7280',
      lineHeight: 24,
    },
    highlightsIconsContainer: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    ratingSystemContainer: {
      marginBottom: 24,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    },
    modalContent: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    modalBackButton: {
      padding: 8,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
      flex: 1,
      textAlign: 'center',
    },
    modalScroll: {
      flex: 1,
      padding: 16,
    },
  });

  const getDisplayInStock = (): boolean => {
    if (propInStock !== undefined) {
      return propInStock;
    }

    if (product?.inStock !== undefined) {
      return product.inStock;
    }

    const availableStock =
      product?.quantityAvailable || propStock || product?.stock;
    if (availableStock !== undefined && availableStock !== null) {
      return availableStock > 0;
    }

    return false;
  };

  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!productId) {
        throw new Error('Product ID is required');
      }

      const response = await axios.get(
        `http://192.168.251.121:5000/api/seller/forms/categories/${productId}`,
        {
          timeout: 10000,
        },
      );

      if (response.data.success && response.data.product) {
        const productData: Product = {
          ...response.data.product,
          id: response.data.product._id,
        };
        setProduct(productData);
      } else {
        throw new Error('Invalid product data received');
      }
    } catch (err: any) {
      console.error('❌ Product fetch error:', err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Failed to load product details',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRatingStats = async () => {
    if (!productId) return;

    try {
      const response = await axios.get(
        `http://192.168.251.121:5000/api/rating-review/rating/stats/${productId}`,
        { timeout: 5000 },
      );

      if (response.data.success) {
        setRatingStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching rating stats:', err);
    }
  };

  const fetchReviews = async () => {
    if (!productId) return;

    try {
      const response = await axios.get(
        `http://192.168.251.121:5000/api/rating-review/rating/reviews/${productId}?limit=6`,
        { timeout: 5000 },
      );

      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    }
  };

  const handleTizzyChatNavigation = () => {
    if (!currentUserId) {
      Alert.alert(
        'Login Required',
        'Please login to start messaging with the seller',
      );
      return;
    }

    navigation.navigate('TizzyChat', {
      userId: currentUserId,
      id: productId,
    });
  };

  useEffect(() => {
    if (productId) {
      fetchProductData();
      fetchRatingStats();
      fetchReviews();
    } else {
      setError('Product ID is missing');
      setLoading(false);
    }
  }, [productId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProductData();
    fetchRatingStats();
    fetchReviews();
  };

  const handleAvatarGroupClick = () => setShowRatingModal(true);
  const handleRatingClick = () => setShowRatingModal(true);

  const averageRating =
    ratingStats?.averageRating || product?.averageRating || 0;
  const reviewCount = ratingStats?.totalReviews || product?.reviewCount || 0;
  const displayInStock = getDisplayInStock();

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.loadingContainer}>
        <View style={dynamicStyles.loadingContent}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={dynamicStyles.loadingText}>
            Loading product details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={dynamicStyles.errorContainer}>
        <View style={dynamicStyles.errorContent}>
          <Icon name="error-outline" size={64} color="#DC2626" />
          <Text style={dynamicStyles.errorTitle}>Oops!</Text>
          <Text style={dynamicStyles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={dynamicStyles.retryButton}
            onPress={fetchProductData}
          >
            <Text style={dynamicStyles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={dynamicStyles.errorContainer}>
        <View style={dynamicStyles.errorContent}>
          <Icon name="search-off" size={64} color="#9CA3AF" />
          <Text style={dynamicStyles.errorTitle}>Product Not Found</Text>
          <TouchableOpacity
            style={dynamicStyles.retryButton}
            onPress={fetchProductData}
          >
            <Text style={dynamicStyles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.mainContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={dynamicStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.contentContainer}>
          <ProductHeader
            title={product.title}
            brand={product.brand}
            productId={product.productId}
            category={product.category}
            verified={product.verified}
            inStock={displayInStock}
            quantityAvailable={product.quantityAvailable}
            isDark={isDark}
          />

          <PriceDisplay
            mrp={product.mrp}
            price={product.price}
            save={product.save}
            finalPrice={product.finalPrice}
            discount={product.discount}
            offerText={product.offerText}
            protectPromiseFees={product.protectPromiseFees}
            inStock={displayInStock}
            isDark={isDark}
          />

          {product.highlights && product.highlights.length > 0 && (
            <View style={dynamicStyles.highlightsContainer}>
              <View style={dynamicStyles.sectionHeader}>
                <Icon name="stars" size={24} color="#F59E0B" />
                <Text style={dynamicStyles.sectionTitle}>Key Highlights</Text>
              </View>
              <View style={dynamicStyles.highlightsList}>
                {product.highlights.map((highlight, index) => (
                  <View key={index} style={dynamicStyles.highlightItem}>
                    <Icon name="check-circle" size={18} color="#10B981" />
                    <Text style={dynamicStyles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(product.description ||
            product.fullDescription ||
            product.shortDescription) && (
            <View style={dynamicStyles.descriptionContainer}>
              <View style={dynamicStyles.sectionHeader}>
                <Icon name="description" size={24} color="#3B82F6" />
                <Text style={dynamicStyles.sectionTitle}>Description</Text>
              </View>
              <Text style={dynamicStyles.descriptionText}>
                {product.fullDescription ||
                  product.description ||
                  product.shortDescription}
              </Text>
            </View>
          )}

          <RatingSection
            averageRating={averageRating}
            reviewCount={reviewCount}
            reviews={reviews}
            onAvatarClick={handleAvatarGroupClick}
            onRatingClick={handleRatingClick}
            isDark={isDark}
          />

          <View style={dynamicStyles.highlightsIconsContainer}>
            <View style={dynamicStyles.sectionHeader}>
              <Icon name="bolt" size={24} color="#8B5CF6" />
              <Text style={dynamicStyles.sectionTitle}>Features</Text>
            </View>
            <ProductHighlights productId={product.id} />
          </View>

          <ActionButtons
            productId={product.id}
            category={product.category}
            currentUserId={currentUserId}
            productTitle={product.title}
            inStock={displayInStock}
            onChat={handleTizzyChatNavigation}
            isDark={isDark}
          />

          <InstructionsSection isDark={isDark} />

          <View style={dynamicStyles.ratingSystemContainer}>
            <View style={dynamicStyles.sectionHeader}>
              <Icon name="rate-review" size={24} color="#EC4899" />
              <Text style={dynamicStyles.sectionTitle}>Write a Review</Text>
            </View>
            <RatingReviewSystem
              productId={product.id}
              onRatingSubmit={async (rating: number, review: string) => {
                console.log('Submit review:', rating, review);
              }}
              initialRating={0}
              initialReview=""
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <SafeAreaView style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <TouchableOpacity
                style={dynamicStyles.modalBackButton}
                onPress={() => setShowRatingModal(false)}
              >
                <Icon
                  name="arrow-back"
                  size={24}
                  color={isDark ? '#F1F5F9' : '#1F2937'}
                />
              </TouchableOpacity>
              <Text style={dynamicStyles.modalTitle}>Customer Reviews</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={dynamicStyles.modalScroll}>
              <RatingReviewSystem
                productId={product.id}
                onRatingSubmit={async (rating: number, review: string) => {
                  console.log('Submit review:', rating, review);
                }}
                initialRating={0}
                initialReview=""
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// =============== STYLE FUNCTIONS ===============

const StockStatusStyles = (isDark: boolean) =>
  StyleSheet.create({
    stockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    inStockBadge: {
      backgroundColor: '#D1FAE5',
    },
    outOfStockBadge: {
      backgroundColor: '#FEE2E2',
    },
    inStockText: {
      fontSize: 12,
      color: '#059669',
      fontWeight: '600',
    },
    outOfStockText: {
      fontSize: 12,
      color: '#DC2626',
      fontWeight: '600',
    },
    lowStockText: {
      fontSize: 11,
      color: '#D97706',
      fontWeight: '500',
    },
  });

const ProtectPromiseStyles = (isDark: boolean) =>
  StyleSheet.create({
    protectPromiseContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#F0F9FF',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E0F2FE',
    },
    protectPromiseIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: '#10B981',
    },
    protectPromiseContent: {
      flex: 1,
    },
    protectPromiseTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#E2E8F0' : '#1E40AF',
      marginBottom: 2,
    },
    protectPromiseDescription: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#6B7280',
    },
    protectPromiseRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    protectPromiseValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#059669',
    },
    protectModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    protectModalContent: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
    },
    protectModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    protectModalTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    protectModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    protectModalCloseButton: {
      padding: 4,
    },
    protectModalScroll: {
      padding: 20,
    },
    protectModalImageContainer: {
      height: 180,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
      position: 'relative',
    },
    protectModalImage: {
      width: '100%',
      height: '100%',
    },
    protectModalImageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 20,
    },
    protectModalImageTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 12,
    },
    protectModalImageSubtitle: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    protectFeesDisplay: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#F0F9FF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E0F2FE',
    },
    protectFeesLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#E2E8F0' : '#1E40AF',
    },
    protectFeesValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#059669',
    },
    protectBenefitsContainer: {
      marginBottom: 20,
    },
    protectSectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 16,
    },
    protectBenefitItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    protectBenefitIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#0F172A' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    protectBenefitContent: {
      flex: 1,
    },
    protectBenefitTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#E2E8F0' : '#374151',
      marginBottom: 4,
    },
    protectBenefitText: {
      fontSize: 14,
      color: isDark ? '#CBD5E1' : '#6B7280',
      lineHeight: 20,
    },
    protectCoverageContainer: {
      marginBottom: 20,
    },
    coverageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    coverageText: {
      fontSize: 14,
      color: isDark ? '#E2E8F0' : '#374151',
      marginLeft: 8,
    },
    protectTermsContainer: {
      marginBottom: 20,
    },
    protectTermsText: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
      lineHeight: 20,
    },
    protectCloseButton: {
      backgroundColor: '#2E8B57',
      margin: 20,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    protectCloseButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

const InstructionsStyles = (isDark: boolean) =>
  StyleSheet.create({
    instructionsContainer: {
      marginBottom: 24,
      padding: 20,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    instructionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    instructionsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    instructionsSubtitle: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
    },
    instructionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    instructionCard: {
      width: (screenWidth - 60) / 2,
      backgroundColor: isDark ? '#0F172A' : '#ffffffff',
      padding: 12,
      justifyContent: 'center',
      left: 65,
      alignItems: 'center',
    },
    instructionIcon: {
      width: 38,
      height: 38,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 5,
    },
    instructionCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 4,
      textAlign: 'center',
    },
    instructionCardText: {
      fontSize: 10,
      color: isDark ? '#94A3B8' : '#6B7280',
      textAlign: 'center',
      lineHeight: 10,
    },
  });

const TizzyChatStyles = (isDark: boolean) =>
  StyleSheet.create({
    tizzyChatButton: {
      backgroundColor: isDark ? '#1E293B' : '#ffffffff',
      borderRadius: 12,
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    tizzyChatButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    tizzyChatLogo: {
      width: 40,
      height: 40,
      borderRadius: 8,
      marginRight: 12,
    },
    tizzyChatTextContainer: {
      flex: 1,
    },
    tizzyChatTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#000000ff',
      marginBottom: 2,
    },
    tizzyChatSubtitle: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : 'rgba(0, 0, 0, 0.9)',
    },
  });

const ProductHeaderStyles = (isDark: boolean) =>
  StyleSheet.create({
    headerContainer: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    verifiedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#D1FAE5',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    verifiedText: {
      fontSize: 12,
      color: '#059669',
      fontWeight: '600',
    },
    productTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
      lineHeight: 32,
      marginBottom: 12,
    },
    productMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    brandText: {
      fontSize: 14,
      color: isDark ? '#E2E8F0' : '#4B5563',
      fontWeight: '500',
    },
    productIdText: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
    },
  });

const PriceDisplayStyles = (isDark: boolean) =>
  StyleSheet.create({
    priceContainer: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    outOfStockWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF2F2',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    outOfStockWarningText: {
      fontSize: 14,
      color: '#DC2626',
      fontWeight: '600',
      flex: 1,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    pricingSection: {
      marginBottom: 6,
    },
    discountWithArrow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#ffffffff',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 3,
      marginRight: 6,
    },
    sellingPrice: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#000000',
      marginRight: 6,
    },
    originalPrice: {
      fontSize: 11,
      color: isDark ? '#94A3B8' : '#9ca3af',
      textDecorationLine: 'line-through',
      fontWeight: '500',
    },
    discountPercent: {
      fontSize: 11,
      fontWeight: '700',
      color: '#dc2626',
      marginLeft: 2,
    },
    mrpContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    mrpPrice: {
      fontSize: 14,
      color: '#003ca5ff',
      textDecorationLine: 'line-through',
    },
    savingsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    savingsText: {
      fontSize: 14,
      color: '#059669',
      fontWeight: '600',
    },
    offerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
    },
    offerText: {
      fontSize: 14,
      color: '#DC2626',
      fontWeight: '500',
    },
  });

const RatingSectionStyles = (isDark: boolean) =>
  StyleSheet.create({
    ratingContainer: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    ratingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    ratingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    ratingScore: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    ratingNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    ratingOutOf: {
      fontSize: 18,
      color: isDark ? '#94A3B8' : '#9CA3AF',
      fontWeight: '500',
    },
    starsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    ratingRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    reviewCountText: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
      fontWeight: '500',
    },
    avatarGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    avatarsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#2E8B57',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    moreCount: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    verifiedBuyersText: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
      fontWeight: '500',
    },
  });

const ActionButtonsStyles = (isDark: boolean) =>
  StyleSheet.create({
    actionsContainer: {
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginTop: 12,
    },
    actionItem: {
      alignItems: 'center',
    },
    actionLabel: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#565959',
      marginTop: 4,
    },
    outOfStockMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FEF2F2',
      padding: 16,
      borderRadius: 8,
      marginTop: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: '#FECACA',
    },
    outOfStockMessageText: {
      fontSize: 14,
      color: '#DC2626',
      fontWeight: '500',
    },
  });

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});

export default ProductInfo;   