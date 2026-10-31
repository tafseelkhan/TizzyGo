// src/core/components/buyers/home/index.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  StyleSheet,
  StatusBar,
  Animated,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import Banner from './BannerHome';
import CategoryGrid from './CategoryGridHome';
import Header from './HeaderHome';
import BottomNavigation from '../../BottomNavigationHome';
import ProductGrid from './ProductGridHome';
import ProductStories from './ProductStoryHome';
import StickyCategoryBar from './StickyCategoryBarHome';
import { Product as ProductType } from '../../../types/HomeTypes';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { getColorHexValues } from '../../../colors/styles';

// ✅ API imports — raw fetch hata diya
import {
  fetchHomeProducts,
  fetchUserFavoriteColor,
  ApiProductResponse,
  FullProduct,
} from '../../../../api/features/private/homeStepPrivateSlice';

const getColorGradient = (
  colorName: string | null,
  isDark: boolean,
): string[] => {
  if (!colorName) {
    return isDark
      ? ['#0f172a', '#1e293b', '#0f172a']
      : ['#a2ffec', '#e6fffa', '#c2fff2'];
  }
  return getColorHexValues(colorName, isDark);
};

const getUserIdFromToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    return decoded.userId || decoded.id || decoded.sub || null;
  } catch {
    return null;
  }
};

interface GridProduct {
  productId: string;
  fullProduct: FullProduct;
}

