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
// ❌ Expo icons remove kar diye
// import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
// ✅ React Native Vector Icons use karenge
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { APIs } from '../../../services/HomeService';

// Theme Context Import
import { useTheme } from '../../../contexts/theme/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Local theme colors function
const getLocalThemeColors = (isDark: boolean) => {
  return {
    // Filter button colors
    filterButtonBg: isDark ? '#075985' : '#0d9488',
    filterButtonText: '#FFFFFF',
    filterCountBg: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)',
    filterCountActiveBg: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.5)',
    
    // Modal colors
    modalBg: isDark ? '#1E293B' : '#FFFFFF',
    modalBorder: isDark ? '#334155' : '#f3f4f6',
    modalShadow: isDark ? 'rgba(0, 0, 0, 0.5)' : '#000',
    
    // Text colors
    titleText: isDark ? '#F1F5F9' : '#1f2937',
    sectionText: isDark ? '#E2E8F0' : '#1f2937',
    bodyText: isDark ? '#CBD5E1' : '#374151',
    closeIcon: isDark ? '#94A3B8' : '#6b7280',
    
    // Category colors
    categoryButtonBg: isDark ? '#334155' : '#FFFFFF',
    categoryButtonSelectedBg: isDark ? '#0ea5e9' : '#0d9488',
    categoryText: isDark ? '#E2E8F0' : '#374151',
    categoryTextSelected: '#FFFFFF',
    categoryIconBg: isDark ? '#475569' : 'transparent',
    
    // Scroll arrows
    scrollArrowBg: isDark ? '#334155' : '#FFFFFF',
    scrollArrowIcon: isDark ? '#E2E8F0' : '#374151',
    scrollArrowShadow: isDark ? 'rgba(0, 0, 0, 0.4)' : '#000',
    
    // Sort options
    sortOptionBg: isDark ? '#334155' : '#f8fafc',
    sortOptionSelectedBg: isDark ? '#0ea5e9' : '#0d9488',
    sortOptionText: isDark ? '#CBD5E1' : '#374151',
    sortOptionSelectedText: '#FFFFFF',
    
    // Action buttons
    clearButtonBg: isDark ? '#334155' : '#f3f4f6',
    clearButtonText: isDark ? '#E2E8F0' : '#374151',
    applyButtonBg: isDark ? '#0ea5e9' : '#0d9488',
    applyButtonText: '#FFFFFF',
    
    // Overlay
    overlayBg: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
  };
};

