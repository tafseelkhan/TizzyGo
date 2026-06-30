// components/SearchBar.tsx - FINAL CLEAN VERSION
import React, { useState, useEffect, useRef } from 'react';
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
import { AnimatedWord } from './common/AnimatedWord';
import FilterDropdown from './common/FilterDropDownHome';
import CartButton from './CartButtonHome';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    // ... styles remain same as original ...
    // (Copy all styles from original to keep them unchanged)
    mainContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    searchWrapper: { flex: 8, left: 15, position: 'relative' },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2D3748' : '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 28,
      height: 48,
      position: 'relative',
    },
    searchIcon: { marginRight: 12 },
    inputWrapper: { flex: 1, position: 'relative', justifyContent: 'center' },
    placeholderContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 1,
    },
    staticText: {
      fontSize: 12,
      fontWeight: '300',
      color: isDark ? '#94A3B8' : '#6b7280',
    },
    animatedWordText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#0d9488',
      textShadowColor: 'rgba(13, 148, 136, 0.5)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 12,
      fontWeight: '300',
      color: isDark ? '#F1F5F9' : '#1f2937',
      zIndex: 2,
      backgroundColor: 'transparent',
    },
    clearButton: { padding: 4 },
    loadingIndicator: { marginLeft: 8 },
    modalContainer: {
      flex: 1,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
      gap: 12,
    },
    backButton: { padding: 8 },
    modalSearchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2D3748' : '#F3F4F6',
      borderRadius: 12,
      paddingHorizontal: 12,
      marginRight: 8,
    },
    modalSearchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 12,
      fontWeight: '300',
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    modalPlaceholderContainer: {
      position: 'absolute',
      left: 40,
      right: 0,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 1,
    },
    modalStaticText: {
      fontSize: 12,
      left: -32,
      fontWeight: '300',
      color: isDark ? '#94A3B8' : '#6b7280',
    },
    modalAnimatedWordText: {
      fontSize: 12,
      left: -32,
      fontWeight: '600',
      color: '#0d9488',
      textShadowColor: 'rgba(13, 148, 136, 0.5)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    modalCancelButton: { paddingHorizontal: 12, paddingVertical: 8 },
    modalCancelText: {
      fontSize: 16,
      color: isDark ? '#7DD3FC' : '#0d9488',
      fontWeight: '500',
    },
    modalContent: { flex: 1 },
    suggestionsScrollView: { flex: 1 },
    section: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#F3F4F6',
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
    productCount: { fontSize: 12, color: isDark ? '#94A3B8' : '#6b7280' },
    clearAllText: { fontSize: 12, color: isDark ? '#94A3B8' : '#6b7280' },
    resultsContainer: { gap: 16 },
    categorySection: { gap: 8 },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#7DD3FC' : '#0d9488',
      marginBottom: 8,
    },
    productsList: { gap: 8 },
    productItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
    },
    productImage: { width: 50, height: 50, borderRadius: 8 },
    productImagePlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 8,
      backgroundColor: isDark ? '#4B5563' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    productInfo: { flex: 1, gap: 4 },
    productTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#F1F5F9' : '#1f2937',
    },
    productDescription: { fontSize: 12, color: isDark ? '#94A3B8' : '#6b7280' },
    productPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#7DD3FC' : '#0d9488',
    },
    viewAllButton: {
      padding: 12,
      backgroundColor: isDark ? '#374151' : '#F0FDFA',
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    viewAllButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#7DD3FC' : '#0d9488',
    },
    noResultsContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
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
    searchesList: { gap: 12 },
    searchItem: { flexDirection: 'row', alignItems: 'center' },
    searchButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
    },
    searchText: {
      flex: 1,
      fontSize: 14,
      color: isDark ? '#D1D5DB' : '#374151',
      fontWeight: '500',
    },
    removeButton: { padding: 8 },
    searchCount: {
      backgroundColor: isDark ? '#4B5563' : '#F3F4F6',
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
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      marginTop: 12,
    },
    viewMoreText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#7DD3FC' : '#0d9488',
    },
    actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    horizontalScrollContainer: { paddingVertical: 12 },
    horizontalScroll: { paddingHorizontal: 16 },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2D3748' : '#F3F4F6',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 10,
      gap: 8,
    },
    suggestionChipText: { fontSize: 14, color: isDark ? '#F1F5F9' : '#374151' },
    recentChip: { backgroundColor: isDark ? '#374151' : '#F9FAFB' },
    trendingChip: { backgroundColor: isDark ? '#2D3748' : '#F3F4F6' },
  });

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
  const isDark =
    propIsDark !== undefined ? propIsDark : themeContext?.isDark || false;
  const styles = createStyles(isDark);

  // Local state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [actualUserId, setActualUserId] = useState<string | null>(
    propUserId || null,
  );

  // Animation states
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayWord, setDisplayWord] = useState(placeholderWords[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [modalCurrentWordIndex, setModalCurrentWordIndex] = useState(0);
  const [modalDisplayWord, setModalDisplayWord] = useState(placeholderWords[0]);
  const [isModalAnimating, setIsModalAnimating] = useState(false);

  // Refs
  const modalInputRef = useRef<TextInput>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Search hook
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
    fetchRecentSearches,
    getTotalProductsCount,
  } = useSearch();

  // Load user ID on mount
  useEffect(() => {
    const loadUserId = async () => {
      if (!propUserId) {
        const extractedUserId = await getUserIdFromToken();
        if (extractedUserId) setActualUserId(extractedUserId);
      }
    };
    loadUserId();
  }, [propUserId]);

  // Animation handlers
  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setCurrentWordIndex(prev =>
      getNextWordIndex(prev, placeholderWords.length),
    );
  };

  const handleModalAnimationComplete = () => {
    setIsModalAnimating(false);
    setModalCurrentWordIndex(prev =>
      getNextWordIndex(prev, placeholderWords.length),
    );
  };

  // Animation cycles
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!isAnimating) setIsAnimating(true);
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAnimating]);

  useEffect(() => {
    if (!modalVisible) return;
    modalIntervalRef.current = setInterval(() => {
      if (!isModalAnimating && modalVisible) setIsModalAnimating(true);
    }, 2000);
    return () => {
      if (modalIntervalRef.current) clearInterval(modalIntervalRef.current);
    };
  }, [modalVisible, isModalAnimating]);

  // Update display words
  useEffect(
    () => setDisplayWord(placeholderWords[currentWordIndex]),
    [currentWordIndex],
  );
  useEffect(
    () => setModalDisplayWord(placeholderWords[modalCurrentWordIndex]),
    [modalCurrentWordIndex],
  );

  // Modal handlers
  const openSearchModal = () => {
    setModalVisible(true);
    setModalSearchQuery(searchQuery);
    setTimeout(() => modalInputRef.current?.focus(), 100);
  };

  const closeSearchModal = () => {
    Keyboard.dismiss();
    setModalVisible(false);
    setModalSearchQuery('');
    setShowAllRecent(false);
    setShowAllPopular(false);
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

  // Render helpers
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
                size={16}
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
                size={16}
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
      return (
        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
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
                    {categoryResult.products.map(product => {
                      const imageUrl = searchService.getProductImageUrl(
                        product.images,
                      );
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
                            />
                          ) : (
                            <View style={styles.productImagePlaceholder}>
                              <Ionicons
                                name="bag-outline"
                                size={24}
                                color="#9ca3af"
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
                            {searchService.formatPrice(product.price)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
            {getTotalProductsCount() > 10 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigateToSearch(modalSearchQuery)}
              >
                <Text style={styles.viewAllButtonText}>View All Results</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      );
    }

    if (modalSearchQuery.length > 2) {
      return (
        <ScrollView style={styles.modalContent}>
          <View style={styles.section}>
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={60} color="#9ca3af" />
              <Text style={styles.noResultsTitle}>No products found</Text>
              <Text style={styles.noResultsText}>
                Can't find "{modalSearchQuery}"? Try a different search term
              </Text>
            </View>
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
      >
        {renderHorizontalSuggestions()}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={isDark ? '#94A3B8' : '#6b7280'}
                />
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
                    <Ionicons
                      name="time-outline"
                      size={20}
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
                      size={20}
                      color={isDark ? '#94A3B8' : '#6b7280'}
                    />
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
                  color={isDark ? '#94A3B8' : '#6b7280'}
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
                    color={isDark ? '#7DD3FC' : '#0d9488'}
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
              size={20}
              color={isDark ? '#94A3B8' : '#6b7280'}
              style={styles.searchIcon}
            />
            <View style={styles.inputWrapper}>
              {!searchQuery && (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.staticText}>You want </Text>
                  <AnimatedWord
                    word={displayWord}
                    isAnimating={isAnimating}
                    onAnimationComplete={handleAnimationComplete}
                    textStyle={styles.animatedWordText}
                  />
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeSearchModal}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? '#F1F5F9' : '#1f2937'}
              />
            </TouchableOpacity>

            <View style={styles.modalSearchContainer}>
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
              />
              <View style={{ flex: 1, position: 'relative' }}>
                {!modalSearchQuery && (
                  <View style={styles.modalPlaceholderContainer}>
                    <Text style={styles.modalStaticText}>You want </Text>
                    <AnimatedWord
                      word={modalDisplayWord}
                      isAnimating={isModalAnimating}
                      onAnimationComplete={handleModalAnimationComplete}
                      textStyle={styles.modalAnimatedWordText}
                    />
                  </View>
                )}
                <TextInput
                  ref={modalInputRef}
                  style={styles.modalSearchInput}
                  placeholder=""
                  placeholderTextColor="transparent"
                  value={modalSearchQuery}
                  onChangeText={handleSearch}
                  returnKeyType="search"
                  onSubmitEditing={() => handleSearchSubmit(modalSearchQuery)}
                  autoFocus={true}
                />
              </View>
              {modalSearchQuery && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons
                    name="close"
                    size={20}
                    color={isDark ? '#94A3B8' : '#6b7280'}
                  />
                </TouchableOpacity>
              )}
              {searchLoading && (
                <ActivityIndicator
                  size="small"
                  color={isDark ? '#7DD3FC' : '#0d9488'}
                  style={styles.loadingIndicator}
                />
              )}
            </View>

            <TouchableOpacity
              onPress={closeSearchModal}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {renderModalContent()}
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default SearchBar;
