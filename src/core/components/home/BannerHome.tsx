import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ColorValue
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/theme/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

type BannerProps = {
  productsCount?: number;
};

const Banner: React.FC<BannerProps> = ({ productsCount = 0 }) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isDark } = useTheme();
  const [bannerContent, setBannerContent] = useState({
    title: "Best Deals",
    subtitle: "Amazing products waiting for you"
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Dynamic gradient based on theme
  const getBannerGradient = (): string[] => {
    if (isDark) {
      // Dark theme gradient
      return ['#0F766E', '#2DD4BF']; // Teal to Cyan
    }
    // Light theme gradient
    return ['#FF8C00', '#fbff00ff']; // Orange to Yellow
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Fetch banner content from API
    fetchBannerContent();
  }, []);

  const fetchBannerContent = async () => {
    try {
      const response = await fetch('admin/send/messages');
      const data = await response.json();
      if (data.title && data.subtitle) {
        setBannerContent({
          title: data.title,
          subtitle: data.subtitle
        });
      }
    } catch (error) {
      console.log('Error fetching banner content:', error);
    }
  };

  const handleShopNow = () => {
    navigation.navigate('/products/all');
  };

  // Only show banner if there are products
  if (productsCount === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.headerBanner, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={getBannerGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerGradient}
      >
        <Text style={styles.bannerTitle}>{bannerContent.title}</Text>
        <Text style={styles.bannerSubtitle}>{bannerContent.subtitle}</Text>
        <TouchableOpacity 
          style={[
            styles.shopNowButton,
            { backgroundColor: isDark ? '#FFFFFF' : 'white' }
          ]}
          onPress={handleShopNow}
        >
          <Text style={[
            styles.shopNowText,
            { color: isDark ? '#0F766E' : '#FF8C00' }
          ]}>Shop now</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerBanner: {
    height: 200,
    marginBottom: 16,
  },
  bannerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bannerSubtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  shopNowButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  shopNowText: {
    color: '#FF8C00',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Banner;