// Define styles first to avoid the block-scoped variable error
const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    position: 'relative',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.filterButtonBg,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: themeColors.modalShadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  filterButtonMobile: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterButtonText: {
    color: themeColors.filterButtonText,
    fontSize: 16,
    fontWeight: '600',
  },
  filterButtonTextMobile: {
    fontSize: 14,
  },
  filterCount: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: themeColors.filterCountBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: themeColors.filterCountActiveBg,
  },
  filterCountText: {
    color: themeColors.filterButtonText,
    fontSize: 12,
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
    borderRadius: 24,
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: themeColors.modalShadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: themeColors.modalBorder,
  },
  modalContentMobile: {
    width: screenWidth * 0.95,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.titleText,
  },
  closeButton: {
    padding: 4,
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
  },
  categoriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollArrowLeft: {
    padding: 8,
    backgroundColor: themeColors.scrollArrowBg,
    borderRadius: 20,
    shadowColor: themeColors.scrollArrowShadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 8,
  },
  scrollArrowRight: {
    padding: 8,
    backgroundColor: themeColors.scrollArrowBg,
    borderRadius: 20,
    shadowColor: themeColors.scrollArrowShadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 8,
  },
  categoriesScrollView: {
    flex: 1,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  categoryButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: themeColors.categoryButtonBg,
    marginHorizontal: 4,
    minWidth: 80,
    shadowColor: themeColors.scrollArrowShadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryButtonSelected: {
    backgroundColor: themeColors.categoryButtonSelectedBg,
  },
  categoryIconContainer: {
    marginBottom: 8,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
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
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: themeColors.sortOptionBg,
  },
  sortOptionSelected: {
    backgroundColor: themeColors.sortOptionSelectedBg,
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
  },
  clearButton: {
    flex: 1,
    padding: 16,
    backgroundColor: themeColors.clearButtonBg,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.clearButtonText,
  },
  applyButton: {
    flex: 1,
    padding: 16,
    backgroundColor: themeColors.applyButtonBg,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
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

function getCategoryIcon(iconName: string, size: number = 20, color: string = 'white') {
  switch (iconName) {
    case 'car':
      return <Ionicons name="car-outline" size={size} color={color} />;
    case 'smartphone':
      return <Ionicons name="phone-portrait-outline" size={size} color={color} />;
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
  // Theme Context
  const { isDark, resolvedTheme } = useTheme();
  const themeColors = getLocalThemeColors(isDark);
  const styles = createStyles(themeColors);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tempSelectedCategory, setTempSelectedCategory] = useState(selectedCategory);
  const [selectedSort, setSelectedSort] = useState('');
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Create categories with theme-based colors
  const categories: Category[] = [
    {
      name: 'All',
      icon: (
        <View style={[styles.categoryIcon, { backgroundColor: themeColors.categoryButtonSelectedBg }]}>
          <Ionicons name="bag-outline" size={20} color="white" />
        </View>
      ),
    },
    ...categoriesData.map((cat) => ({
      name: cat.name,
      icon: (
        <View style={[styles.categoryIcon, { backgroundColor: cat.color[0] }]}>
          {getCategoryIcon(cat.iconName)}
        </View>
      ),
    })),
  ];

  // Fetch applied filters count
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

  // Animation for modal
  useEffect(() => {
    if (isDropdownOpen) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isDropdownOpen]);

  const checkScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setShowLeftArrow(contentOffset.x > 0);
    setShowRightArrow(contentOffset.x < contentSize.width - layoutMeasurement.width - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollViewRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      scrollViewRef.current.scrollTo({ x: scrollAmount, animated: true });
    }
  };

  // Handle filter application
  const handleFilterApply = async (filters: any) => {
    try {
      const results = await APIs.applyFilters(filters);
      const countData = await APIs.getAppliedFiltersCount();
      setAppliedFiltersCount(countData.count || 0);
      return results;
    } catch (error) {
      console.error('Filter error:', error);
      throw error;
    }
  };

  // Apply selected filters
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
        await handleFilterApply(filters);
        if (tempSelectedCategory) {
          handleCategoryClick(tempSelectedCategory);
        }
      }
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to apply filters:', error);
    }
  };

  // Clear all filters
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

  const sortOptions = ['Relevance', 'New Arrivals', 'Price: High-Low', 'Price: Low-High', 'Ratings', 'Discount'];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          isMobile && styles.filterButtonMobile
        ]}
        onPress={() => setIsDropdownOpen(true)}
      >
        <Ionicons name="filter" size={20} color="white" />
        <Text style={[
          styles.filterButtonText,
          isMobile && styles.filterButtonTextMobile
        ]}>
          Filters
        </Text>
        <View style={[
          styles.filterCount,
          appliedFiltersCount > 0 && styles.filterCountActive
        ]}>
          <Text style={styles.filterCountText}>{appliedFiltersCount}</Text>
        </View>
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
                  { opacity: fadeAnim }
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Browse Categories</Text>
                  <TouchableOpacity 
                    onPress={() => setIsDropdownOpen(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={themeColors.closeIcon} />
                  </TouchableOpacity>
                </View>

                <View style={styles.categoriesSection}>
                  <View style={styles.categoriesHeader}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                  </View>
                  
                  <View style={styles.categoriesContainer}>
                    {showLeftArrow && (
                      <TouchableOpacity
                        style={styles.scrollArrowLeft}
                        onPress={() => scroll('left')}
                      >
                        <Ionicons name="chevron-back" size={20} color={themeColors.scrollArrowIcon} />
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
                        {categories.map((category) => (
                          <TouchableOpacity
                            key={category.name}
                            style={[
                              styles.categoryButton,
                              tempSelectedCategory === category.name && styles.categoryButtonSelected
                            ]}
                            onPress={() => setTempSelectedCategory(category.name)}
                          >
                            <View style={styles.categoryIconContainer}>
                              {category.icon}
                            </View>
                            <Text style={[
                              styles.categoryText,
                              tempSelectedCategory === category.name && styles.categoryTextSelected
                            ]}>
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
                        <Ionicons name="chevron-forward" size={20} color={themeColors.scrollArrowIcon} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.sortSection}>
                  <Text style={styles.sectionTitle}>Sort by</Text>
                  <View style={styles.sortGrid}>
                    {sortOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.sortOption,
                          selectedSort === option && styles.sortOptionSelected
                        ]}
                        onPress={() => setSelectedSort(option)}
                      >
                        <Text style={[
                          styles.sortOptionText,
                          selectedSort === option && styles.sortOptionTextSelected
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearFilters}
                  >
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApplyFilters}
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