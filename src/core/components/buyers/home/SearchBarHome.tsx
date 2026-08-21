// components/SearchBar.tsx - MIGRATED TO BUILT-IN ANIMATED
import React, { JSX, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Keyboard,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
  Animated, // ✅ Built-in Animated from react-native
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { useSearch } from '../../../hooks/useSearch';
import { searchService } from '../../../services/buyers/home/searchService';
import {
  getUserIdFromToken,
  placeholderWords,
  getNextWordIndex,
} from '../../../utils/home/searchUtils';
import FilterDropdown from './common/FilterDropDownHome';
import CartButton from './CartButtonHome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (screenWidth - 16 * 2 - CARD_GAP) / 2;

const CARD_TINTS_LIGHT = ['#FEF9C3', '#DCFCE7', '#FCE7F3', '#DBEAFE'];
const CARD_TINTS_DARK = ['#3F3A1E', '#1E3A2E', '#3A1E33', '#1E2A3A'];

type RootStackParamList = {
  ProductDetail: { id: string; category: string };
  Search: { q: string };
  CartScreen: undefined;
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchResults?: (results: any[]) => void;
  userId: string;
  handleCategoryClick: (category: string) => void;
  isMobile: boolean;
  isDark?: boolean;
}

// Custom hook for placeholder animation
const usePlaceholderAnimation = (isActive: boolean) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayWord, setDisplayWord] = useState(placeholderWords[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextWordIndex = getNextWordIndex(
    currentWordIndex,
    placeholderWords.length,
  );
  const nextWord = placeholderWords[nextWordIndex];

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setCurrentWordIndex(prev =>
      getNextWordIndex(prev, placeholderWords.length),
    );
  };

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (!isAnimating) setIsAnimating(true);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isAnimating]);

  useEffect(() => {
    setDisplayWord(placeholderWords[currentWordIndex]);
  }, [currentWordIndex]);

  return {
    displayWord,
    isAnimating,
    nextWord,
    handleAnimationComplete,
    setDisplayWord,
  };
};

