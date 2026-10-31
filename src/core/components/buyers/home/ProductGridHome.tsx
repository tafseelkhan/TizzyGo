// src/core/components/buyers/home/ProductGridHome.tsx
import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { useProductGrid } from '../../../hooks/useProductGrid';
import { ProductGridService } from '../../../services/buyers/home/productGridService';
import ProductCard from './ProductCardHome';

const nofoundAnimation = require('../../../components/animations/lotties/no-products.json');

type RootStackParamList = {
  ProductDetail: { productId: string };
  [key: string]: any;
};

type ProductGridProps = {
  products: any[];
  isLoading: boolean;
  userId: string;
  onRefresh?: () => void;
  refreshTrigger?: boolean;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  userId,
  onRefresh,
  refreshTrigger = false,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();
  const isMountedRef = useRef(true);
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const {
    currentPage,
    column1,
    column2,
    totalPages,
    startIndex,
    endIndex,
    handleRefresh,
    handlePageChange,
    generatePageNumbers,
    isLoading: gridLoading,
    isRefreshing,
  } = useProductGrid({ products, isLoading, onRefresh, refreshTrigger });

  useEffect(() => {
    if (isInitialRender && !gridLoading && products.length > 0) {
      setIsInitialRender(false);
    }
  }, [gridLoading, products]);

  const handleProductPress = useCallback(
    (product: any) => {
      if (!isMountedRef.current) return;
      const productId = ProductGridService.getValidProductId(product);
      if (!productId) {
        Alert.alert('Error', 'Product ID not found. Please try again.');
        return;
      }
      navigation.navigate('ProductDetail', { productId });
    },
    [navigation],
  );

  const memoizedProducts = useMemo(() => products, [products]);

  const getStableKey = useCallback(
    (product: any) =>
      product._stableKey || product.fullProduct?._id || product.productId,
    [],
  );

  // 🔥 Masonry Layout Generator
  // Hum index ke basis par tall, standard, horizontal assign kar rahe hain
  // taaki image jaisa uneven look aaye.
  const getLayoutForIndex = (index: number, isSecondColumn: boolean) => {
    // Right column mein offset taaki dono side alag lagein
    const actualIndex = isSecondColumn ? index + 1 : index;
    const pattern = actualIndex % 4;
    if (pattern === 0) return 'tall'; // Vertical
    if (pattern === 1) return 'standard'; // Square-ish
    if (pattern === 2) return 'horizontal'; // Landscape
    return 'standard';
  };

  const renderColumn1 = useMemo(() => {
    if (gridLoading || column1.length === 0) return null;
    return column1.map((product, idx) => (
      <View key={getStableKey(product)} style={styles.cardWrapper}>
        <ProductCard
          product={product}
          userId={userId}
          layout={getLayoutForIndex(idx, false)}
        />
      </View>
    ));
  }, [column1, userId, getStableKey, gridLoading]);

  const renderColumn2 = useMemo(() => {
    if (gridLoading || column2.length === 0) return null;
    return column2.map((product, idx) => (
      <View key={getStableKey(product)} style={styles.cardWrapper}>
        <ProductCard
          product={product}
          userId={userId}
          layout={getLayoutForIndex(idx, true)}
        />
      </View>
    ));
  }, [column2, userId, getStableKey, gridLoading]);

  if (gridLoading && memoizedProducts.length === 0) {
    // Loading Skeleton
    return (
      <View style={styles.container}>
        <View style={styles.gridContainer}>
          {[...Array(2)].map((_, colIndex) => (
            <View key={`col-${colIndex}`} style={styles.column}>
              {[...Array(4)].map((_, i) => (
                <View
                  key={`skeleton-${colIndex}-${i}`}
                  style={[
                    styles.skeletonCard,
                    { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                  ]}
                >
                  <View
                    style={[
                      styles.skeletonImage,
                      { backgroundColor: isDark ? '#334155' : '#E5E7EB' },
                    ]}
                  />
                  <View style={{ padding: 8 }}>
                    <View
                      style={[
                        styles.skeletonTextLine,
                        { backgroundColor: isDark ? '#334155' : '#E5E7EB' },
                      ]}
                    />
                    <View
                      style={[
                        styles.skeletonTextLine,
                        { width: '60%', backgroundColor: isDark ? '#334155' : '#E5E7EB' },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (memoizedProducts.length === 0 && !isLoading) {
    return (
      <View style={styles.errorContainer}>
        <LottieView source={nofoundAnimation} autoPlay loop style={styles.errorAnimation} />
        <Text style={[styles.noProductsText, { color: isDark ? '#F1F5F9' : '#374151' }]}>
          No products found. Try a different search or explore other categories.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry Fetching</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* MAIN GRID (Masonry Columns) */}
        <View style={styles.gridContainer}>
          <View style={styles.column}>{renderColumn1}</View>
          <View style={styles.column}>{renderColumn2}</View>
        </View>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <View
            style={[
              styles.paginationContainer,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E5E7EB',
              },
            ]}
          >
            <View style={styles.paginationButtons}>
              <TouchableOpacity
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={[
                  styles.paginationButton,
                  currentPage === 1 && styles.disabledButton,
                ]}
              >
                <LinearGradient
                  colors={currentPage === 1 ? ['#94A3B8', '#94A3B8'] : ['#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.paginationButtonGradient}
                >
                  <Icon name="arrow-back" size={16} color="white" />
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.pageNumbers}>
                {generatePageNumbers().map((pageNum, index) =>
                  pageNum === '...' ? (
                    <Text
                      key={`ellipsis-${index}`}
                      style={[styles.ellipsis, { color: isDark ? '#94A3B8' : '#6B7280' }]}
                    >
                      ...
                    </Text>
                  ) : (
                    <TouchableOpacity
                      key={`page-${pageNum}`}
                      onPress={() => handlePageChange(pageNum as number)}
                      style={[
                        styles.pageNumber,
                        {
                          backgroundColor: currentPage === pageNum ? '#8B5CF6' : isDark ? '#334155' : '#F3F4F6',
                          borderColor: currentPage === pageNum ? '#8B5CF6' : isDark ? '#475569' : '#E5E7EB',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pageNumberText,
                          { color: currentPage === pageNum ? '#FFFFFF' : isDark ? '#F1F5F9' : '#374151' },
                        ]}
                      >
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  ),
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
                <LinearGradient
                  colors={currentPage === totalPages ? ['#94A3B8', '#94A3B8'] : ['#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.paginationButtonGradient}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                  <Icon name="arrow-forward" size={16} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

ProductGrid.displayName = 'ProductGrid';
export default React.memo(ProductGrid);

const styles = StyleSheet.create({
  container: { flex: 1 },
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Masonry
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  
  // Pagination Styles
  paginationContainer: {
    marginTop: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationButton: {
    borderRadius: 10,
    minWidth: 90,
    overflow: 'hidden',
  },
  paginationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.5 },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    marginHorizontal: 4,
  },
  pageNumbers: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageNumber: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pageNumberText: { fontSize: 13, fontWeight: '700' },
  ellipsis: { fontSize: 14, paddingHorizontal: 2 },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorAnimation: { width: 200, height: 200, marginBottom: 20 },
  noProductsText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // Skeleton Styles
  skeletonCard: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  skeletonImage: {
    width: '100%',
    height: 180,
  },
  skeletonTextLine: {
    height: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
});