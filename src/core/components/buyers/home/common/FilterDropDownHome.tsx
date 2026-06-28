import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { APIs } from '../../../../services/HomeService';
import { useTheme } from '../../../../contexts/theme/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const FilterAnimation = require('../../animations/lotties/Line Filter Icon Animations.json');

// Local theme colors function - SOLID COLORS, NO GLASS EFFECT
const getLocalThemeColors = (isDark: boolean) => {
  return {
    // Filter button colors
    filterButtonBg: isDark ? '#00000000' : '#00000000',
    filterButtonText: isDark ? '#F1F5F9' : '#1f2937',
    filterCountBg: isDark ? '#0d9488' : '#0d9488',
    filterCountText: '#FFFFFF',

    // Modal colors
    modalBg: isDark ? '#1E293B' : '#FFFFFF',
    modalBorder: isDark ? '#334155' : '#E5E7EB',
    modalShadow: isDark ? '#000000' : '#000000',

    // Text colors
    titleText: isDark ? '#F1F5F9' : '#1f2937',
    sectionText: isDark ? '#E2E8F0' : '#374151',
    closeIcon: isDark ? '#94A3B8' : '#6b7280',

    // Category colors
    categoryButtonBg: isDark ? '#334155' : '#F9FAFB',
    categoryButtonSelectedBg: isDark ? '#0d9488' : '#0d9488',
    categoryText: isDark ? '#E2E8F0' : '#374151',
    categoryTextSelected: '#FFFFFF',

    // Scroll arrows
    scrollArrowBg: isDark ? '#334155' : '#F3F4F6',
    scrollArrowIcon: isDark ? '#E2E8F0' : '#374151',

    // Sort options
    sortOptionBg: isDark ? '#334155' : '#F9FAFB',
    sortOptionSelectedBg: isDark ? '#0d9488' : '#0d9488',
    sortOptionText: isDark ? '#CBD5E1' : '#374151',
    sortOptionSelectedText: '#FFFFFF',

    // Action buttons
    clearButtonBg: isDark ? '#334155' : '#F3F4F6',
    clearButtonText: isDark ? '#E2E8F0' : '#374151',
    applyButtonBg: isDark ? '#0d9488' : '#0d9488',
    applyButtonText: '#FFFFFF',

    // Overlay
    overlayBg: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
  };
};

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    container: {
      position: 'relative',
    },
    filterButton: {
      height: 48,
      width: 48,
      marginLeft: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filter: {
      height: 48,
      width: 48,
      marginBottom: -25,
    },
    filterButtonMobile: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    filterCount: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: themeColors.filterCountBg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    filterCountText: {
      color: themeColors.filterCountText,
      fontSize: 11,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: themeColors.overlayBg,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      backgroundColor: themeColors.modalBg,
      borderRadius: 20,
      width: screenWidth * 0.9,
      maxWidth: 420,
      maxHeight: '85%',
      shadowColor: themeColors.modalShadow,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 15,
      borderWidth: 1,
      borderColor: themeColors.modalBorder,
    },
    modalContentMobile: {
      width: screenWidth * 0.92,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.modalBorder,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.titleText,
    },
    closeButton: {
      padding: 4,
      borderRadius: 20,
      backgroundColor: themeColors.clearButtonBg,
    },
    categoriesSection: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.modalBorder,
    },
    categoriesHeader: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.sectionText,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: themeColors.closeIcon,
    },
    categoriesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scrollArrowLeft: {
      padding: 8,
      backgroundColor: themeColors.scrollArrowBg,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      marginRight: 8,
    },
    scrollArrowRight: {
      padding: 8,
      backgroundColor: themeColors.scrollArrowBg,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      marginLeft: 8,
    },
    categoriesScrollView: {
      flex: 1,
    },
    categoriesRow: {
      flexDirection: 'row',
      gap: 8,
    },
    categoryButton: {
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: themeColors.categoryButtonBg,
      minWidth: 70,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 1,
      borderColor: themeColors.modalBorder,
    },
    categoryButtonSelected: {
      backgroundColor: themeColors.categoryButtonSelectedBg,
      borderColor: themeColors.categoryButtonSelectedBg,
    },
    categoryIconContainer: {
      marginBottom: 8,
    },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '500',
      color: themeColors.categoryText,
      textAlign: 'center',
    },
    categoryTextSelected: {
      color: themeColors.categoryTextSelected,
    },
    sortSection: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.modalBorder,
    },
    sortGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    sortOption: {
      flex: 1,
      minWidth: '47%',
      padding: 12,
      borderRadius: 12,
      backgroundColor: themeColors.sortOptionBg,
      borderWidth: 1,
      borderColor: themeColors.modalBorder,
    },
    sortOptionSelected: {
      backgroundColor: themeColors.sortOptionSelectedBg,
      borderColor: themeColors.sortOptionSelectedBg,
    },
    sortOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: themeColors.sortOptionText,
      textAlign: 'center',
    },
    sortOptionTextSelected: {
      color: themeColors.sortOptionSelectedText,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      padding: 20,
      paddingTop: 16,
    },
    clearButton: {
      flex: 1,
      padding: 14,
      backgroundColor: themeColors.clearButtonBg,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.modalBorder,
    },
    clearButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: themeColors.clearButtonText,
    },
    applyButton: {
      flex: 1,
      padding: 14,
      backgroundColor: themeColors.applyButtonBg,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    applyButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: themeColors.applyButtonText,
    },
  });