// Animated Word Component - Using built-in Animated API
const AnimatedWord: React.FC<{
  word: string;
  isAnimating: boolean;
  onAnimationComplete: () => void;
  textStyle: any;
  containerStyle: any;
  setWord: (word: string) => void;
  nextWord: string;
}> = ({
  word,
  isAnimating,
  onAnimationComplete,
  textStyle,
  containerStyle,
  setWord,
  nextWord,
}) => {
  // Use built-in Animated.Value
  const translateY = new Animated.Value(0);
  const opacity = new Animated.Value(1);

  useEffect(() => {
    if (isAnimating) {
      // First animation: slide up and fade out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -40,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Change word after animation completes
        setWord(nextWord);

        // Second animation: slide down and fade in
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onAnimationComplete();
        });
      });
    }
  }, [isAnimating]);

  return (
    <View style={containerStyle}>
      <Animated.Text
        style={[
          textStyle,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        {word}
      </Animated.Text>
    </View>
  );
};

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchResults,
  userId: propUserId,
  handleCategoryClick,
  isMobile,
  isDark: propIsDark,
}) => {
  const navigation = useNavigation<NavigationProps>();
  const themeContext = useTheme();
  const insets = useSafeAreaInsets();
  const isDark =
    propIsDark !== undefined ? propIsDark : themeContext?.isDark || false;
  const styles = createStyles(isDark);
  const cardTints = isDark ? CARD_TINTS_DARK : CARD_TINTS_LIGHT;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [actualUserId, setActualUserId] = useState<string | null>(
    propUserId || null,
  );
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Main search bar placeholder animation
  const mainPlaceholder = usePlaceholderAnimation(true);

  // Modal placeholder animation
  const modalPlaceholder = usePlaceholderAnimation(modalVisible);

  const modalInputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const {
    searchResults,
    searchLoading,
    popularSearches,
    recentSearches,
    showAllRecent,
    showAllPopular,
    setShowAllRecent,
    setShowAllPopular,
    handleSearch,
    handleRemoveRecentSearch,
    handleClearAllRecentSearches,
    getTotalProductsCount,
    clearSearch,
  } = useSearch();

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const loadUserId = async () => {
      if (!propUserId) {
        const extractedUserId = await getUserIdFromToken();
        if (extractedUserId) setActualUserId(extractedUserId);
      }
    };
    loadUserId();
  }, [propUserId]);

  const openSearchModal = () => {
    setModalVisible(true);
    setModalSearchQuery('');
    setTimeout(() => {
      modalInputRef.current?.focus();
    }, 300);
  };

  const closeSearchModal = () => {
    Keyboard.dismiss();
    setModalVisible(false);
    // ✅ Clear search query when modal closes - NO API CALL
    setModalSearchQuery('');
    setSearchQuery('');
    clearSearch(); // ✅ Only clears local state
    setShowAllRecent(false);
    setShowAllPopular(false);
    // Clear any search results from parent
    if (onSearchResults) {
      onSearchResults([]);
    }
  };

  const handleSearchSubmit = async (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      await handleSearch(query);
      if (onSearchResults) onSearchResults(searchResults);
      closeSearchModal();
    }
  };

  const handleSuggestionClick = async (query: string) => {
    setModalSearchQuery(query);
    await handleSearch(query);
    setSearchQuery(query);
    if (onSearchResults) onSearchResults(searchResults);
    closeSearchModal();
  };

  const handleSearchWithLogs = (text: string) => {
    setModalSearchQuery(text);
    if (text.trim()) {
      handleSearch(text); // ✅ API call only when user types
    } else {
      clearSearch(); // ✅ NO API call when empty
    }
  };

  const navigateToProduct = (product: any) => {
    navigation.navigate('ProductDetail', {
      id: product._id,
      category: product.category,
    });
    closeSearchModal();
  };

  const navigateToSearch = (query: string) => {
    navigation.navigate('Search', { q: query });
    closeSearchModal();
  };

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // ── Handle tap outside to dismiss keyboard ──────────────────────
  const handleOutsideTap = () => {
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    }
  };

  // ── Get variant display info ──────────────────────────────────────
  const getVariantDisplay = (product: any) => {
    const variant = product.variant || product;
    const parts: string[] = [];

    if (variant.weight) {
      const unit = variant.weightUnit === 'KG' ? 'kg' : 'g';
      parts.push(`${variant.weight}${unit}`);
    }

    if (variant.gstRate) {
      parts.push(`GST ${variant.gstRate}%`);
    }

    if (variant.inStock !== undefined) {
      parts.push(variant.inStock ? 'In Stock' : 'Out of Stock');
    }

    if (
      variant.quantityAvailable !== undefined &&
      variant.quantityAvailable > 0
    ) {
      parts.push(`${variant.quantityAvailable} units`);
    }

    if (variant.manufacturer !== undefined) {
      parts.push(variant.manufacturer ? 'Mfg' : 'Imported');
    }

    if (variant.cashOnDelivery !== undefined) {
      parts.push(variant.cashOnDelivery ? 'COD' : 'No COD');
    }

    if (variant.deliveryVehicleType !== undefined) {
      parts.push(variant.deliveryVehicleType ? '2-Wheeler' : '4-Wheeler');
    }

    if (variant.productQuality !== undefined) {
      parts.push(variant.productQuality ? 'Premium' : 'Standard');
    }

    if (parts.length === 0) {
      if (product.rating) parts.push(`★ ${product.rating}`);
      if (product.prepTime) parts.push(`⏱ ${product.prepTime}`);
      if (product.weight) {
        const unit = product.unit || 'g';
        parts.push(`${product.weight}${unit}`);
      }
    }

    return parts;
  };

  // ── Render variant tags as badges ──────────────────────────────────
  const renderVariantBadges = (product: any) => {
    const variant = product.variant || product;
    const badges: JSX.Element[] = [];

    if (variant.weight) {
      const unit = variant.weightUnit === 'KG' ? 'kg' : 'g';
      badges.push(
        <View key="weight" style={styles.variantBadge}>
          <Text style={styles.variantBadgeText}>
            {variant.weight}
            {unit}
          </Text>
        </View>,
      );
    }

    if (variant.gstRate) {
      badges.push(
        <View key="gst" style={[styles.variantBadge, styles.gstBadge]}>
          <Text style={styles.variantBadgeText}>GST {variant.gstRate}%</Text>
        </View>,
      );
    }

    if (variant.inStock !== undefined) {
      badges.push(
        <View
          key="stock"
          style={[
            styles.variantBadge,
            variant.inStock ? styles.inStockBadge : styles.outOfStockBadge,
          ]}
        >
          <Text style={styles.variantBadgeText}>
            {variant.inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>,
      );
    }

    if (variant.manufacturer !== undefined) {
      badges.push(
        <View key="mfg" style={[styles.variantBadge, styles.mfgBadge]}>
          <Text style={styles.variantBadgeText}>
            {variant.manufacturer ? 'Mfg' : 'Imported'}
          </Text>
        </View>,
      );
    }

    if (variant.cashOnDelivery !== undefined && variant.cashOnDelivery) {
      badges.push(
        <View key="cod" style={[styles.variantBadge, styles.codBadge]}>
          <Text style={styles.variantBadgeText}>COD</Text>
        </View>,
      );
    }

    if (variant.productQuality !== undefined && variant.productQuality) {
      badges.push(
        <View key="quality" style={[styles.variantBadge, styles.qualityBadge]}>
          <Text style={styles.variantBadgeText}>Premium</Text>
        </View>,
      );
    }

    return badges.length > 0 ? (
      <View style={styles.variantBadgesContainer}>{badges}</View>
    ) : null;
  };

  // ── Compact "matched" row ──────────────────────────────────────────
  const renderMatchRow = (product: any) => {
    const variantParts = getVariantDisplay(product);
    const imageUrl = searchService.getProductImageUrl(product.images);

    return (
      <TouchableOpacity
        key={product._id}
        style={styles.matchRow}
        onPress={() => navigateToProduct(product)}
        activeOpacity={0.7}
      >
        <View style={styles.matchThumbWrapper}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.matchThumb} />
          ) : (
            <View style={[styles.matchThumb, styles.matchThumbPlaceholder]}>
              <Ionicons name="image-outline" size={18} color="#9ca3af" />
            </View>
          )}
        </View>
        <View style={styles.matchRowContent}>
          <Text style={styles.matchRowTitle} numberOfLines={1}>
            {product.title}
          </Text>
          {variantParts.length > 0 && (
            <View style={styles.matchRowMetaContainer}>
              {variantParts.slice(0, 3).map((part, index) => (
                <Text key={index} style={styles.matchRowMeta}>
                  {part}
                  {index < Math.min(variantParts.length, 3) - 1 ? '  •  ' : ''}
                </Text>
              ))}
              {variantParts.length > 3 && (
                <Text style={styles.matchRowMeta}>
                  +{variantParts.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Product grid card - NO + BUTTON ──────────────────────────────
  const renderProductCard = (product: any, index: number) => {
    const imageUrl = searchService.getProductImageUrl(product.images);
    const tint = cardTints[index % cardTints.length];
    const variant = product.variant || product;

    return (
      <TouchableOpacity
        key={product._id}
        style={[styles.gridCard, { backgroundColor: tint }]}
        onPress={() => navigateToProduct(product)}
        activeOpacity={0.85}
      >
        {product.discount > 0 && (
          <View style={styles.gridDiscountBadge}>
            <Text style={styles.gridDiscountText}>
              {Math.round(product.discount)}% OFF
            </Text>
          </View>
        )}
        <View style={styles.gridImageWrapper}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.gridImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="image-outline" size={32} color="#9ca3af" />
          )}
        </View>
        <Text style={styles.gridTitle} numberOfLines={1}>
          {product.title}
        </Text>

        {renderVariantBadges(product)}

        <View style={styles.gridBottomRow}>
          <View style={styles.gridPriceRow}>
            <Text style={styles.gridPrice}>
              ₹{product.finalPrice || product.price || 0}
            </Text>
            {product.mrp > product.finalPrice && (
              <Text style={styles.gridMrp}>₹{product.mrp}</Text>
            )}
          </View>
          {variant.inStock !== undefined && !variant.inStock && (
            <Text style={styles.gridOutOfStock}>Out of stock</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHorizontalSuggestions = () => {
    const recentToShow = recentSearches.slice(0, 5);
    const popularToShow = popularSearches.slice(0, 5);
    if (recentToShow.length === 0 && popularToShow.length === 0) return null;

    return (
      <View style={styles.horizontalScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
        >
          {recentToShow.map(search => (
            <TouchableOpacity
              key={search.id}
              style={[styles.suggestionChip, styles.recentChip]}
              onPress={() => handleSuggestionClick(search.query)}
            >
              <Ionicons
                name="time-outline"
                size={15}
                color={isDark ? '#94A3B8' : '#6b7280'}
              />
              <Text style={styles.suggestionChipText} numberOfLines={1}>
                {search.query}
              </Text>
            </TouchableOpacity>
          ))}
          {popularToShow.map((search, index) => (
            <TouchableOpacity
              key={`popular-${index}`}
              style={[styles.suggestionChip, styles.trendingChip]}
              onPress={() => handleSuggestionClick(search.query)}
            >
              <Ionicons
                name="trending-up-outline"
                size={15}
                color={isDark ? '#7DD3FC' : '#0d9488'}
              />
              <Text style={styles.suggestionChipText} numberOfLines={1}>
                {search.query}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderModalContent = () => {
    if (modalSearchQuery.length > 0 && searchResults.length > 0) {
      const allProducts = searchResults.flatMap((c: any) => c.products);

      return (
        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {searchResults.map((categoryResult: any) => {
            const isExpanded = !!expandedCategories[categoryResult.category];
            const rowsToShow = isExpanded
              ? categoryResult.products
              : categoryResult.products.slice(0, 5);

            return (
              <View key={categoryResult.category} style={styles.matchSection}>
                <View style={styles.matchSectionHeader}>
                  <Text style={styles.matchSectionTitle}>
                    {categoryResult.products.length} result
                    {categoryResult.products.length !== 1 ? 's' : ''} for{' '}
                    <Text style={styles.matchSectionCategory}>
                      {categoryResult.category}
                    </Text>
                  </Text>
                  {categoryResult.products.length > 5 && (
                    <TouchableOpacity
                      onPress={() =>
                        toggleCategoryExpanded(categoryResult.category)
                      }
                    >
                      <Text style={styles.seeMoreText}>
                        {isExpanded ? 'See less' : 'See more'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.matchSectionSubtitle}>
                  Items we found under this category
                </Text>
                <View style={styles.matchRowsList}>
                  {rowsToShow.map((product: any) => renderMatchRow(product))}
                </View>
              </View>
            );
          })}

          <View style={styles.gridSection}>
            <View style={styles.gridSectionHeader}>
              <Text style={styles.gridSectionTitle}>
                Showing results for "{modalSearchQuery}"
              </Text>
              <Text style={styles.resultsCount}>
                {getTotalProductsCount()} found
              </Text>
            </View>
            <View style={styles.gridWrap}>
              {allProducts.map((product: any, index: number) =>
                renderProductCard(product, index),
              )}
            </View>
            {getTotalProductsCount() > 10 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigateToSearch(modalSearchQuery)}
              >
                <Text style={styles.viewAllButtonText}>View All Results</Text>
                <Ionicons name="arrow-forward" size={18} color="#0d9488" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      );
    }

    if (modalSearchQuery.length > 2) {
      return (
        <ScrollView style={styles.modalContent}>
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={60} color="#9ca3af" />
            <Text style={styles.noResultsTitle}>No products found</Text>
            <Text style={styles.noResultsText}>
              Can't find "{modalSearchQuery}"? Try a different search term
            </Text>
          </View>
        </ScrollView>
      );
    }

    const displayedRecent = showAllRecent
      ? recentSearches
      : recentSearches.slice(0, 5);
    const displayedPopular = showAllPopular
      ? popularSearches
      : popularSearches.slice(0, 5);

    return (
      <ScrollView
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderHorizontalSuggestions()}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="time-outline" size={20} color="#6b7280" />
                <Text style={styles.sectionTitle}>Recent Searches</Text>
              </View>
              <TouchableOpacity onPress={handleClearAllRecentSearches}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchesList}>
              {displayedRecent.map(search => (
                <View key={search.id} style={styles.searchItem}>
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => handleSuggestionClick(search.query)}
                  >
                    <Ionicons name="time-outline" size={20} color="#6b7280" />
                    <Text style={styles.searchText} numberOfLines={1}>
                      {search.query}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveRecentSearch(search.id)}
                  >
                    <Ionicons name="close" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {recentSearches.length > 5 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => setShowAllRecent(!showAllRecent)}
              >
                <Text style={styles.viewMoreText}>
                  {showAllRecent
                    ? 'View Less'
                    : `View More (${recentSearches.length - 5} more)`}
                </Text>
                <Ionicons
                  name={showAllRecent ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#0d9488"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
        {popularSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons
                  name="trending-up-outline"
                  size={20}
                  color="#0d9488"
                />
                <Text style={styles.sectionTitle}>Popular Searches</Text>
              </View>
            </View>
            <View style={styles.searchesList}>
              {displayedPopular.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchButton}
                  onPress={() => handleSuggestionClick(search.query)}
                >
                  <Ionicons
                    name="trending-up-outline"
                    size={20}
                    color="#0d9488"
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
            {popularSearches.length > 5 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => setShowAllPopular(!showAllPopular)}
              >
                <Text style={styles.viewMoreText}>
                  {showAllPopular
                    ? 'View Less'
                    : `View More (${popularSearches.length - 5} more)`}
                </Text>
                <Ionicons
                  name={showAllPopular ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#0d9488"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <>
      <View style={styles.mainContainer}>
        <TouchableOpacity
          style={styles.searchWrapper}
          activeOpacity={0.7}
          onPress={openSearchModal}
        >
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={19}
              color={isDark ? '#94A3B8' : '#6b7280'}
              style={styles.searchIcon}
            />
            <View style={styles.inputWrapper}>
              {!searchQuery && (
                <View style={styles.placeholderContainer}>
                  <View style={styles.placeholderTextWrapper}>
                    <Text style={styles.staticText}>You want </Text>
                    <AnimatedWord
                      word={mainPlaceholder.displayWord}
                      isAnimating={mainPlaceholder.isAnimating}
                      onAnimationComplete={
                        mainPlaceholder.handleAnimationComplete
                      }
                      textStyle={styles.animatedWordText}
                      containerStyle={styles.animatedWordContainer}
                      setWord={mainPlaceholder.setDisplayWord}
                      nextWord={mainPlaceholder.nextWord}
                    />
                  </View>
                </View>
              )}
              <Text style={styles.searchInput}>{searchQuery}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <FilterDropdown
            selectedCategory=""
            handleCategoryClick={handleCategoryClick}
            isMobile={isMobile}
          />
          <CartButton userId={actualUserId || ''} />
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeSearchModal}
      >
        <SafeAreaView
          style={[styles.modalContainer, { paddingTop: insets.top }]}
        >
          <TouchableWithoutFeedback onPress={handleOutsideTap}>
            <View style={{ flex: 1 }}>
              <View style={styles.modalTopBar}>
                <TouchableOpacity
                  onPress={closeSearchModal}
                  style={styles.backButton}
                >
                  <Ionicons
                    name="arrow-back"
                    size={22}
                    color={isDark ? '#F1F5F9' : '#1f2937'}
                  />
                </TouchableOpacity>
                <Text style={styles.modalTopBarTitle}>Search</Text>
                <View style={styles.backButtonSpacer} />
              </View>

              <View style={styles.modalHeader}>
                <View style={styles.modalSearchContainer}>
                  <Ionicons
                    name="search"
                    size={19}
                    color={isDark ? '#94A3B8' : '#6b7280'}
                    style={styles.modalSearchIcon}
                  />
                  <View style={{ flex: 1, position: 'relative' }}>
                    {!modalSearchQuery && (
                      <View style={styles.modalPlaceholderContainer}>
                        <View style={styles.modalPlaceholderTextWrapper}>
                          <Text style={styles.modalStaticText}>You want </Text>
                          <AnimatedWord
                            word={modalPlaceholder.displayWord}
                            isAnimating={modalPlaceholder.isAnimating}
                            onAnimationComplete={
                              modalPlaceholder.handleAnimationComplete
                            }
                            textStyle={styles.modalAnimatedWordText}
                            containerStyle={styles.modalAnimatedWordContainer}
                            setWord={modalPlaceholder.setDisplayWord}
                            nextWord={modalPlaceholder.nextWord}
                          />
                        </View>
                      </View>
                    )}
                    <TextInput
                      ref={modalInputRef}
                      style={styles.modalSearchInput}
                      placeholder=""
                      placeholderTextColor="transparent"
                      value={modalSearchQuery}
                      onChangeText={handleSearchWithLogs}
                      returnKeyType="search"
                      onSubmitEditing={() =>
                        handleSearchSubmit(modalSearchQuery)
                      }
                      autoFocus={true}
                      textAlignVertical="center"
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  </View>
                  {modalSearchQuery ? (
                    <TouchableOpacity
                      onPress={() => {
                        setModalSearchQuery('');
                        clearSearch();
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={isDark ? '#94A3B8' : '#9CA3AF'}
                      />
                    </TouchableOpacity>
                  ) : null}
                  {searchLoading && (
                    <ActivityIndicator
                      size="small"
                      color="#0d9488"
                      style={styles.loadingIndicator}
                    />
                  )}
                </View>
              </View>

              {renderModalContent()}
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    mainContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
      paddingHorizontal: 15,
    },
    searchWrapper: { flex: 8, position: 'relative' },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#F1F5F4',
      borderRadius: 24,
      paddingHorizontal: 18,
      height: 46,
    },
    searchIcon: { marginRight: 10 },
    inputWrapper: {
      flex: 1,
      position: 'relative',
      justifyContent: 'center',
      height: 46,
      overflow: 'hidden',
    },
    placeholderContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      pointerEvents: 'none',
      overflow: 'hidden',
    },
    placeholderTextWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 46,
      overflow: 'hidden',
    },
    staticText: {
      fontSize: 13,
      fontWeight: '400',
      color: isDark ? '#94A3B8' : '#6b7280',
    },
    animatedWordContainer: {
      height: 46,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    animatedWordText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#0d9488',
      includeFontPadding: false,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '400',
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    modalContainer: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    },
    modalTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    backButton: { padding: 8, width: 38 },
    backButtonSpacer: { width: 38 },
    modalTopBarTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#111827',
    },

    modalHeader: { paddingHorizontal: 16, paddingBottom: 12 },
    modalSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#F3F4F6',
      borderRadius: 22,
      paddingHorizontal: 16,
      height: 46,
      gap: 10,
    },
    modalSearchIcon: {},
    modalPlaceholderContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      pointerEvents: 'none',
      overflow: 'hidden',
    },
    modalPlaceholderTextWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 46,
      overflow: 'hidden',
    },
    modalStaticText: {
      fontSize: 14,
      fontWeight: '400',
      color: isDark ? '#94A3B8' : '#9CA3AF',
    },
    modalAnimatedWordContainer: {
      height: 46,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    modalAnimatedWordText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0d9488',
      includeFontPadding: false,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '400',
      color: isDark ? '#F1F5F9' : '#1f2937',
      height: 46,
    },
    loadingIndicator: { marginLeft: 4 },
    modalContent: { flex: 1 },

    matchSection: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
    matchSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    matchSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#374151',
    },
    matchSectionCategory: {
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#111827',
    },
    seeMoreText: { fontSize: 12, fontWeight: '600', color: '#0d9488' },
    matchSectionSubtitle: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#9CA3AF',
      marginTop: 2,
      marginBottom: 10,
    },
    matchRowsList: { gap: 2 },
    matchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
    },
    matchRowContent: {
      flex: 1,
    },
    matchThumbWrapper: {
      width: 40,
      height: 40,
      borderRadius: 10,
      overflow: 'hidden',
    },
    matchThumb: { width: 40, height: 40 },
    matchThumbPlaceholder: {
      backgroundColor: isDark ? '#334155' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    matchRowTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    matchRowMetaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 2,
    },
    matchRowMeta: {
      fontSize: 11,
      color: isDark ? '#94A3B8' : '#6b7280',
    },

    variantBadgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 4,
      marginBottom: 6,
    },
    variantBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: isDark ? '#334155' : '#E5E7EB',
    },
    variantBadgeText: {
      fontSize: 9,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#374151',
    },
    gstBadge: {
      backgroundColor: isDark ? '#1E3A2E' : '#D1FAE5',
    },
    inStockBadge: {
      backgroundColor: isDark ? '#1E3A2E' : '#D1FAE5',
    },
    outOfStockBadge: {
      backgroundColor: isDark ? '#3A1E1E' : '#FEE2E2',
    },
    mfgBadge: {
      backgroundColor: isDark ? '#1E2A3A' : '#DBEAFE',
    },
    codBadge: {
      backgroundColor: isDark ? '#2A1E3A' : '#F3E8FF',
    },
    qualityBadge: {
      backgroundColor: isDark ? '#3A2A1E' : '#FEF3C7',
    },

    gridSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
    gridSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 12,
    },
    gridSectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#111827',
    },
    resultsCount: { fontSize: 12, color: isDark ? '#94A3B8' : '#6b7280' },
    gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
    gridCard: {
      width: CARD_WIDTH,
      borderRadius: 18,
      padding: 12,
      position: 'relative',
    },
    gridDiscountBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: '#DC2626',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      zIndex: 2,
    },
    gridDiscountText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
    gridImageWrapper: {
      height: 88,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    gridImage: { width: '100%', height: '100%' },
    gridTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: 4,
    },
    gridBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    gridPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    gridPrice: { fontSize: 15, fontWeight: '700', color: '#111827' },
    gridMrp: {
      fontSize: 11,
      color: '#6b7280',
      textDecorationLine: 'line-through',
    },
    gridOutOfStock: {
      fontSize: 10,
      fontWeight: '600',
      color: '#DC2626',
      marginTop: 2,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 14,
      borderRadius: 14,
      backgroundColor: isDark ? '#1E293B' : '#F0FDFA',
      borderWidth: 1,
      borderColor: '#0d9488',
      marginTop: 8,
    },
    viewAllButtonText: { fontSize: 14, fontWeight: '600', color: '#0d9488' },

    noResultsContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 12,
    },
    noResultsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    noResultsText: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6b7280',
      textAlign: 'center',
    },

    horizontalScrollContainer: { paddingVertical: 12 },
    horizontalScroll: { paddingHorizontal: 16 },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#F3F4F6',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginRight: 10,
      gap: 7,
    },
    suggestionChipText: { fontSize: 13, color: isDark ? '#F1F5F9' : '#374151' },
    recentChip: { backgroundColor: isDark ? '#1E293B' : '#F9FAFB' },
    trendingChip: { backgroundColor: isDark ? '#164E4A' : '#F0FDFA' },

    section: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1E293B' : '#F3F4F6',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    clearAllText: { fontSize: 12, color: isDark ? '#94A3B8' : '#6b7280' },
    searchesList: { gap: 10 },
    searchItem: { flexDirection: 'row', alignItems: 'center' },
    searchButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? '#1E293B' : '#F9FAFB',
    },
    searchText: {
      flex: 1,
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#374151',
      fontWeight: '500',
    },
    removeButton: { padding: 8 },
    searchCount: {
      backgroundColor: isDark ? '#334155' : '#F3F4F6',
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
      backgroundColor: isDark ? '#1E293B' : '#F9FAFB',
      marginTop: 12,
    },
    viewMoreText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#7DD3FC' : '#0d9488',
    },
  });

export default SearchBar;
