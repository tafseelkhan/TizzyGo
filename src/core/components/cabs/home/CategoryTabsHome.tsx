import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';

// Mock Data for Categories - YAHAN DEFINED
const DEFAULT_CATEGORIES = ['All', 'Rido', 'Zido', 'Hopz'];

interface CategoryTabsProps {
  categories?: string[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories = DEFAULT_CATEGORIES,
  selectedCategory: externalSelectedCategory,
  onSelectCategory,
}) => {
  // Internal state if parent doesn't control
  const [internalSelectedCategory, setInternalSelectedCategory] =
    useState<string>('All');

  // Use external if provided, else internal
  const selectedCategory =
    externalSelectedCategory !== undefined
      ? externalSelectedCategory
      : internalSelectedCategory;

  const handleSelectCategory = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      setInternalSelectedCategory(cat);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
    >
      {categories.map(cat => {
        const isSelected = cat === selectedCategory;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => handleSelectCategory(cat)}
            style={[
              styles.categoryTab,
              isSelected
                ? styles.categoryTabActive
                : styles.categoryTabInactive,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                isSelected
                  ? styles.categoryTextActive
                  : styles.categoryTextInactive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  categoryTab: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: '#2ECC71',
  },
  categoryTabInactive: {
    backgroundColor: '#FFFFFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#000',
  },
  categoryTextInactive: {
    color: '#A3A3A3',
  },
});

export default CategoryTabs;