type Category = {
  name: string;
  icon: React.ReactElement;
};

interface FilterDropdownProps {
  selectedCategory: string;
  handleCategoryClick: (category: string) => void;
  isMobile?: boolean;
}

const categoriesData = [
  { name: 'All', iconName: 'apps', color: '#0d9488' },
  { name: 'Cars', iconName: 'car', color: '#3b82f6' },
  { name: 'Mobiles', iconName: 'smartphone', color: '#8b5cf6' },
  { name: 'Properties', iconName: 'business', color: '#f97316' },
  { name: 'Electronics', iconName: 'devices', color: '#22c55e' },
  { name: 'Furniture', iconName: 'chair', color: '#eab308' },
  { name: 'Bikes', iconName: 'motorcycle', color: '#ef4444' },
  { name: 'Fashion', iconName: 'tshirt', color: '#ec4899' },
  { name: 'Sports', iconName: 'basketball', color: '#6366f1' },
  { name: 'Pets', iconName: 'paw', color: '#f59e0b' },
  { name: 'Jobs', iconName: 'work', color: '#10b981' },
  { name: 'Services', iconName: 'build', color: '#6b7280' },
  { name: 'Real Estate', iconName: 'home', color: '#f43f5e' },
];

function getCategoryIcon(
  iconName: string,
  size: number = 20,
  color: string = 'white',
) {
  switch (iconName) {
    case 'apps':
      return <Ionicons name="apps-outline" size={size} color={color} />;
    case 'car':
      return <Ionicons name="car-outline" size={size} color={color} />;
    case 'smartphone':
      return (
        <Ionicons name="phone-portrait-outline" size={size} color={color} />
      );
    case 'business':
      return <Ionicons name="business-outline" size={size} color={color} />;
    case 'devices':
      return <MaterialIcons name="devices-other" size={size} color={color} />;
    case 'chair':
      return <MaterialIcons name="chair" size={size} color={color} />;
    case 'motorcycle':
      return <MaterialIcons name="two-wheeler" size={size} color={color} />;
    case 'tshirt':
      return <Ionicons name="shirt-outline" size={size} color={color} />;
    case 'basketball':
      return <Ionicons name="basketball-outline" size={size} color={color} />;
    case 'paw':
      return <Ionicons name="paw-outline" size={size} color={color} />;
    case 'work':
      return <Ionicons name="briefcase-outline" size={size} color={color} />;
    case 'build':
      return <Ionicons name="build-outline" size={size} color={color} />;
    case 'home':
      return <Ionicons name="home-outline" size={size} color={color} />;
    default:
      return <Ionicons name="bag-outline" size={size} color={color} />;
  }
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  selectedCategory,
  handleCategoryClick,
  isMobile = false,
}) => {
  const { isDark } = useTheme();
  const themeColors = getLocalThemeColors(isDark);
  const styles = createStyles(themeColors);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tempSelectedCategory, setTempSelectedCategory] =
    useState(selectedCategory);
  const [selectedSort, setSelectedSort] = useState('');
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const categories: Category[] = categoriesData.map(cat => ({
    name: cat.name,
    icon: (
      <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
        {getCategoryIcon(cat.iconName)}
      </View>
    ),
  }));

  useEffect(() => {
    const fetchFiltersCount = async () => {
      try {
        const data = await APIs.getAppliedFiltersCount();
        setAppliedFiltersCount(data.count || 0);
      } catch (error) {
        console.error('Error fetching filters count:', error);
        setAppliedFiltersCount(0);
      }
    };
    if (isDropdownOpen) {
      fetchFiltersCount();
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isDropdownOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
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
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDropdownOpen]);

  const checkScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setShowLeftArrow(contentOffset.x > 0);
    setShowRightArrow(
      contentOffset.x < contentSize.width - layoutMeasurement.width - 1,
    );
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollViewRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      scrollViewRef.current.scrollTo({ x: scrollAmount, animated: true });
    }
  };

  const handleApplyFilters = async () => {
    try {
      const filters: any = {};
      if (tempSelectedCategory && tempSelectedCategory !== 'All') {
        filters.category = tempSelectedCategory;
      }
      if (selectedSort) {
        filters.sort = selectedSort;
      }
      if (Object.keys(filters).length > 0) {
        await APIs.applyFilters(filters);
        if (tempSelectedCategory) {
          handleCategoryClick(tempSelectedCategory);
        }
      }
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to apply filters:', error);
    }
  };

  const handleClearFilters = async () => {
    try {
      await APIs.clearFilters();
      setAppliedFiltersCount(0);
      setSelectedSort('');
      setTempSelectedCategory('');
      setIsDropdownOpen(false);
      handleCategoryClick('All');
    } catch (error) {
      console.error('Clear filters error:', error);
    }
  };

  const sortOptions = [
    { label: 'Relevance', icon: 'flame-outline' },
    { label: 'New Arrivals', icon: 'flash-outline' },
    { label: 'Price: High-Low', icon: 'trending-down-outline' },
    { label: 'Price: Low-High', icon: 'trending-up-outline' },
    { label: 'Ratings', icon: 'star-outline' },
    { label: 'Discount', icon: 'pricetag-outline' },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.filterButton, isMobile && styles.filterButtonMobile]}
        onPress={() => setIsDropdownOpen(true)}
        activeOpacity={0.8}
      >
        <Icon
          name="filter"
          size={25}
          color="#000000"
          style={styles.filter}
        />
        {appliedFiltersCount > 0 && (
          <View style={styles.filterCount}>
            <Text style={styles.filterCountText}>{appliedFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContent,
                  isMobile && styles.modalContentMobile,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filters</Text>
                  <TouchableOpacity
                    onPress={() => setIsDropdownOpen(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={themeColors.closeIcon}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.categoriesSection}>
                    <View style={styles.categoriesHeader}>
                      <Text style={styles.sectionTitle}>Categories</Text>
                      <Text style={styles.sectionSubtitle}>
                        Choose what you're looking for
                      </Text>
                    </View>

                    <View style={styles.categoriesContainer}>
                      {showLeftArrow && (
                        <TouchableOpacity
                          style={styles.scrollArrowLeft}
                          onPress={() => scroll('left')}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={18}
                            color={themeColors.scrollArrowIcon}
                          />
                        </TouchableOpacity>
                      )}

                      <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        onScroll={checkScroll}
                        scrollEventThrottle={16}
                        style={styles.categoriesScrollView}
                      >
                        <View style={styles.categoriesRow}>
                          {categories.map(category => (
                            <TouchableOpacity
                              key={category.name}
                              style={[
                                styles.categoryButton,
                                tempSelectedCategory === category.name &&
                                  styles.categoryButtonSelected,
                              ]}
                              onPress={() =>
                                setTempSelectedCategory(category.name)
                              }
                              activeOpacity={0.7}
                            >
                              <View style={styles.categoryIconContainer}>
                                {category.icon}
                              </View>
                              <Text
                                style={[
                                  styles.categoryText,
                                  tempSelectedCategory === category.name &&
                                    styles.categoryTextSelected,
                                ]}
                              >
                                {category.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>

                      {showRightArrow && (
                        <TouchableOpacity
                          style={styles.scrollArrowRight}
                          onPress={() => scroll('right')}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={themeColors.scrollArrowIcon}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.sortSection}>
                    <Text style={styles.sectionTitle}>Sort By</Text>
                    <Text style={styles.sectionSubtitle}>
                      Arrange products your way
                    </Text>
                    <View style={styles.sortGrid}>
                      {sortOptions.map(option => (
                        <TouchableOpacity
                          key={option.label}
                          style={[
                            styles.sortOption,
                            selectedSort === option.label &&
                              styles.sortOptionSelected,
                          ]}
                          onPress={() => setSelectedSort(option.label)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={option.icon}
                            size={16}
                            color={
                              selectedSort === option.label
                                ? '#FFFFFF'
                                : themeColors.sortOptionText
                            }
                            style={{ marginBottom: 4 }}
                          />
                          <Text
                            style={[
                              styles.sortOptionText,
                              selectedSort === option.label &&
                                styles.sortOptionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearFilters}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApplyFilters}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default FilterDropdown;
