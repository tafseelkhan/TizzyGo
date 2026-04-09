// app/index.tsx (Home Page) - Fixed with Full Theme Support
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  ImageResizeMode,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import Banner from './BannerHome';
import CategoryGrid from './CategoryGridHome';
import Header from './HeaderHome';
import BottomNavigation from './BottomNavigationHome';
import Footer from './FooterHome';
import ProductGrid from './ProductGridHome';
import ProductStories from './ProductStoryHome';
import BrandSlider from './BrandSliderHome';
import {
  brandsData,
  staticBannerData,
  rotatingBannerItems,
} from './Common/Data/images';
import { Product as ProductType } from '../../types/HomeTypes';
import { AuthUtils } from '../../services/HomeService';
import { useTheme } from '../../contexts/theme/ThemeContext';
import { getColorHexValues, getPrimaryColor } from '../../colors/styles';

// API Base URL
const API_BASE_URL = 'http://192.168.251.121:5000';

// Helper function to get gradient colors based on user's favorite color AND theme
const getColorGradient = (
  colorName: string | null,
  isDark: boolean,
): string[] => {
  if (!colorName) {
    // Default gradient based on theme
    if (isDark) {
      return ['#0f172a', '#1e293b', '#0f172a'];
    }
    return ['#f9fafb', '#ffffff', '#ffffff'];
  }

  const hexValues = getColorHexValues(colorName, isDark);
  return hexValues;
};

// Helper function to extract user ID from token
const getUserIdFromToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return null;

    const decoded: any = jwtDecode(token);
    return decoded.userId || decoded.id || decoded.sub || null;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
};

