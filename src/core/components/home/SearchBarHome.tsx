// components/SearchBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { APIs } from '../../services/HomeService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../contexts/theme/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Define navigation param types
type RootStackParamList = {
  ProductDetail: { id: string; category: string };
  Search: { q: string };
  // Add other screens as needed
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

interface SearchResult {
  category: string;
  products: Array<{
    _id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: any[];
  }>;
}

interface PopularSearch {
  query: string;
  count: number;
}

interface RecentSearch {
  id: string;
  query: string;
  createdAt: string;
}

type Category = {
  name: string;
  backendName: string;
  icon: React.ReactElement;
};

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchResults?: (results: SearchResult[]) => void;
  userId: string;
  handleCategoryClick: (category: string) => void;
  isMobile: boolean;
  isDark?: boolean;
}

// Define styles first
const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'relative',
      marginBottom: 16,
    },
    gradientBackground: {
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      backgroundColor: 'transparent',
      borderRadius: 16,
      opacity: 0.2,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2D3748' : 'white',
      borderRadius: 16,
      paddingHorizontal: 16,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#f3f4f6',
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    clearButton: {
      padding: 4,
    },
    loadingIndicator: {
      marginLeft: 8,
    },
    suggestionsContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: 8,
      backgroundColor: isDark ? '#2D3748' : 'white',
      borderRadius: 16,
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
      maxHeight: 400,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#f3f4f6',
    },
    suggestionsScrollView: {
      maxHeight: 400,
    },
    section: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#4B5563' : '#f3f4f6',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    productCount: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#6b7280',
    },
    clearAllText: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#6b7280',
    },
    resultsContainer: {
      gap: 16,
    },
    categorySection: {
      gap: 8,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#7DD3FC' : '#0d9488',
    },
    productsList: {
      gap: 8,
    },
    productItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#f9fafb',
    },
    productImage: {
      width: 40,
      height: 40,
      borderRadius: 8,
    },
    productImagePlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: isDark ? '#4B5563' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    productInfo: {
      flex: 1,
      gap: 2,
    },
    productTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    productDescription: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#6b7280',
    },
    productPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#7DD3FC' : '#0d9488',
    },
    viewAllButton: {
      padding: 12,
      backgroundColor: isDark ? '#374151' : '#f0fdfa',
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    viewAllButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#7DD3FC' : '#0d9488',
    },
    noResultsContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      gap: 8,
    },
    noResultsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    noResultsText: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6b7280',
      textAlign: 'center',
    },
    searchesList: {
      gap: 8,
    },
    searchItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? '#374151' : '#f9fafb',
    },
    searchText: {
      flex: 1,
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#374151',
      fontWeight: '500',
    },
    removeButton: {
      padding: 8,
    },
    searchCount: {
      backgroundColor: isDark ? '#4B5563' : '#f3f4f6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    searchCountText: {
      fontSize: 10,
      color: isDark ? '#94A3B8' : '#6b7280',
      fontWeight: '500',
    },
    viewMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? '#374151' : '#f9fafb',
    },
    viewMoreText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#7DD3FC' : '#0d9488',
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? '#374151' : '#f8fafc',
      flex: 1,
      minWidth: (screenWidth - 64) / 3 - 16,
      maxWidth: (screenWidth - 64) / 2 - 16,
    },
    categoryButtonSelected: {
      backgroundColor: isDark ? '#0D9488' : '#0d9488',
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '500',
      color: isDark ? '#D1D5DB' : '#374151',
      flex: 1,
    },
    categoryTextSelected: {
      color: 'white',
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

// ✅ Fix: Explicit typing for categoriesData
interface CategoryData {
  name: string;
  iconName: string;
  color: string[];
}

const categoriesData: CategoryData[] = [
  { name: 'Cars', iconName: 'car', color: ['#3b82f6', '#06b6d4'] },
  { name: 'Mobiles', iconName: 'smartphone', color: ['#8b5cf6', '#ec4899'] },
  { name: 'Properties', iconName: 'business', color: ['#f97316', '#ef4444'] },
  { name: 'Electronics', iconName: 'devices', color: ['#22c55e', '#14b8a6'] },
  { name: 'Furniture', iconName: 'chair', color: ['#eab308', '#f97316'] },
  { name: 'Bikes', iconName: 'motorcycle', color: ['#ef4444', '#ec4899'] },
  { name: 'Fashion', iconName: 'tshirt', color: ['#ec4899', '#f43f5e'] },
  { name: 'Sports', iconName: 'basketball', color: ['#6366f1', '#8b5cf6'] },
  { name: 'Pets', iconName: 'paw', color: ['#f59e0b', '#eab308'] },
  { name: 'Jobs', iconName: 'work', color: ['#10b981', '#22c55e'] },
  { name: 'Services', iconName: 'build', color: ['#6b7280', '#3b82f6'] },
  { name: 'Real Estate', iconName: 'home', color: ['#f43f5e', '#ef4444'] },
];

function getCategoryIcon(
  iconName: string,
  size: number = 20,
  isDark: boolean = false,
) {
  const iconColor = isDark ? '#F1F5F9' : 'white';
  switch (iconName) {
    case 'car':
      return <Ionicons name="car-outline" size={size} color={iconColor} />;
    case 'smartphone':
      return (
        <Ionicons name="phone-portrait-outline" size={size} color={iconColor} />
      );
    case 'business':
      return <Ionicons name="business-outline" size={size} color={iconColor} />;
    case 'devices':
      return (
        <MaterialIcons name="devices-other" size={size} color={iconColor} />
      );
    case 'chair':
      return <MaterialIcons name="chair" size={size} color={iconColor} />;
    case 'motorcycle':
      return <MaterialIcons name="two-wheeler" size={size} color={iconColor} />;
    case 'tshirt':
      return <Ionicons name="shirt-outline" size={size} color={iconColor} />;
    case 'basketball':
      return (
        <Ionicons name="basketball-outline" size={size} color={iconColor} />
      );
    case 'paw':
      return <Ionicons name="paw-outline" size={size} color={iconColor} />;
    case 'work':
      return (
        <Ionicons name="briefcase-outline" size={size} color={iconColor} />
      );
    case 'build':
      return <Ionicons name="build-outline" size={size} color={iconColor} />;
    case 'home':
      return <Ionicons name="home-outline" size={size} color={iconColor} />;
    default:
      return <Ionicons name="bag-outline" size={size} color={iconColor} />;
  }
}

// Function to create categories with theme support
const createCategories = (isDark: boolean) => {
  const styles = createStyles(isDark);
  const baseCategories: Category[] = [
    {
      name: 'All',
      backendName: 'all',
      icon: (
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: isDark ? '#0D9488' : '#0d9488' },
          ]}
        >
          <Ionicons
            name="bag-outline"
            size={20}
            color={isDark ? '#F1F5F9' : 'white'}
          />
        </View>
      ),
    },
  ];

  const themeCategories: Category[] = categoriesData.map(cat => ({
    name: cat.name,
    backendName: cat.name.toLowerCase().replace(/\s+/g, '_'),
    icon: (
      <LinearGradient
        colors={cat.color}
        style={styles.categoryIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {getCategoryIcon(cat.iconName, 20, isDark)}
      </LinearGradient>
    ),
  }));

  return [...baseCategories, ...themeCategories];
};

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchResults,
  userId,
  handleCategoryClick,
  isMobile,
  isDark: parentIsDark,
}) => {
  // ✅ Fixed: Properly typed navigation
  const navigation = useNavigation<NavigationProps>();

  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-20));
  const searchRef = useRef<View>(null);

  // Get theme from ThemeContext
  const themeContext = useTheme();
  const isDark =
    parentIsDark !== undefined ? parentIsDark : themeContext?.isDark || false;

  // Create styles based on theme
  const styles = createStyles(isDark);

  // Create categories based on theme
  const categories = createCategories(isDark);

  // Animation for suggestions
  useEffect(() => {
    if (showSearchSuggestions) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSearchSuggestions]);

  const fetchRecentSearches = async () => {
    try {
      const data = await APIs.getRecentSearches();
      console.log('🔍 Recent searches API response:', data);

      if (Array.isArray(data)) {
        setRecentSearches(data);
      } else if (data && Array.isArray(data.searches)) {
        setRecentSearches(data.searches);
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        setRecentSearches([]);
      }
    } catch (error) {
      console.error('❌ Error fetching recent searches:', error);
      setRecentSearches([]);
    }
  };

  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const data = await APIs.getPopularSearches();
        const limitedSearches = (data.searches || []).slice(0, 7);
        const shuffledSearches = [...limitedSearches].sort(
          () => Math.random() - 0.5,
        );
        setPopularSearches(shuffledSearches);
      } catch (error) {
        console.error('Error fetching popular searches:', error);
      }
    };

    fetchPopularSearches();
    fetchRecentSearches();

    const interval = setInterval(fetchPopularSearches, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showSearchSuggestions) {
      const fetchPopularSearches = async () => {
        try {
          const data = await APIs.getPopularSearches();
          const limitedSearches = (data.searches || []).slice(0, 7);
          const shuffledSearches = [...limitedSearches].sort(
            () => Math.random() - 0.5,
          );
          setPopularSearches(shuffledSearches);
        } catch (error) {
          console.error('Error fetching popular searches:', error);
        }
      };
      fetchPopularSearches();
    }
  }, [showSearchSuggestions]);

  const handleSearch = async (query: string, category?: string) => {
    setSearchQuery(query);

    if (query.length === 0) {
      setSearchResults([]);
      setShowSearchSuggestions(true);
      await fetchRecentSearches();
      return;
    }

    if (query.length > 2 || category) {
      try {
        setSearchLoading(true);
        const results = await APIs.searchProducts(
          query,
          category || selectedCategory,
        );

        if (results.success) {
          setSearchResults(results.results || []);
          if (onSearchResults) {
            onSearchResults(results.results || []);
          }
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const handleRemoveRecentSearch = async (searchId: string) => {
    try {
      await APIs.removeRecentSearch(searchId);
      await fetchRecentSearches();
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  };

  const handleClearAllRecentSearches = async () => {
    try {
      const data = await APIs.clearAllRecentSearches();
      if (data.success) {
        setRecentSearches([]);
        setShowAllRecent(false);
      }
    } catch (error: any) {
      console.error('Error clearing recent searches:', error.message || error);
    }
  };

  const handleSearchFocus = () => {
    setShowSearchSuggestions(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSearchSuggestions(false);
    }, 300);
  };

  const handlePopularSearchClick = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory('');
    handleSearch(query);
    setShowSearchSuggestions(false);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory('');
    handleSearch(query);
    setShowSearchSuggestions(false);
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setSearchQuery(categoryName);
    handleCategoryClick(categoryName);
    handleSearch(categoryName, categoryName);
    setShowSearchSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCategory('');
    setShowSearchSuggestions(true);
    if (onSearchResults) {
      onSearchResults([]);
    }
    fetchRecentSearches();
  };

  // ✅ Fixed: Navigation without type assertions
  const navigateToProduct = (product: any) => {
    navigation.navigate('ProductDetail', {
      id: product._id,
      category: product.category,
    });
    setShowSearchSuggestions(false);
  };

  const navigateToSearch = (query: string) => {
    navigation.navigate('Search', {
      q: query,
    });
    setShowSearchSuggestions(false);
  };

  const getProductImageUrl = (images: any[]): string => {
    if (!images || images.length === 0) return '';

    const firstImage = images[0];

    if (typeof firstImage === 'string') {
      return firstImage;
    }

    if (firstImage && firstImage.urls && firstImage.urls.length > 0) {
      return firstImage.urls[0];
    }

    if (firstImage && firstImage.url) {
      return firstImage.url;
    }

    return '';
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTotalProductsCount = (): number => {
    return searchResults.reduce((total, categoryResult) => {
      return total + (categoryResult?.products?.length || 0);
    }, 0);
  };

  const getDisplayedRecentSearches = () => {
    if (showAllRecent) {
      return recentSearches;
    }
    return recentSearches.slice(0, 8);
  };

  const getDisplayedPopularSearches = () => {
    if (showAllPopular) {
      return popularSearches;
    }
    return popularSearches.slice(0, 3);
  };

  const renderSearchResults = () => {
    if (searchQuery.length > 0 && searchResults.length > 0) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            <Text style={styles.productCount}>
              {getTotalProductsCount()} products found
            </Text>
          </View>
          <View style={styles.resultsContainer}>
            {searchResults.map(categoryResult => (
              <View
                key={categoryResult.category}
                style={styles.categorySection}
              >
                <Text style={styles.categoryTitle}>
                  {categoryResult.category}
                </Text>
                <View style={styles.productsList}>
                  {categoryResult.products.slice(0, 3).map(product => {
                    const imageUrl = getProductImageUrl(product.images);
                    return (
                      <TouchableOpacity
                        key={product._id}
                        style={styles.productItem}
                        onPress={() => navigateToProduct(product)}
                      >
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.productImage}
                            onError={() => console.log('Image load error')}
                          />
                        ) : (
                          <View style={styles.productImagePlaceholder}>
                            <Ionicons
                              name="bag-outline"
                              size={20}
                              color={isDark ? '#94A3B8' : '#9ca3af'}
                            />
                          </View>
                        )}
                        <View style={styles.productInfo}>
                          <Text style={styles.productTitle} numberOfLines={1}>
                            {product.title}
                          </Text>
                          <Text
                            style={styles.productDescription}
                            numberOfLines={1}
                          >
                            {product.description}
                          </Text>
                        </View>
                        <Text style={styles.productPrice}>
                          {formatPrice(product.price)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
          {getTotalProductsCount() > 5 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                navigateToSearch(searchQuery);
              }}
            >
              <Text style={styles.viewAllButtonText}>View All Results</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    } else if (searchQuery.length > 2) {
      return (
        <View style={styles.section}>
          <View style={styles.noResultsContainer}>
            <Ionicons
              name="search-outline"
              size={40}
              color={isDark ? '#94A3B8' : '#9ca3af'}
            />
            <Text style={styles.noResultsTitle}>No products found</Text>
            <Text style={styles.noResultsText}>
              Can't find "{searchQuery}"? Try a different search term
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderRecentSearches = () => {
    if (searchQuery.length === 0 && recentSearches.length > 0) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="time-outline"
                size={18}
                color={isDark ? '#94A3B8' : '#6b7280'}
              />
              <Text style={styles.sectionTitle}>Recent Searches</Text>
            </View>
            <TouchableOpacity onPress={handleClearAllRecentSearches}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchesList}>
            {getDisplayedRecentSearches().map(search => (
              <View key={search.id} style={styles.searchItem}>
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => handleRecentSearchClick(search.query)}
                >
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={isDark ? '#94A3B8' : '#6b7280'}
                  />
                  <Text style={styles.searchText} numberOfLines={1}>
                    {search.query}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveRecentSearch(search.id)}
                >
                  <Ionicons
                    name="close"
                    size={16}
                    color={isDark ? '#94A3B8' : '#6b7280'}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {recentSearches.length > 8 && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => setShowAllRecent(!showAllRecent)}
            >
              <Text style={styles.viewMoreText}>
                {showAllRecent
                  ? 'View Less'
                  : `View More (${recentSearches.length - 8} more)`}
              </Text>
              <Ionicons
                name={showAllRecent ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={isDark ? '#7DD3FC' : '#0d9488'}
              />
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return null;
  };

  const renderPopularSearches = () => {
    if (searchQuery.length === 0 && popularSearches.length > 0) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="trending-up-outline"
                size={18}
                color={isDark ? '#94A3B8' : '#6b7280'}
              />
              <Text style={styles.sectionTitle}>Popular Searches</Text>
            </View>
          </View>
          <View style={styles.searchesList}>
            {getDisplayedPopularSearches().map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.searchButton}
                onPress={() => handlePopularSearchClick(search.query)}
              >
                <Ionicons
                  name="trending-up-outline"
                  size={16}
                  color={isDark ? '#94A3B8' : '#6b7280'}
                />
                <Text style={styles.searchText} numberOfLines={1}>
                  {search.query}
                </Text>
                <View style={styles.searchCount}>
                  <Text style={styles.searchCountText}>
                    {search.count} searches
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {popularSearches.length > 3 && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => setShowAllPopular(!showAllPopular)}
            >
              <Text style={styles.viewMoreText}>
                {showAllPopular
                  ? 'View Less'
                  : `View More (${popularSearches.length - 3} more)`}
              </Text>
              <Ionicons
                name={showAllPopular ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={isDark ? '#7DD3FC' : '#0d9488'}
              />
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return null;
  };

  const renderQuickCategories = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Categories</Text>
      <View style={styles.categoriesGrid}>
        {categories.slice(0, 6).map(category => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryButton,
              selectedCategory === category.name &&
                styles.categoryButtonSelected,
            ]}
            onPress={() => handleCategorySelect(category.name)}
          >
            {category.icon}
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.name &&
                  styles.categoryTextSelected,
              ]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container} ref={searchRef}>
      {/* Gradient Background Effect */}
      <View style={styles.gradientBackground} />

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={
            searchLoading
              ? isDark
                ? '#7DD3FC'
                : '#0d9488'
              : isDark
              ? '#94A3B8'
              : '#6b7280'
          }
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="What are you looking for today? Search products...🔎"
          placeholderTextColor={isDark ? '#94A3B8' : '#9ca3af'}
          value={searchQuery}
          onChangeText={text => handleSearch(text)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.clearButton}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? '#94A3B8' : '#6b7280'}
            />
          </TouchableOpacity>
        ) : null}
        {searchLoading && (
          <ActivityIndicator
            size="small"
            color={isDark ? '#7DD3FC' : '#0d9488'}
            style={styles.loadingIndicator}
          />
        )}
      </View>

      {showSearchSuggestions && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.suggestionsScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {renderSearchResults()}
            {renderRecentSearches()}
            {renderPopularSearches()}
            {renderQuickCategories()}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

export default SearchBar;
