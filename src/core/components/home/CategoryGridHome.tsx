import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/theme/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Define navigation param types
type RootStackParamList = {
  MansScreen: { category: string };
  WomenScreen: { category: string };
  MobilesScreen: { category: string };
  SellScreen: { category: string };
  KidsScreen: { category: string };
  ElectronicsScreen: { category: string };
  HomeScreen: { category: string };
  SportsScreen: { category: string };
  BeautyScreen: { category: string };
  BooksScreen: { category: string };
  ToysScreen: { category: string };
  FurnitureScreen: { category: string };
  CarsScreen: { category: string };
  BikesScreen: { category: string };
  [key: string]: any;
};

const CategoryGrid = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useTheme();

  // Categories data with images and screen names
  const categories = [
    { 
      name: 'Mans', 
      image: require('../../../assets/taskfile/man.png'),
      screenName: 'MansScreen'
    },
    { 
      name: 'Women', 
      image: require('../../../assets/taskfile/women.png'), 
      screenName: 'WomenScreen'
    },
    {
      name: 'Mobiles',
      image: require('../../../assets/taskfile/mobile.png'),
      screenName: 'MobilesScreen'
    },
    {
      name: 'All in Sell',
      image: require('../../../assets/taskfile/sell.png'),
      screenName: 'SellScreen'
    },
    { 
      name: 'Kids', 
      image: require('../../../assets/taskfile/kids.png'), 
      screenName: 'KidsScreen'
    },
    { 
      name: 'Electronics', 
      image: require('../../../assets/taskfile/electronics.png'), 
      screenName: 'ElectronicsScreen'
    },
    { 
      name: 'Home', 
      image: require('../../../assets/taskfile/home.png'), 
      screenName: 'HomeScreen'
    },
    { 
      name: 'Sports', 
      image: require('../../../assets/taskfile/sports.png'), 
      screenName: 'SportsScreen'
    },
    { 
      name: 'Beauty', 
      image: require('../../../assets/taskfile/beauty.png'), 
      screenName: 'BeautyScreen'
    },
    { 
      name: 'Books', 
      image: require('../../../assets/taskfile/books.png'), 
      screenName: 'BooksScreen'
    },
    { 
      name: 'Toys', 
      image: require('../../../assets/taskfile/toy.png'), 
      screenName: 'ToysScreen'
    },
    { 
      name: 'Furniture', 
      image: require('../../../assets/taskfile/furniture.png'), 
      screenName: 'FurnitureScreen'
    },
    { 
      name: 'Cars', 
      image: require('../../../assets/taskfile/car.png'), 
      screenName: 'CarsScreen'
    },
    { 
      name: 'Bikes', 
      image: require('../../../assets/taskfile/bike.png'), 
      screenName: 'BikesScreen'
    },
  ];

  const handleCategoryPress = (categoryName: string, screenName: string) => {
    console.log('🎯 Category pressed:', categoryName);
    
    try {
      navigation.navigate(screenName, {
        category: categoryName,
      });
    } catch (error) {
      console.log('❌ Navigation error:', error);
      Alert.alert('Error', `Cannot navigate to ${screenName}`);
    }
  };

  // Split categories into 2 rows
  const halfLength = Math.ceil(categories.length / 2);
  const firstRow = categories.slice(0, halfLength);
  const secondRow = categories.slice(halfLength);

  // Theme-based colors
  const getThemeColors = () => {
    return {
      containerBg: 'transparent',
      titleColor: isDark ? '#F1F5F9' : '#1f2937',
      glassBg: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.25)',
      glassBorder: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(255, 255, 255, 0.4)',
      shadowColor: isDark ? '#000' : '#000',
      categoryNameColor: isDark ? '#CBD5E1' : '#374151',
    };
  };

  const themeColors = getThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.containerBg }]}>
      <Text style={[styles.title, { color: themeColors.titleColor }]}>Categories</Text>
      
      {/* Main container with 2 rows */}
      <View style={styles.rowsContainer}>
        {/* First Row - Horizontal Scroll */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowScrollContent}
          scrollEnabled={true}
        >
          {firstRow.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(category.name, category.screenName)}
              activeOpacity={0.7}
              delayPressIn={0}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
            >
              <View style={[
                styles.glassEffect, 
                { 
                  backgroundColor: themeColors.glassBg,
                  borderColor: themeColors.glassBorder,
                  shadowColor: themeColors.shadowColor,
                }
              ]}>
                <Image 
                  source={category.image} 
                  style={styles.categoryImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.categoryName, { color: themeColors.categoryNameColor }]} numberOfLines={1}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Second Row - Horizontal Scroll */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowScrollContent}
          scrollEnabled={true}
        >
          {secondRow.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(category.name, category.screenName)}
              activeOpacity={0.7}
              delayPressIn={0}
              hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
            >
              <View style={[
                styles.glassEffect, 
                { 
                  backgroundColor: themeColors.glassBg,
                  borderColor: themeColors.glassBorder,
                  shadowColor: themeColors.shadowColor,
                }
              ]}>
                <Image 
                  source={category.image} 
                  style={styles.categoryImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.categoryName, { color: themeColors.categoryNameColor }]} numberOfLines={1}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  rowsContainer: {
    gap: 20,
  },
  rowScrollContent: {
    flexDirection: 'row',
    gap: 15,
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 85,
    paddingVertical: 8,
    // Better touch area
    minHeight: 120,
  },
  glassEffect: {
    width: 75,
    height: 75,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    // Liquid Glass Effect
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    // Shadow for glass effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    // Backdrop Filter simulation
    overflow: 'hidden',
  },
  categoryImage: {
    width: 100,
    height: 100,
  },
  categoryName: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default CategoryGrid;