// Fetch user color from API with proper error handling and caching
const fetchUserColor = async (token: string): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/fav/color`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success && data.data?.color) {
      const colorName = data.data.color;
      await AsyncStorage.setItem('userColor', colorName);
      return colorName;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user color:', error);
    return null;
  }
};

// Interfaces
interface FullProduct {
  _id: string;
  title: string;
  brand: string;
  description: string;
  category: string;
  subcategory: string;
  mrp: number;
  price: number;
  discount: number;
  finalPrice: number;
  variants?: Array<{
    images?: string[];
    [key: string]: any;
  }>;
  averageRating?: number;
  reviewCount?: number;
  images?: string[];
  seller?: any;
  likes?: number;
  comments?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface GridProduct {
  productId: string;
  fullProduct: FullProduct;
}

interface ApiProduct {
  _id: string;
  title: string;
  brand: string;
  description: string;
  category: string;
  subcategory: string;
  mrp: number;
  price: number;
  discount: number;
  finalPrice: number;
  variants?: Array<{
    images?: string[];
    [key: string]: any;
  }>;
  averageRating?: number;
  reviewCount?: number;
  images?: string[];
  seller?: any;
  likes?: number;
  comments?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface BannerItem {
  id: string;
  text: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
}

interface RotatingBannerProps {
  items: BannerItem[];
  rotationInterval?: number;
  height?: 'small' | 'medium' | 'large' | 'full';
  showIndicators?: boolean;
  showNavigation?: boolean;
  onLayout?: (event: any) => void;
  isDark?: boolean;
}

interface CustomImageProps {
  source: any;
  style: ImageStyle;
  resizeMode?: ImageResizeMode;
  fallbackColor?: string;
  fallbackText?: string;
  isDark?: boolean;
}

const CustomImage: React.FC<CustomImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  fallbackColor = '#3b82f6',
  fallbackText = 'Image',
  isDark = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (imageError) {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: fallbackColor,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 10 }}>
          {fallbackText}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Image
        source={source}
        style={style}
        resizeMode={resizeMode}
        onError={() => {
          console.log('Image load error for:', source);
          setImageError(true);
        }}
        onLoadEnd={() => setIsLoading(false)}
        onLoadStart={() => setIsLoading(true)}
      />
      {isLoading && (
        <View
          style={[
            style,
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
            },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={isDark ? '#7DD3FC' : '#3b82f6'}
          />
        </View>
      )}
    </>
  );
};

const RotatingBanner: React.FC<RotatingBannerProps> = ({
  items,
  rotationInterval = 5000,
  height = 'large',
  showIndicators = true,
  showNavigation = true,
  onLayout,
  isDark = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const heightValues = {
    small: 256,
    medium: 320,
    large: 384,
    full: Dimensions.get('window').height,
  };

  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
        setIsTransitioning(false);
      }, 500);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [items.length, rotationInterval]);

  const goToSlide = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 100);
  };

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
      setIsTransitioning(false);
    }, 100);
  };

  const goToPrev = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(
        prevIndex => (prevIndex - 1 + items.length) % items.length,
      );
      setIsTransitioning(false);
    }, 100);
  };

  const handleCtaClick = (link?: string) => {
    if (link) {
      navigation.navigate(link);
    }
  };

  if (!items.length) return null;

  return (
    <View
      style={[styles.bannerContainer, { height: heightValues[height] }]}
      onLayout={onLayout}
    >
      {items.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.bannerImageContainer,
            {
              opacity: index === currentIndex ? 1 : 0,
            },
          ]}
        >
          <CustomImage
            source={{ uri: item.image }}
            style={styles.bannerImage}
            resizeMode="cover"
            fallbackText={`Banner ${index + 1}`}
            isDark={isDark}
          />

          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ))}

      <View style={styles.bannerContent}>
        <View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: isTransitioning ? 16 : 0 }],
              opacity: isTransitioning ? 0 : 1,
            },
          ]}
        >
          <Text style={styles.bannerTitle}>{items[currentIndex].text}</Text>
          <Text style={styles.bannerSubtitle}>
            Discover beautiful deals and exclusive offers always on TizzyGo.com
          </Text>

          {items[currentIndex].ctaText && (
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => handleCtaClick(items[currentIndex].ctaLink)}
            >
              <Text style={styles.ctaButtonText}>
                {items[currentIndex].ctaText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showNavigation && items.length > 1 && (
        <>
          <TouchableOpacity style={styles.navButtonLeft} onPress={goToPrev}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButtonRight} onPress={goToNext}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {showIndicators && items.length > 1 && (
        <View style={styles.indicatorsContainer}>
          {items.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                index === currentIndex
                  ? styles.activeIndicator
                  : styles.inactiveIndicator,
              ]}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>
      )}

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: isTransitioning ? '100%' : '0%',
            },
          ]}
        />
      </View>
    </View>
  );
};

interface StaticBannerProps {
  text: string;
  image: string;
  height?: 'small' | 'medium' | 'large' | 'full';
  textPosition?: 'left' | 'center' | 'right';
  overlayIntensity?: 'light' | 'medium' | 'dark';
  borderRadius?: 'none' | 'medium' | 'large';
  className?: string;
  ctaText?: string;
  ctaLink?: string;
  isDark?: boolean;
}

const StaticBanner: React.FC<StaticBannerProps> = ({
  text,
  image,
  height = 'medium',
  textPosition = 'center',
  overlayIntensity = 'medium',
  borderRadius = 'medium',
  ctaText = 'Explore Now',
  ctaLink = '/list/explore',
  isDark = false,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleButtonClick = () => {
    if (ctaLink) {
      navigation.navigate(ctaLink);
    }
  };

  const heightValues = {
    small: 256,
    medium: 320,
    large: 384,
    full: Dimensions.get('window').height,
  };

  const textAlignment = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  } as const;

  const overlayIntensities = {
    light: 'rgba(0,0,0,0.1)',
    medium: 'rgba(0,0,0,0.1)',
    dark: 'rgba(0,0,0,0.1)',
  };

  const borderRadiusValues = {
    none: 0,
    medium: 12,
    large: 24,
  };

  return (
    <View
      style={[
        styles.staticBannerContainer,
        {
          height: heightValues[height],
          borderRadius: borderRadiusValues[borderRadius],
        },
      ]}
    >
      <View style={styles.staticBannerImageContainer}>
        <CustomImage
          source={{ uri: image }}
          style={styles.staticBannerImage}
          resizeMode="cover"
          fallbackText="Banner"
          isDark={isDark}
        />
      </View>

      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: overlayIntensities[overlayIntensity] },
        ]}
      />

      <View
        style={[
          styles.staticBannerContent,
          { alignItems: textAlignment[textPosition] },
        ]}
      >
        <Text style={styles.staticBannerTitle}>{text}</Text>

        <TouchableOpacity
          style={styles.staticCtaButton}
          onPress={handleButtonClick}
        >
          <Text style={styles.staticCtaButtonText}>{ctaText}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const [products, setProducts] = useState<GridProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState('Select Location');
  const [cart, setCart] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [isStoriesFullScreen, setIsStoriesFullScreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [storiesRefreshing, setStoriesRefreshing] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [userColor, setUserColor] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0);

  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const params = route.params as { id?: string } | undefined;
  const productId = params?.id;

  const { isDark, theme } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Get gradient based on user color AND theme
  const gradientColors = getColorGradient(userColor, isDark);

  // Load user data on mount
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

          const color = await fetchUserColor(token);
          setUserColor(color);
        } else {
          const cachedColor = await AsyncStorage.getItem('userColor');
          setUserColor(cachedColor);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('Home screen focused, refreshing...');
      refreshAllData();
    }, []),
  );

  const refreshAllData = async () => {
    try {
      setRefreshing(true);
      setStoriesRefreshing(true);

      await fetchProducts();
      setStoriesRefreshKey(prev => prev + 1);

      console.log('All data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing all data:', error);
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
      console.log('Refreshing stories...');
      await new Promise<void>(resolve => {
        setTimeout(() => {
          setStoriesRefreshKey(prev => prev + 1);
          resolve();
        }, 1500);
      });
      console.log('Stories refreshed!');
    } catch (error) {
      console.error('Stories refresh error:', error);
      throw error;
    } finally {
      setStoriesRefreshing(false);
    }
  }, []);

  const checkAuthAndRedirect = async (): Promise<boolean> => {
    return await AuthUtils.checkAuthAndRedirect();
  };

  const convertToGridProducts = (apiProducts: ApiProduct[]): GridProduct[] => {
    return apiProducts.map(apiProduct => ({
      productId: apiProduct._id,
      fullProduct: {
        _id: apiProduct._id,
        title: apiProduct.title,
        brand: apiProduct.brand,
        description: apiProduct.description,
        category: apiProduct.category,
        subcategory: apiProduct.subcategory,
        mrp: apiProduct.mrp,
        price: apiProduct.price,
        discount: apiProduct.discount,
        finalPrice: apiProduct.finalPrice,
        variants: apiProduct.variants,
        averageRating: apiProduct.averageRating,
        reviewCount: apiProduct.reviewCount,
        images: apiProduct.images || [],
        seller: apiProduct.seller || null,
        likes: apiProduct.likes || 0,
        comments: apiProduct.comments || [],
        createdAt: apiProduct.createdAt || new Date().toISOString(),
        updatedAt: apiProduct.updatedAt || new Date().toISOString(),
      },
    }));
  };

  const fetchProducts = async () => {
    try {
      const isAuthenticated = await checkAuthAndRedirect();
      if (!isAuthenticated) return;

      setIsLoading(true);
      const response = await fetch(
        'http://192.168.251.121:5000/api/seller/forms/categories',
      );
      const data = await response.json();

      if (Array.isArray(data.products)) {
        let filteredApiProducts: ApiProduct[] = data.products;

        if (searchQuery) {
          filteredApiProducts = filteredApiProducts.filter((p: ApiProduct) =>
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()),
          );
        }

        const gridProducts = convertToGridProducts(filteredApiProducts);
        setProducts(gridProducts);
      } else {
        console.error('API did not return an array:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProduct = async (id: string) => {
    try {
      const isAuthenticated = await checkAuthAndRedirect();
      if (!isAuthenticated) return;

      setIsLoading(true);
      const response = await fetch(
        'http://192.168.251.121:5000/api/seller/forms/categories',
      );
      const data = await response.json();
      if (data.success && Array.isArray(data.products)) {
        const product = data.products.find((p: ProductType) => p._id === id);
        setSelectedProduct(product || null);
      } else {
        console.error('Invalid API response:', data);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setSelectedProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleAddToCart = (productId: string) => {
    setCart(prev => [...prev, productId]);
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    } else {
      setSelectedProduct(null);
      fetchProducts();
    }
  }, [productId]);

  const filteredProducts = useCallback((): GridProduct[] => {
    if (selectedCategory.toLowerCase().trim() === 'all') {
      return products;
    }
    return products.filter(
      product =>
        product.fullProduct.category?.toLowerCase().trim() ===
        selectedCategory.toLowerCase().trim(),
    );
  }, [products, selectedCategory]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />

      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          {
            top: 0,
            bottom: 0,
          },
        ]}
      />

      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Header with higher zIndex to stay on top */}
        <View style={[styles.headerWrapper, { zIndex: 10 }]}>
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
          />
        </View>

        <Animated.ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleGlobalRefresh}
              colors={isDark ? ['#7DD3FC'] : ['#3b82f6']}
              tintColor={isDark ? '#7DD3FC' : '#3b82f6'}
              title="Pull to refresh..."
              titleColor={isDark ? '#94A3B8' : '#3b82f6'}
              progressBackgroundColor={isDark ? '#1f2937' : '#ffffff'}
              progressViewOffset={
                Platform.OS === 'ios' ? insets.top + 100 : insets.top + 80
              }
            />
          }
        >
          <View
            style={[styles.scrollContent, { paddingTop: insets.top + 100 }]}
          >
            <View
              style={[
                styles.storiesContainer,
                { backgroundColor: 'transparent' },
              ]}
            >
              <ProductStories
                key={storiesRefreshKey}
                onRefresh={handleStoriesRefresh}
                onStoryEnd={() => setIsStoriesFullScreen(false)}
                onStoryChange={() => setIsStoriesFullScreen(true)}
              />
            </View>

            <View style={styles.bannerWrapper}>
              <RotatingBanner
                items={rotatingBannerItems}
                onLayout={event => {
                  setBannerHeight(event.nativeEvent.layout.height);
                }}
                isDark={isDark}
              />
            </View>

            <BrandSlider brands={brandsData} />

            <CategoryGrid />

            <Banner productsCount={products.length} />

            <View style={{ flex: 1, zIndex: 99 }}>
              <ProductGrid
                products={filteredProducts()}
                isLoading={isLoading}
                userId={userId || ''}
                refreshTrigger={refreshing}
                onRefresh={handleGlobalRefresh}
              />
            </View>

            <View style={styles.staticBannerWrapper}>
              <StaticBanner
                text={staticBannerData.text}
                image={staticBannerData.image}
                isDark={isDark}
              />
            </View>

            <Footer />
          </View>
        </Animated.ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  storiesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  bannerWrapper: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  brandSliderWrapper: {
    marginBottom: 24,
    pointerEvents: 'box-none',
  },
  staticBannerWrapper: {
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  bannerContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bannerImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textContainer: {
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ctaButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonLeft: {
    position: 'absolute',
    left: 12,
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonRight: {
    position: 'absolute',
    right: 12,
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: 'white',
    transform: [{ scale: 1.25 }],
  },
  inactiveIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
  },
  staticBannerContainer: {
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  staticBannerImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  staticBannerImage: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  staticBannerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: 20,
  },
  staticBannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 16,
  },
  staticCtaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  staticCtaButtonText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default HomeScreen;
