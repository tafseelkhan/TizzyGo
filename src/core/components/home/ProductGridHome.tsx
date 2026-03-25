// components/ProductGrid.tsx
import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Image,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/theme/ThemeContext';

// Import your existing ProductCard component
import ProductCard from "./ProductCardHome";

const nofoundAnimation = require('../../components/animations/lotties/no-products.json');

// --- TYPE DEFINITIONS ---
type Variant = {
  fields?: any[];
  images?: string[];
  video?: string;
};

type FullProduct = {
  _id: string;
  title: string;
  brand: string;
  description: string;
  subcategory: string;
  variants?: Variant[];
  mrp: number;
  price: number;
  discount: number;
  finalPrice: number;
  offerText?: string;
  averageRating?: number;
  reviewCount?: number;
};

type Product = {
  productId: string;
  fullProduct: FullProduct;
};

type ProductGridProps = {
  products: Product[];
  isLoading: boolean;
  userId: string;
  onRefresh?: () => void;
};

// Define navigation param types
type RootStackParamList = {
  ProductDetail: { productId: string };
  [key: string]: any;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Helper function to get the product image
const getProductImage = (product: Product): string => {
  try {
    if (product?.fullProduct?.variants?.[0]?.images?.[0]) {
      const imageUrl = product.fullProduct.variants[0].images[0];
      return imageUrl.replace('…', '').trim();
    }
  } catch (error) {
    console.log("Error getting product image:", error);
  }
  return "https://placehold.co/500x500/6366f1/ffffff?text=Product"; 
};

// Function to get random products
const getRandomProducts = (products: Product[], count: number): Product[] => {
  if (products.length <= count) return products;
  
  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

// Simple Product Card for horizontal section
const HorizontalProductCard: React.FC<{ 
  product: Product; 
  onPress: (product: Product) => void;
}> = ({ product, onPress }) => {
  const { isDark } = useTheme();
  const imageUrl = getProductImage(product);
  
  return (
    <TouchableOpacity 
      style={[
        styles.horizontalProductCard,
        { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
      ]}
      onPress={() => onPress(product)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.horizontalImageContainer,
        { backgroundColor: isDark ? '#334155' : '#f1f5f9' }
      ]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.horizontalProductImage}
          resizeMode="cover"
        />
      </View>
      <Text style={[
        styles.horizontalProductName,
        { color: isDark ? '#F1F5F9' : '#475569' }
      ]} numberOfLines={2}>
        {product.fullProduct.title}
      </Text>
    </TouchableOpacity>
  );
};

// Premium Pick Product Card
const PremiumPickCard: React.FC<{ 
  product: Product; 
  onPress: (product: Product) => void;
}> = ({ product, onPress }) => {
  const { isDark } = useTheme();
  const imageUrl = getProductImage(product);
  const scaleAnim = useState(new Animated.Value(1))[0];
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 150,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 150,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View 
      style={[
        styles.premiumPickCard,
        { 
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => onPress(product)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Premium Badge */}
        <View style={styles.premiumBadgeContainer}>
          <View style={styles.premiumBadge}>
            <Icon name="star" size={10} color="#ffffff" />
            <Text style={styles.premiumBadgeText}>FEATURED</Text>
          </View>
        </View>

        {/* Product Image */}
        <View style={[
          styles.premiumImageContainer,
          { backgroundColor: isDark ? '#334155' : '#f8fafc' }
        ]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.premiumProductImage}
            resizeMode="contain"
          />
        </View>

        {/* Product Info */}
        <View style={styles.premiumInfoContainer}>
          <Text style={[
            styles.premiumProductBrand,
            { color: isDark ? '#7DD3FC' : '#3b82f6' }
          ]}>
            {product.fullProduct.brand || "Brand"}
          </Text>
          <Text style={[
            styles.premiumProductName,
            { color: isDark ? '#F1F5F9' : '#1e293b' }
          ]} numberOfLines={2}>
            {product.fullProduct.title}
          </Text>
          
          {/* Price and Rating */}
          <View style={styles.premiumPriceRating}>
            <View style={styles.premiumPriceContainer}>
              <Text style={[
                styles.premiumPrice,
                { color: isDark ? '#FFFFFF' : '#1e293b' }
              ]}>
                ₹{product.fullProduct.finalPrice.toLocaleString()}
              </Text>
              {product.fullProduct.mrp > product.fullProduct.finalPrice && (
                <Text style={[
                  styles.premiumOriginalPrice,
                  { color: isDark ? '#94A3B8' : '#94a3b8' }
                ]}>
                  ₹{product.fullProduct.mrp.toLocaleString()}
                </Text>
              )}
            </View>
            
            {/* Rating */}
            <View style={[
              styles.premiumRating,
              { backgroundColor: isDark ? '#92400e' : '#fef3c7' }
            ]}>
              <Icon name="star" size={10} color="#fbbf24" />
              <Text style={[
                styles.premiumRatingText,
                { color: isDark ? '#FFFFFF' : '#92400e' }
              ]}>
                {product.fullProduct.averageRating?.toFixed(1) || "4.5"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Trending Bundle Card
const TrendingBundleCard: React.FC<{
  products: Product[];
  onPress: (product: Product) => void;
}> = ({ products, onPress }) => {
  const { isDark } = useTheme();
  
  // RANDOM 4 products for bundle
  const bundleProducts = useMemo(() => {
    return getRandomProducts(products, 4);
  }, [products]);
  
  const totalOriginalPrice = bundleProducts.reduce((sum, product) => 
    sum + product.fullProduct.mrp, 0
  );
  
  const totalBundlePrice = bundleProducts.reduce((sum, product) => 
    sum + product.fullProduct.finalPrice, 0
  );
  
  const totalDiscount = bundleProducts.reduce((sum, product) => 
    sum + product.fullProduct.discount, 0
  );
  
  const averageDiscount = bundleProducts.length > 0 
    ? Math.round(totalDiscount / bundleProducts.length)
    : 0;

  return (
    <View style={[
      styles.bundleContainer,
      { 
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        borderColor: isDark ? '#334155' : '#f1f5f9'
      }
    ]}>
      {/* Bundle Header */}
      <View style={[
        styles.bundleHeader,
        { 
          backgroundColor: isDark ? '#92400e' : '#fef3c7',
          borderBottomColor: isDark ? '#78350f' : '#fde68a'
        }
      ]}>
        <View style={styles.bundleTitleContainer}>
          <Icon name="flash" size={20} color="#f59e0b" />
          <Text style={[
            styles.bundleTitle,
            { color: isDark ? '#FFFFFF' : '#92400e' }
          ]}>Trending Bundle</Text>
        </View>
        <View style={[
          styles.bundleBadge,
          { backgroundColor: '#10b981' }
        ]}>
          <Text style={styles.bundleBadgeText}>Save {averageDiscount}%</Text>
        </View>
      </View>
      
      {/* Bundle Products Grid */}
      <View style={styles.bundleProductsGrid}>
        {bundleProducts.map((product, index) => (
          <TouchableOpacity
            key={`${product.fullProduct._id}-${index}`}
            style={styles.bundleProductItem}
            onPress={() => onPress(product)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.bundleProductImageContainer,
              { backgroundColor: isDark ? '#334155' : '#f8fafc' }
            ]}>
              <Image
                source={{ uri: getProductImage(product) }}
                style={styles.bundleProductImage}
                resizeMode="cover"
              />
            </View>
            <Text style={[
              styles.bundleProductName,
              { color: isDark ? '#CBD5E1' : '#475569' }
            ]} numberOfLines={1}>
              {product.fullProduct.brand}
            </Text>
            <Text style={[
              styles.bundleProductPrice,
              { color: isDark ? '#FFFFFF' : '#1e293b' }
            ]}>
              ₹{product.fullProduct.finalPrice.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Bundle Footer */}
      <View style={[
        styles.bundleFooter,
        { 
          backgroundColor: isDark ? '#0F172A' : '#f8fafc',
          borderTopColor: isDark ? '#1E293B' : '#e2e8f0'
        }
      ]}>
        <View style={styles.bundlePriceContainer}>
          <View style={styles.bundlePriceRow}>
            <Text style={[
              styles.bundleTotalLabel,
              { color: isDark ? '#94A3B8' : '#64748b' }
            ]}>Total:</Text>
            <Text style={[
              styles.bundleTotalPrice,
              { color: isDark ? '#FFFFFF' : '#1e293b' }
            ]}>
              ₹{totalBundlePrice.toLocaleString()}
            </Text>
          </View>
          <Text style={[
            styles.bundleOriginalPrice,
            { color: isDark ? '#94A3B8' : '#94a3b8' }
          ]}>
            ₹{totalOriginalPrice.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity style={styles.bundleButton}>
          <Text style={styles.bundleButtonText}>View Bundle</Text>
          <Icon name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  userId,
  onRefresh,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination Logic
  const itemsPerPage = 20; 
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);
  const endIndex = Math.min(startIndex + itemsPerPage, products.length);

  // Create 2 columns for grid layout
  const { column1, column2 } = useMemo(() => {
    const col1: Product[] = [];
    const col2: Product[] = [];
    
    currentProducts.forEach((product, index) => {
      if (index % 2 === 0) {
        col1.push(product);
      } else {
        col2.push(product);
      }
    });
    return { column1: col1, column2: col2 };
  }, [currentProducts]);

  // Get products for different sections
  const horizontalProducts = useMemo(() => {
    return getRandomProducts(products, 10);
  }, [products]);

  // FASTEST SELLING
  const fastestSellingProduct = useMemo(() => {
    if (products.length === 0) return null;
    return products[Math.floor(Math.random() * products.length)];
  }, [products]);

  // Get RANDOM 4 products for Premium Picks
  const premiumPicks = useMemo(() => {
    return getRandomProducts(products, 4);
  }, [products]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { 
      productId: product.productId || product.fullProduct._id 
    });
  }, [navigation]);

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) { end = 3; }
      if (currentPage >= totalPages - 1) { start = totalPages - 2; }

      if (start > 2) { pages.push("..."); }
      for (let i = start; i <= end; i++) { pages.push(i); }
      if (end < totalPages - 1) { pages.push("..."); }
      if (totalPages > 1) { pages.push(totalPages); }
    }
    return pages;
  };
  
  // Loading Skeleton
  if (isLoading) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: isDark ? '#0F172A' : '#f8fafc' }
      ]}>
        <View style={styles.gridContainer}>
          {[...Array(2)].map((_, colIndex) => (
            <View key={`col-${colIndex}`} style={styles.column}>
              {[...Array(5)].map((_, i) => (
                <View key={`col-${colIndex}-${i}`} style={[
                  styles.skeletonCard,
                  { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
                ]}>
                  <View style={[
                    styles.skeletonImage,
                    { backgroundColor: isDark ? '#334155' : '#E5E7EB' }
                  ]} />
                  <View style={[
                    styles.skeletonTextLine,
                    { backgroundColor: isDark ? '#334155' : '#E5E7EB' }
                  ]} />
                  <View style={[
                    styles.skeletonTextLine, 
                    { 
                      width: '60%',
                      backgroundColor: isDark ? '#334155' : '#E5E7EB'
                    }
                  ]} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // No Products State
  if (products.length === 0) {
    return (
      <View style={[
        styles.errorContainer,
        { backgroundColor: isDark ? '#00000000' : '#00000000' }
      ]}>
        <LottieView
          source={nofoundAnimation}
          autoPlay
          loop
          style={styles.errorAnimation}
        />
        <Text style={[
          styles.noProductsText,
          { color: isDark ? '#F1F5F9' : '#374151' }
        ]}>
          No products found. Try a different search or explore other categories.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry Fetching</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#0F172A' : '#f8fafc' }
    ]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3b82f6", "#60a5fa"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* --- 1. HORIZONTAL PRODUCTS SECTION --- */}
        {horizontalProducts.length > 0 && (
          <View style={styles.horizontalSection}>
            <View style={styles.horizontalHeader}>
              <Text style={[
                styles.horizontalTitle,
                { color: isDark ? '#F1F5F9' : '#1e293b' }
              ]}>Still looking for these?</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScrollView}
            >
              {horizontalProducts.map((product, index) => (
                <HorizontalProductCard 
                  key={`${product.fullProduct._id}-${index}`} 
                  product={product} 
                  onPress={handleProductPress} 
                />
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* --- 2. PREMIUM PICKS SECTION --- */}
        {premiumPicks.length > 0 && (
          <View style={styles.premiumSection}>
            <View style={styles.premiumHeader}>
              <Text style={[
                styles.premiumTitle,
                { color: isDark ? '#F1F5F9' : '#1e293b' }
              ]}>Premium Picks</Text>
              <Text style={[
                styles.premiumSubtitle,
                { color: isDark ? '#94A3B8' : '#64748b' }
              ]}>
                Handpicked just for you
              </Text>
            </View>
            
            <View style={styles.premiumGrid}>
              {premiumPicks.map((product) => (
                <PremiumPickCard
                  key={product.fullProduct._id}
                  product={product}
                  onPress={handleProductPress}
                />
              ))}
            </View>
          </View>
        )}
        
        {/* --- 3. TRENDING BUNDLE SECTION --- */}
        {products.length >= 4 && (
          <TrendingBundleCard 
            products={products}
            onPress={handleProductPress}
          />
        )}
        
        {/* --- 4. FASTEST SELLING PRODUCT --- */}
        {fastestSellingProduct && (
          <TouchableOpacity
            style={[
              styles.fastestSellingBanner,
              { 
                backgroundColor: isDark ? '#1E293B' : '#f0f9ff',
                borderColor: isDark ? '#334155' : '#bae6fd'
              }
            ]}
            onPress={() => handleProductPress(fastestSellingProduct)}
            activeOpacity={0.9}
          >
            <View style={styles.fastestSellingTextContainer}>
              <Text style={styles.fastestSellingBadge}>
                🔥 FASTEST SELLING
              </Text>
              <Text style={[
                styles.fastestSellingTitle,
                { color: isDark ? '#FFFFFF' : '#1e293b' }
              ]} numberOfLines={2}>
                {fastestSellingProduct.fullProduct.title}
              </Text>
              <Text style={[
                styles.fastestSellingSubtitle,
                { color: isDark ? '#CBD5E1' : '#64748b' }
              ]}>
                Grab it now at ₹{fastestSellingProduct.fullProduct.finalPrice.toLocaleString()}
              </Text>
            </View>
            
            <View style={[
              styles.fastestSellingImage,
              { backgroundColor: isDark ? '#334155' : '#E5E7EB' }
            ]}>
              <Image
                source={{ uri: getProductImage(fastestSellingProduct) }}
                style={styles.fastestSellingImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        )}
        
        {/* --- 5. PRODUCTS COUNT & PAGINATION INFO --- */}
        <View style={styles.productsCountWrapper}>
          <LinearGradient
            colors={isDark ? ['#1E293B', '#334155'] : ['#3b82f6', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.productsCountContainer}
          >
            <View style={styles.countLeft}>
              <Icon name="grid" size={20} color="white" style={styles.countIcon} />
              <View>
                <Text style={styles.countTitle}>Showing Results</Text>
                <Text style={styles.countSubtitle}>
                  <Text style={styles.highlight}>
                    {startIndex + 1}-{endIndex}
                  </Text>{" "}
                  of <Text style={styles.highlight}>{products.length}</Text>
                </Text>
              </View>
            </View>
            <View style={styles.countRight}>
              <Text style={styles.countRightText}>Page {currentPage}</Text>
              <Icon name="chevron-forward" size={16} color="white" />
            </View>
          </LinearGradient>
        </View>

        {/* --- 6. MAIN PRODUCT GRID --- */}
        <View style={styles.gridContainer}>
          {/* FIRST COLUMN */}
          <View style={styles.column}>
            {column1.map((product) => (
              <View key={product.fullProduct._id} style={styles.productCardWrapper}>
                <ProductCard
                  product={{
                    productId: product.productId,
                    fullProduct: product.fullProduct
                  }}
                  userId={userId}
                  showSocialButtons={true}
                />
              </View>
            ))}
          </View>
          
          {/* SECOND COLUMN */}
          <View style={styles.column}>
            {column2.map((product) => (
              <View key={product.fullProduct._id} style={styles.productCardWrapper}>
                <ProductCard
                  product={{
                    productId: product.productId,
                    fullProduct: product.fullProduct
                  }}
                  userId={userId}
                  showSocialButtons={true}
                />
              </View>
            ))}
          </View>
        </View>

        {/* --- 7. PAGINATION --- */}
        {totalPages > 1 && (
          <View style={[
            styles.paginationContainer,
            { 
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E5E7EB'
            }
          ]}>
            <View style={styles.paginationButtons}>
              <TouchableOpacity
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={[
                  styles.paginationButton,
                  currentPage === 1 && styles.disabledButton,
                ]}
              >
                <Icon name="arrow-back" size={16} color="white" />
                <Text style={styles.paginationButtonText}>Previous</Text>
              </TouchableOpacity>

              <View style={styles.pageNumbers}>
                {generatePageNumbers().map((pageNum, index) =>
                  pageNum === "..." ? (
                    <Text key={`ellipsis-${index}`} style={[
                      styles.ellipsis,
                      { color: isDark ? '#94A3B8' : '#6B7280' }
                    ]}>...</Text>
                  ) : (
                    <TouchableOpacity
                      key={pageNum}
                      onPress={() => handlePageChange(pageNum as number)}
                      style={[
                        styles.pageNumber,
                        currentPage === pageNum && styles.activePageNumber,
                        { 
                          backgroundColor: isDark ? '#334155' : '#F3F4F6',
                          borderColor: isDark ? '#475569' : '#E5E7EB'
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.pageNumberText,
                          currentPage === pageNum && styles.activePageNumberText,
                          { color: isDark ? '#F1F5F9' : '#374151' }
                        ]}
                      >
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <TouchableOpacity
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={[
                  styles.paginationButton,
                  currentPage === totalPages && styles.disabledButton,
                ]}
              >
                <Text style={styles.paginationButtonText}>Next</Text>
                <Icon name="arrow-forward" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// Styles remain exactly the same as your original
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#00000000",
  },
  scrollView: {
    flex: 1,
  },
  horizontalSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  horizontalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  horizontalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  horizontalScrollView: {
    flexDirection: 'row',
  },
  horizontalProductCard: {
    borderRadius: 12,
    marginRight: 12,
    width: 100,
    overflow: 'hidden',
    backgroundColor: 'white',
    padding: 8,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  horizontalImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  horizontalProductImage: {
    width: '100%',
    height: '100%',
  },
  horizontalProductName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 14,
  },
  premiumSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  premiumHeader: {
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  premiumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  premiumPickCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    height: 280,
  },
  premiumBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  premiumImageContainer: {
    height: 150,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  premiumProductImage: {
    width: '100%',
    height: '100%',
  },
  premiumInfoContainer: {
    padding: 12,
  },
  premiumProductBrand: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  premiumProductName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
    lineHeight: 16,
    marginBottom: 8,
  },
  premiumPriceRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  premiumPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginRight: 6,
  },
  premiumOriginalPrice: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  premiumRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  premiumRatingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 3,
  },
  bundleContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  bundleTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bundleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400e',
    marginLeft: 8,
  },
  bundleBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bundleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  bundleProductsGrid: {
    flexDirection: 'row',
    padding: 16,
  },
  bundleProductItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bundleProductImageContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'visible',
  },
  bundleProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  bundleProductName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 4,
  },
  bundleProductPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  bundleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bundlePriceContainer: {
    flex: 1,
  },
  bundlePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  bundleTotalLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 6,
  },
  bundleTotalPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  bundleOriginalPrice: {
    fontSize: 13,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  bundleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bundleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  fastestSellingBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  fastestSellingTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  fastestSellingBadge: {
    backgroundColor: '#3b82f6',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  fastestSellingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  fastestSellingSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  fastestSellingImage: {
    width: 100,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  productsCountWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  productsCountContainer: {
    padding: 16,
    borderRadius: 12,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  countIcon: {
    marginRight: 12,
  },
  countTitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  countSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginTop: 2,
  },
  highlight: {
    color: "#fef3c7",
    fontWeight: "800",
  },
  countRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  countRightText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  gridContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    marginHorizontal: 2,
  },
  productCardWrapper: {
    marginBottom: 10,
  },
  paginationContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    justifyContent: "center",
    backgroundColor: "#3b82f6",
  },
  disabledButton: {
    opacity: 0.5,
  },
  paginationButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    marginHorizontal: 4,
  },
  pageNumbers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageNumber: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activePageNumber: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  activePageNumberText: {
    color: "#fff",
  },
  ellipsis: {
    fontSize: 14,
    color: "#6B7280",
    paddingHorizontal: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000000',
    padding: 20,
  },
  errorAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  noProductsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonCard: {
    width: (Dimensions.get("window").width - 24) / 2 - 8,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    padding: 8,
  },
  skeletonImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonTextLine: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 6,
  },
});

export default ProductGrid;