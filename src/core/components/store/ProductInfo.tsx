// ProductInfo.tsx - FIXED TYPESCRIPT ERRORS

import React, { useState, useEffect, useCallback } from 'react';
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

// Import your existing services and hooks
import { useProduct } from '../../hooks/useProducts';
import {
  fetchRatingStats,
  fetchReviews,
  RatingStats,
  Review,
} from '../../../api/features/private/getRatingReviewPrivateSlice';

// Import your components
import LikeComponent from '../global/LikeGlobal';
import CommentComponent from '../global/CommentGlobal';
import ShareWithStats from '../global/ShareGlobal';
import RatingReviewSystem from '../global/RatingGlobal';
import ProductHighlights from '../../mapping/Icons';
import { useUser } from '../../contexts/auth/UserContext';
import { useTheme } from '../../contexts/theme/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// ============= INTERFACES =============

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

type RootStackParamList = {
  Home: undefined;
  ProductDetail: { productId: string };
  TizzyChat: { userId: string; id: string };
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
  variantOptions?: string[];
  variantValues?: Record<string, string[]>;
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
  freeDelivery?: boolean;
  fastDelivery?: boolean;
  safety?: boolean;
  productQuality?: boolean;
  paymentOptions?: boolean;
  manufacturer?: boolean;
  cashOnDelivery?: boolean;
  [key: string]: any;
}

// ============= HELPER FUNCTIONS =============

const getVariantDisplayName = (variant: Variant | null): string => {
  if (!variant) return '';
  if (variant.fields && typeof variant.fields === 'object') {
    return Object.entries(variant.fields)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' • ');
  }
  if (variant.combinationKey) {
    return variant.combinationKey.replace(/\|/g, ' • ');
  }
  return '';
};

const getVariantPrice = (variant: Variant | null): number => {
  if (!variant) return 0;
  if (variant.finalPrice) return variant.finalPrice;
  if (variant.price) return variant.price;
  return 0;
};

const getVariantMrp = (variant: Variant | null): number => {
  if (!variant) return 0;
  return variant.mrp || 0;
};

const getVariantDiscount = (variant: Variant | null): number => {
  if (!variant) return 0;
  return variant.discount || 0;
};

const getVariantStock = (variant: Variant | null): number => {
  if (!variant) return 0;
  return variant.quantityAvailable || (variant.inStock ? 1 : 0);
};

const getVariantInStock = (variant: Variant | null): boolean => {
  if (!variant) return false;
  if (variant.inStock !== undefined) return variant.inStock;
  if (variant.quantityAvailable !== undefined && variant.quantityAvailable > 0)
    return true;
  return false;
};

const getVariantSave = (variant: Variant | null): number => {
  if (!variant) return 0;
  if (variant.savedAmount) return variant.savedAmount;
  if (variant.mrp && variant.finalPrice)
    return variant.mrp - variant.finalPrice;
  if (variant.mrp && variant.price) return variant.mrp - variant.price;
  return 0;
};

const filterValidVariants = (variants: any[]): Variant[] => {
  if (!variants || !Array.isArray(variants)) return [];
  return variants.filter(v => v && (v.fields || v.combinationKey || v.sku));
};

