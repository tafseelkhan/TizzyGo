// src/core/components/buyers/home/BannerHome.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '../../../contexts/theme/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const BANNER_WIDTH = screenWidth - 30;
const SPACING = 16;
const SNAP_OFFSET = BANNER_WIDTH + SPACING;

const BANNERS_DATA = [
  { id: '1', image: require('../../../../assets/svg/banners/banner1.png') },
  { id: '2', image: require('../../../../assets/svg/banners/banner2.png') },
  { id: '3', image: require('../../../../assets/svg/banners/banner3.png') },
  { id: '4', image: require('../../../../assets/svg/banners/banner4.png') },
  { id: '5', image: require('../../../../assets/svg/banners/banner5.png') },
];

type BannerProps = {
  productsCount?: number;
};

const Banner: React.FC<BannerProps> = ({ productsCount = 0 }) => {
  const { isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // ✅ Auto-scroll ref taaki dependency loop khatam ho
  const scrollIndexRef = useRef(0);
  const isUserSwipingRef = useRef(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // ✅ FIXED: Auto-scroll with useRef (No loop, no jitter)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isUserSwipingRef.current) return;

      let nextIndex = (scrollIndexRef.current + 1) % BANNERS_DATA.length;
      scrollIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      
      scrollRef.current?.scrollTo({
        x: nextIndex * SNAP_OFFSET,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []); // ✅ Empty dependency array

  // ✅ Manual swipe tracking
  const onScrollBeginDrag = () => {
    isUserSwipingRef.current = true;
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_OFFSET);
    
    if (index !== scrollIndexRef.current && index >= 0 && index < BANNERS_DATA.length) {
      setActiveIndex(index);
      scrollIndexRef.current = index;
    }
    isUserSwipingRef.current = false;
  };

  if (productsCount === 0) return null;

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_OFFSET}
        decelerationRate="fast"
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {BANNERS_DATA.map((banner) => (
          <View key={banner.id} style={styles.bannerContainer}>
            {/* ✅ Naya Wrapper: Android pe borderRadius ke liye zaroori hai */}
            <View style={styles.imageWrapper}>
              <Image
                source={banner.image}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ✅ Animated Dots with "merged" effect */}
      <View style={styles.paginationContainer}>
        {BANNERS_DATA.map((_, index) => {
          const isActive = activeIndex === index;
          const isPrev = index === activeIndex - 1;
          const isNext = index === activeIndex + 1;

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                isActive && styles.paginationDotActive,
                {
                  backgroundColor: isActive
                    ? isDark ? '#FFFFFF' : '#111827'
                    : isDark ? '#475569' : '#D1D5DB',
                  opacity: isActive ? 1 : isPrev || isNext ? 0.7 : 0.4,
                },
              ]}
            />
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: 200,
    borderRadius: 30,
    overflow: 'hidden',       // ✅ Container pe radius
    marginRight: SPACING,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 30,         // ✅ Wrapper pe bhi radius
    overflow: 'hidden',       // ✅ Wrapper pe bhi overflow hidden
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,         // ✅ Image pe bhi radius (Android fix)
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  paginationDotActive: {
    width: 24,
    borderRadius: 3,
  },
});

export default Banner;