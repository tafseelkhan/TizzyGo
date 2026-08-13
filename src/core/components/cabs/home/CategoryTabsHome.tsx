import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';

const DEFAULT_CATEGORIES = [
  'All',
  'FWSLocal',
  'FWSAirport',
  'FWSIntercity',
  'FWSOutstation',
  'FWSScheduled',
  'FWSShared',
  'FWSCorporate',
  'FWSRental',
];

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
  const [internalSelectedCategory, setInternalSelectedCategory] =
    useState<string>('All');

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
      contentContainerStyle={styles.categoriesContent}
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
            activeOpacity={0.7}
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
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 4,
  },
  categoryTab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  categoryTabInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E8E8E8',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  categoryTextInactive: {
    color: '#666666',
  },
});

export default CategoryTabs;