// ============= SUB-COMPONENTS =============

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

  if (!shouldDisplay()) return null;

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
                {[
                  {
                    icon: 'verified-user',
                    color: '#10B981',
                    title: 'Extended Warranty',
                    text: 'Get additional warranty coverage beyond the standard period.',
                  },
                  {
                    icon: 'policy',
                    color: '#3B82F6',
                    title: 'Accidental Damage Protection',
                    text: 'Protection against accidental drops, spills, and other mishaps.',
                  },
                  {
                    icon: 'support-agent',
                    color: '#8B5CF6',
                    title: 'Priority Support',
                    text: '24/7 dedicated support line for quick assistance.',
                  },
                  {
                    icon: 'local-shipping',
                    color: '#F59E0B',
                    title: 'Express Replacement',
                    text: 'Fast-track replacement service in case of defects.',
                  },
                ].map((item, idx) => (
                  <View key={idx} style={styles.protectBenefitItem}>
                    <View
                      style={[
                        styles.protectBenefitIcon,
                        { backgroundColor: isDark ? '#0F172A' : '#F3F4F6' },
                      ]}
                    >
                      <Icon name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={styles.protectBenefitContent}>
                      <Text style={styles.protectBenefitTitle}>
                        {item.title}
                      </Text>
                      <Text style={styles.protectBenefitText}>{item.text}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.protectCoverageContainer}>
                <Text style={styles.protectSectionTitle}>What's Covered</Text>
                {[
                  'Manufacturing defects',
                  'Accidental damage',
                  'Battery replacement',
                  'Screen replacement',
                ].map((item, idx) => (
                  <View key={idx} style={styles.coverageItem}>
                    <Icon name="check-circle" size={18} color="#10B981" />
                    <Text style={styles.coverageText}>{item}</Text>
                  </View>
                ))}
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
        {[
          {
            icon: 'verified-user',
            color: '#DCFCE7',
            iconColor: '#16A34A',
            title: 'Quality Checked',
            text: 'Every product undergoes thorough quality checks',
          },
          {
            icon: 'local-shipping',
            color: '#DBEAFE',
            iconColor: '#2563EB',
            title: 'Fast Delivery',
            text: 'Quick delivery with real-time tracking',
          },
          {
            icon: 'policy',
            color: '#F3E8FF',
            iconColor: '#7C3AED',
            title: 'Easy Returns',
            text: '7-day easy return policy',
          },
          {
            icon: 'support-agent',
            color: '#FEF3C7',
            iconColor: '#D97706',
            title: '24/7 Support',
            text: 'Our team is always ready to help',
          },
        ].map((item, idx) => (
          <View key={idx} style={styles.instructionCard}>
            <View
              style={[styles.instructionIcon, { backgroundColor: item.color }]}
            >
              <Icon name={item.icon} size={22} color={item.iconColor} />
            </View>
            <Text style={styles.instructionCardTitle}>{item.title}</Text>
            <Text style={styles.instructionCardText}>{item.text}</Text>
          </View>
        ))}
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
  verified: boolean;
  inStock?: boolean;
  quantityAvailable?: number | null;
  isDark: boolean;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({
  title,
  brand,
  productId,
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
        {brand ? (
          <View style={styles.metaItem}>
            <Icon
              name="business"
              size={14}
              color={isDark ? '#CBD5E1' : '#6B7280'}
            />
            <Text style={styles.brandText}>{brand}</Text>
          </View>
        ) : null}
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
  variant: Variant | null;
  protectPromiseFees?: number;
  inStock?: boolean;
  isDark: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  variant,
  protectPromiseFees,
  inStock,
  isDark,
}) => {
  const styles = PriceDisplayStyles(isDark);
  const isOutOfStock = inStock === false;

  const finalPrice = getVariantPrice(variant);
  const mrp = getVariantMrp(variant);
  const discount = getVariantDiscount(variant);
  const savedAmount = getVariantSave(variant);
  const offerText = variant?.offerText;

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
            ₹{finalPrice.toLocaleString()}
          </Text>
          {mrp > finalPrice && (
            <Text style={styles.originalPrice}>
              MRP: ₹{mrp.toLocaleString()}
            </Text>
          )}
        </View>
      </View>

      {savedAmount > 0 && (
        <View style={styles.savingsContainer}>
          <Icon name="savings" size={20} color="#059669" />
          <Text style={styles.savingsText}>
            You Save ₹{savedAmount.toLocaleString()}
          </Text>
        </View>
      )}

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

// 🎨 Variant Selector Component
interface VariantSelectorProps {
  variantOptions?: string[];
  variantValues?: Record<string, string[]>;
  variants?: Variant[];
  selectedVariant: Variant | null;
  onVariantSelect: (variant: Variant) => void;
  isDark: boolean;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  variantOptions,
  variantValues,
  variants,
  selectedVariant,
  onVariantSelect,
  isDark,
}) => {
  const styles = VariantSelectorStyles(isDark);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (selectedVariant?.fields) {
      setSelectedOptions(selectedVariant.fields);
    }
  }, [selectedVariant]);

  if (!variantOptions || variantOptions.length === 0) return null;

  const handleOptionSelect = (option: string, value: string) => {
    const newSelectedOptions = { ...selectedOptions, [option]: value };
    setSelectedOptions(newSelectedOptions);

    const matchingVariant = variants?.find(v => {
      if (!v.fields) return false;
      return Object.entries(newSelectedOptions).every(
        ([key, val]) => v.fields?.[key] === val,
      );
    });

    if (matchingVariant) {
      onVariantSelect(matchingVariant);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Options</Text>
      {variantOptions.map((option, idx) => (
        <View key={idx} style={styles.optionGroup}>
          <Text style={styles.optionLabel}>{option}</Text>
          <View style={styles.valuesContainer}>
            {(variantValues?.[option] || []).map((value, vIdx) => {
              const isSelected = selectedOptions[option] === value;
              return (
                <TouchableOpacity
                  key={vIdx}
                  style={[
                    styles.valueChip,
                    isSelected && styles.valueChipSelected,
                  ]}
                  onPress={() => handleOptionSelect(option, value)}
                >
                  <Text
                    style={[
                      styles.valueText,
                      isSelected && styles.valueTextSelected,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
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

// 🎨 Selected Variant Info Component
interface SelectedVariantInfoProps {
  variant: Variant | null;
  isDark: boolean;
}

const SelectedVariantInfo: React.FC<SelectedVariantInfoProps> = ({
  variant,
  isDark,
}) => {
  const styles = SelectedVariantInfoStyles(isDark);
  if (!variant || !variant.fields) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="check-circle" size={20} color="#10B981" />
        <Text style={styles.title}>Selected Configuration</Text>
      </View>
      <View style={styles.fieldsContainer}>
        {Object.entries(variant.fields).map(([key, value], index) => (
          <View key={index} style={styles.fieldRow}>
            <Text style={styles.fieldKey}>{key}:</Text>
            <Text style={styles.fieldValue}>{value}</Text>
          </View>
        ))}
      </View>
      {variant.sku && <Text style={styles.skuText}>SKU: {variant.sku}</Text>}
    </View>
  );
};

// ============= MAIN ProductInfo Component (REFACTORED) =============

const ProductInfo: React.FC<any> = props => {
  const { id: propId } = props;

  const { user } = useUser();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { isDark } = useTheme();

  const params = (route.params as { productId?: string }) || {};
  const productId = params.productId || propId || null;

  // ============ USE YOUR EXISTING HOOK ============
  const {
    product: rawProduct,
    loading: productLoading,
    error: productError,
    refreshing,
    onRefresh: productRefresh,
  } = useProduct({ productId, autoFetch: true });

  // ============ RATING & REVIEWS STATE ============
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const currentUserId = user?._id ?? '';

  // ============ PROCESS PRODUCT DATA ============
  const product = rawProduct
    ? {
        ...rawProduct,
        variants: rawProduct.variants
          ? filterValidVariants(rawProduct.variants)
          : [],
      }
    : null;

  // Set default variant when product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      const defaultVariant =
        product.variants.find((v: Variant) => v.isDefault) ||
        product.variants[0];
      setSelectedVariant(defaultVariant);
    }
  }, [product, selectedVariant]);

  // ============ FETCH RATING & REVIEWS USING YOUR SERVICE ============
  const loadRatingAndReviews = useCallback(async () => {
    if (!productId) return;
    setRatingLoading(true);
    try {
      const [stats, reviewsData] = await Promise.all([
        fetchRatingStats(productId),
        fetchReviews(productId, 6),
      ]);
      setRatingStats(stats);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error loading rating/reviews:', error);
    } finally {
      setRatingLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      loadRatingAndReviews();
    }
  }, [productId, loadRatingAndReviews]);

  // ============ HANDLERS ============
  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
  };

  const handleTizzyChatNavigation = () => {
    if (!currentUserId) {
      Alert.alert(
        'Login Required',
        'Please login to start messaging with the seller',
      );
      return;
    }
    navigation.navigate('TizzyChat', { userId: currentUserId, id: productId });
  };

  const onRefresh = () => {
    productRefresh();
    loadRatingAndReviews();
  };

  const handleAvatarGroupClick = () => setShowRatingModal(true);
  const handleRatingClick = () => setShowRatingModal(true);

  // ============ DERIVED VALUES ============
  const getDisplayInStock = (): boolean => {
    if (selectedVariant) return getVariantInStock(selectedVariant);
    if (product?.inStock !== undefined) return product.inStock;
    return false;
  };

  const averageRating =
    ratingStats?.averageRating || product?.averageRating || 0;
  const reviewCount = ratingStats?.totalReviews || product?.reviewCount || 0;
  const displayInStock = getDisplayInStock();
  const loading = productLoading || ratingLoading;

  const dynamicStyles = getDynamicStyles(isDark);

  // ============ LOADING STATE ============
  if (loading && !product) {
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

  // ============ ERROR STATE ============
  if (productError || !product) {
    return (
      <SafeAreaView style={dynamicStyles.errorContainer}>
        <View style={dynamicStyles.errorContent}>
          <Icon name="error-outline" size={64} color="#DC2626" />
          <Text style={dynamicStyles.errorTitle}>Oops!</Text>
          <Text style={dynamicStyles.errorMessage}>
            {productError || 'Product not found'}
          </Text>
          <TouchableOpacity
            style={dynamicStyles.retryButton}
            onPress={onRefresh}
          >
            <Text style={dynamicStyles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ============ MAIN RENDER ============
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
            title={product.title || ''}
            brand={product.brand || ''}
            productId={product.productId || product._id || ''}
            verified={product.verified === true}
            inStock={displayInStock}
            quantityAvailable={getVariantStock(selectedVariant)}
            isDark={isDark}
          />

          <PriceDisplay
            variant={selectedVariant}
            protectPromiseFees={product.protectPromiseFees}
            inStock={displayInStock}
            isDark={isDark}
          />

          <VariantSelector
            variantOptions={product.variantOptions}
            variantValues={product.variantValues}
            variants={product.variants}
            selectedVariant={selectedVariant}
            onVariantSelect={handleVariantSelect}
            isDark={isDark}
          />

          <SelectedVariantInfo variant={selectedVariant} isDark={isDark} />

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
                  product.shortDescription ||
                  ''}
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
            <ProductHighlights productId={product.id || product._id || ''} />
          </View>

          <ActionButtons
            productId={product.id || product._id || ''}
            category={product.category}
            currentUserId={currentUserId}
            productTitle={product.title || ''}
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
              productId={product.id || product._id || ''}
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
                productId={product.id || product._id || ''}
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
// Keep all your existing style functions (StockStatusStyles, ProtectPromiseStyles, etc.)
// ... (they remain exactly the same as in your original code)

const getDynamicStyles = (isDark: boolean) =>
  StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    scrollContent: { paddingBottom: 24 },
    contentContainer: { padding: 16 },
    loadingContainer: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContent: { alignItems: 'center', padding: 40 },
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
    errorContent: { alignItems: 'center', padding: 32 },
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
    },
    retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
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
    highlightsList: { gap: 12 },
    highlightItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
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
    ratingSystemContainer: { marginBottom: 24 },
    modalOverlay: { flex: 1, backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
    modalContent: { flex: 1 },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    modalBackButton: { padding: 8 },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
      flex: 1,
      textAlign: 'center',
    },
    modalScroll: { flex: 1, padding: 16 },
  });

// Keep all your existing style functions (StockStatusStyles, ProtectPromiseStyles, InstructionsStyles, TizzyChatStyles, ProductHeaderStyles, PriceDisplayStyles, VariantSelectorStyles, SelectedVariantInfoStyles, RatingSectionStyles, ActionButtonsStyles)
// They remain exactly the same as in your original code...

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
    inStockBadge: { backgroundColor: '#D1FAE5' },
    outOfStockBadge: { backgroundColor: '#FEE2E2' },
    inStockText: { fontSize: 12, color: '#059669', fontWeight: '600' },
    outOfStockText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
    lowStockText: { fontSize: 11, color: '#D97706', fontWeight: '500' },
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
    protectPromiseContent: { flex: 1 },
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
    protectPromiseRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    protectPromiseValue: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
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
    protectModalCloseButton: { padding: 4 },
    protectModalScroll: { padding: 20 },
    protectModalImageContainer: {
      height: 180,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
      position: 'relative',
    },
    protectModalImage: { width: '100%', height: '100%' },
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
    protectModalImageSubtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
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
    protectFeesValue: { fontSize: 28, fontWeight: 'bold', color: '#059669' },
    protectBenefitsContainer: { marginBottom: 20 },
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
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    protectBenefitContent: { flex: 1 },
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
    protectCoverageContainer: { marginBottom: 20 },
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
    protectTermsContainer: { marginBottom: 20 },
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
    instructionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    instructionCard: {
      width: (screenWidth - 60) / 2,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
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
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 12,
      marginBottom: 16,
      elevation: 4,
    },
    tizzyChatButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    tizzyChatLogo: { width: 40, height: 40, borderRadius: 8, marginRight: 12 },
    tizzyChatTextContainer: { flex: 1 },
    tizzyChatTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#000000',
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
    verifiedText: { fontSize: 12, color: '#059669', fontWeight: '600' },
    productTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
      lineHeight: 32,
      marginBottom: 12,
    },
    productMeta: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    brandText: {
      fontSize: 14,
      color: isDark ? '#E2E8F0' : '#4B5563',
      fontWeight: '500',
    },
    productIdText: { fontSize: 14, color: isDark ? '#94A3B8' : '#6B7280' },
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
    pricingSection: { marginBottom: 6 },
    discountWithArrow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
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
    savingsText: { fontSize: 14, color: '#059669', fontWeight: '600' },
    offerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 16,
    },
    offerText: { fontSize: 14, color: '#DC2626', fontWeight: '500' },
  });

const VariantSelectorStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 12,
    },
    optionGroup: { marginBottom: 16 },
    optionLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#CBD5E1' : '#4B5563',
      marginBottom: 8,
    },
    valuesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    valueChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#475569' : '#D1D5DB',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    },
    valueChipSelected: {
      borderColor: '#3B82F6',
      backgroundColor: '#EFF6FF',
      borderWidth: 2,
    },
    valueText: { fontSize: 14, color: isDark ? '#E2E8F0' : '#374151' },
    valueTextSelected: { color: '#2563EB', fontWeight: '600' },
  });

const SelectedVariantInfoStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: isDark ? '#1E293B' : '#F0F9FF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E0F2FE',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#93C5FD' : '#1E40AF',
    },
    fieldsContainer: {
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
      marginBottom: 8,
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    fieldKey: { fontSize: 13, color: isDark ? '#94A3B8' : '#6B7280' },
    fieldValue: {
      fontSize: 13,
      color: isDark ? '#E2E8F0' : '#1F2937',
      fontWeight: '500',
    },
    skuText: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#6B7280',
      fontStyle: 'italic',
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
    ratingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    ratingScore: { flexDirection: 'row', alignItems: 'baseline' },
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
    starsContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    ratingRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
    avatarsContainer: { flexDirection: 'row', alignItems: 'center' },
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
    moreCount: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
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
    actionItem: { alignItems: 'center' },
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
  scrollView: { flex: 1 },
});

export default ProductInfo;