const HomeScreen: React.FC = () => {
  const [products, setProducts] = useState<GridProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState('Select Location');
  const [activeTab, setActiveTab] = useState('home');
  const [isStoriesFullScreen, setIsStoriesFullScreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [storiesRefreshing, setStoriesRefreshing] = useState(false);
  const [userColor, setUserColor] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0);

  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const params = route.params as { id?: string } | undefined;
  const productId = params?.id;

  const { isDark } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const gradientColors = useMemo(
    () => getColorGradient(userColor, isDark),
    [userColor, isDark],
  );

  const HEADER_HEIGHT = 105 + insets.top;
  const GRADIENT_HEIGHT = HEADER_HEIGHT + 90;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const categoryTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [HEADER_HEIGHT, 0],
    extrapolate: 'clamp',
  });

  // ✅ User color — API slice se
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const extractedUserId = await getUserIdFromToken();
          if (extractedUserId) {
            setUserId(extractedUserId);
            await AsyncStorage.setItem('userId', extractedUserId);
          }
          const color = await fetchUserFavoriteColor();
          if (color) {
            await AsyncStorage.setItem('userColor', color);
          }
          setUserColor(color);
        } else {
          const cachedColor = await AsyncStorage.getItem('userColor');
          setUserColor(cachedColor);
        }
      } catch {}
    };
    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshAllData();
    }, []),
  );

  const refreshAllData = async () => {
    try {
      setRefreshing(true);
      setStoriesRefreshing(true);
      await fetchProducts();
      setStoriesRefreshKey(prev => prev + 1);
    } catch {
    } finally {
      setTimeout(() => {
        setRefreshing(false);
        setStoriesRefreshing(false);
      }, 1000);
    }
  };

  const handleGlobalRefresh = useCallback(async () => {
    await refreshAllData();
  }, []);

  const handleStoriesRefresh = useCallback(async () => {
    try {
      setStoriesRefreshing(true);
      await new Promise<void>(resolve => {
        setTimeout(() => {
          setStoriesRefreshKey(prev => prev + 1);
          resolve();
        }, 1500);
      });
    } finally {
      setStoriesRefreshing(false);
    }
  }, []);

  const convertToGridProducts = (
    apiProducts: ApiProductResponse[],
  ): GridProduct[] => {
    if (!apiProducts || !Array.isArray(apiProducts)) return [];
    return apiProducts.map(item => ({
      productId: item.productId || item.fullProduct?._id || '',
      fullProduct: {
        _id: item.fullProduct?._id || '',
        title: item.fullProduct?.title || 'Untitled',
        brand: item.fullProduct?.brand || '',
        description: item.fullProduct?.description || '',
        category: item.fullProduct?.category || '',
        subcategory: item.fullProduct?.subcategory || '',
        mrp: item.fullProduct?.mrp || 0,
        price: item.fullProduct?.price || 0,
        discount: item.fullProduct?.discount || 0,
        finalPrice: item.fullProduct?.finalPrice || 0,
        variants: item.fullProduct?.variants || [],
        averageRating: item.fullProduct?.averageRating || 0,
        reviewCount: item.fullProduct?.reviewCount || 0,
        images: item.fullProduct?.images || [],
        seller: item.fullProduct?.seller || null,
        likes: item.fullProduct?.likes || 0,
        comments: item.fullProduct?.comments || [],
        createdAt: item.fullProduct?.createdAt || new Date().toISOString(),
        updatedAt: item.fullProduct?.updatedAt || new Date().toISOString(),
        offerText: item.fullProduct?.offerText || '',
      },
    }));
  };

  // ✅ Products — API slice se
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const apiProducts = await fetchHomeProducts();

      let filteredProducts = apiProducts;
      if (searchQuery) {
        filteredProducts = apiProducts.filter((p: ApiProductResponse) =>
          p.fullProduct?.title
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
        );
      }
      setProducts(convertToGridProducts(filteredProducts));
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const filteredProducts = useCallback((): GridProduct[] => {
    if (selectedCategory.toLowerCase().trim() === 'all') return products;
    return products.filter(
      product =>
        product.fullProduct.category?.toLowerCase().trim() ===
        selectedCategory.toLowerCase().trim(),
    );
  }, [products, selectedCategory]);

  return (
    <>
      <StatusBar barStyle="light-content" />

      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
        ]}
      >
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <Animated.ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleGlobalRefresh}
              colors={
                isDark
                  ? [gradientColors[1] || '#7DD3FC']
                  : [gradientColors[0] || '#314dc7']
              }
              tintColor={
                isDark
                  ? gradientColors[1] || '#7DD3FC'
                  : gradientColors[0] || '#314dc7'
              }
              progressViewOffset={HEADER_HEIGHT}
            />
          }
        >
          {/* TOP GRADIENT BLOCK */}
          <View style={{ height: GRADIENT_HEIGHT, position: 'relative' }}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['transparent', isDark ? '#0F172A' : '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 60,
              }}
            />
          </View>

          {/* WHITE REGION */}
          <View
            style={[
              styles.whiteRegion,
              { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.storiesContainer}>
              <ProductStories
                key={storiesRefreshKey}
                onRefresh={handleStoriesRefresh}
                onStoryEnd={() => setIsStoriesFullScreen(false)}
                onStoryChange={() => setIsStoriesFullScreen(true)}
              />
            </View>

            <CategoryGrid />

            <Banner productsCount={products.length} />

            <ProductGrid
              products={filteredProducts()}
              isLoading={isLoading}
              userId={userId || ''}
              refreshTrigger={refreshing}
              onRefresh={handleGlobalRefresh}
            />
          </View>
        </Animated.ScrollView>

        {/* HEADER */}
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.normalHeader,
            {
              paddingTop: insets.top,
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <Header
            location={location}
            setLocation={setLocation}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            handleCategoryClick={handleCategoryClick}
            disableScrollEffect={isStoriesFullScreen}
            onRefresh={handleGlobalRefresh}
            refreshing={refreshing}
            scrollY={scrollY}
            isDark={isDark}
            hideFilterButton={true}
            tintColors={gradientColors}
          />
        </Animated.View>

        {/* STICKY CATEGORY BAR */}
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.stickyBarContainer,
            {
              transform: [{ translateY: categoryTranslateY }],
            },
          ]}
        >
          <StickyCategoryBar
            selectedCategory={selectedCategory}
            onSelect={handleCategoryClick}
            isDark={isDark}
            scrollY={scrollY}
          />
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  whiteRegion: {
    paddingTop: 8,
    paddingBottom: 0,
  },

  storiesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    marginTop: 12,
  },

  normalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  stickyBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
});

export default HomeScreen;