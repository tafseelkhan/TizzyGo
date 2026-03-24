// components/Home/BrandSlider.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Types
export interface Brand {
  id: string;
  name: string;
  logo: any; // This will be require() statement for local images
  category: string;
}

interface BrandSliderProps {
  brands: Brand[];
}

const BrandSlider: React.FC<BrandSliderProps> = ({ brands }) => {
  const flatListRef = useRef<FlatList>(null);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [currentStyleIndex, setCurrentStyleIndex] = useState(0);
  const scrollOffsetRef = useRef(brands.length * 100);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const isManualScrollingRef = useRef(false);

  // Simple duplication for infinite effect
  const duplicatedBrands = [...brands, ...brands, ...brands];
  const itemWidth = 100; // brand card width + margin

  // Titles that will change every 5 seconds
  const titles = [
    {
      main: 'Featured',
      highlight: 'Brands',
      text: 'Discover top brands that have been carefully selected for their exceptional quality, innovation, and customer satisfaction.',
    },
    {
      main: 'Popular',
      highlight: 'Brands',
      text: 'Most searched brands that customers are actively looking for and engaging with.',
    },
    {
      main: 'Trending',
      highlight: 'Brands',
      text: 'Hot brands right now that are gaining momentum and capturing market attention.',
    },
    {
      main: 'Premium',
      highlight: 'Brands',
      text: 'Luxury collections that represent the highest standards of quality and craftsmanship.',
    },
    {
      main: 'Top',
      highlight: 'Picks',
      text: "Editor's choice selections that have been personally curated by our team of experts.",
    },
  ];

  // Different style themes
  const styleThemes = [
    {
      bgGradient: ['#f0f9ff', '#e0f2fe', '#bae6fd'],
      textColor: '#1f2937',
      highlightColor: '#2563eb',
      cardBg: '#ffffff',
      cardBorder: '#bfdbfe',
      arrowColor: '#3b82f6',
    },
    {
      bgGradient: ['#f0fdf4', '#dcfce7', '#bbf7d0'],
      textColor: '#1f2937',
      highlightColor: '#16a34a',
      cardBg: '#ffffff',
      cardBorder: '#bbf7d0',
      arrowColor: '#22c55e',
    },
    {
      bgGradient: ['#fff7ed', '#ffedd5', '#fed7aa'],
      textColor: '#1f2937',
      highlightColor: '#ea580c',
      cardBg: '#ffffff',
      cardBorder: '#fdba74',
      arrowColor: '#f97316',
    },
  ];

  // AUTO SCROLL - Doesn't interfere with manual scroll
  const startAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    const scrollSpeed = 2;
    const intervalTime = 16;

    autoScrollIntervalRef.current = setInterval(() => {
      // Don't auto scroll if manually scrolling or paused
      if (
        isManualScrollingRef.current ||
        isAutoScrollPaused ||
        !flatListRef.current
      )
        return;

      const currentPosition = scrollOffsetRef.current;
      let newPosition = currentPosition + scrollSpeed;

      // Reset when reaching end
      if (newPosition >= brands.length * 2 * itemWidth) {
        newPosition = brands.length * itemWidth;
      }

      scrollOffsetRef.current = newPosition;
      flatListRef.current.scrollToOffset({
        offset: newPosition,
        animated: false,
      });
    }, intervalTime);
  }, [brands.length, isAutoScrollPaused, itemWidth]);

  // Start/stop auto scroll
  useEffect(() => {
    if (brands.length === 0) return;

    if (!isAutoScrollPaused) {
      startAutoScroll();
    } else {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [brands.length, isAutoScrollPaused, startAutoScroll]);

  // Initial setup
  useEffect(() => {
    if (brands.length === 0) return;

    const initialPosition = brands.length * itemWidth;
    scrollOffsetRef.current = initialPosition;

    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: initialPosition,
          animated: false,
        });
      }
    }, 100);
  }, [brands.length, itemWidth]);

  // Title change effect
  useEffect(() => {
    const titleInterval = setInterval(() => {
      setCurrentTitleIndex(prev => (prev + 1) % titles.length);
    }, 5000);
    return () => clearInterval(titleInterval);
  }, [titles.length]);

  // Style change effect
  useEffect(() => {
    const styleInterval = setInterval(() => {
      setCurrentStyleIndex(prev => (prev + 1) % styleThemes.length);
    }, 5000);
    return () => clearInterval(styleInterval);
  }, [styleThemes.length]);

  const currentTitle = titles[currentTitleIndex];
  const currentStyle = styleThemes[currentStyleIndex];

  const renderBrandItem = ({ item, index }: { item: Brand; index: number }) => (
    <View
      style={[
        styles.brandCard,
        styles.shadowMd,
        {
          backgroundColor: currentStyle.cardBg,
          borderColor: currentStyle.cardBorder,
          marginLeft: index === 0 ? 16 : 8,
          marginRight: 8,
        },
      ]}
    >
      <Image source={item.logo} style={styles.brandLogo} resizeMode="contain" />
      <Text
        style={[styles.brandName, { color: currentStyle.textColor }]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
    </View>
  );

  // Manual scroll handlers
  const handleManualScroll = (direction: 'left' | 'right') => {
    // Set manual scrolling flag
    isManualScrollingRef.current = true;
    setIsAutoScrollPaused(true);

    if (flatListRef.current) {
      const currentOffset = scrollOffsetRef.current;
      const scrollAmount = itemWidth * 3;
      let newOffset =
        direction === 'right'
          ? currentOffset + scrollAmount
          : currentOffset - scrollAmount;

      // Boundary check and loop around
      if (newOffset >= brands.length * 2 * itemWidth) {
        newOffset = brands.length * itemWidth;
      } else if (newOffset < 0) {
        newOffset = brands.length * 2 * itemWidth - scrollAmount;
      }

      scrollOffsetRef.current = newOffset;
      flatListRef.current.scrollToOffset({
        offset: newOffset,
        animated: true,
      });
    }

    // Reset manual scrolling flag and resume auto scroll after 3 seconds
    setTimeout(() => {
      isManualScrollingRef.current = false;
      setIsAutoScrollPaused(false);
    }, 3000);
  };

  // Handle user manual scrolling with touch
  const handleScrollBeginDrag = () => {
    isManualScrollingRef.current = true;
    setIsAutoScrollPaused(true);
  };

  const handleScrollEndDrag = (event: any) => {
    // Update scroll position
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollOffsetRef.current = offsetX;

    // Resume auto scroll after 2 seconds
    setTimeout(() => {
      isManualScrollingRef.current = false;
      setIsAutoScrollPaused(false);
    }, 2000);
  };

  const handleMomentumScrollEnd = (event: any) => {
    // Update scroll position after momentum scroll
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollOffsetRef.current = offsetX;
  };

  // Track scroll position
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollOffsetRef.current = offsetX;
  };

  return (
    <View
      style={[
        styles.brandSliderContainer,
        { backgroundColor: currentStyle.bgGradient[0] },
      ]}
      pointerEvents="box-none"
    >
      {/* Header */}
      <View style={styles.brandSliderHeader}>
        <Text
          style={[styles.brandSliderTitle, { color: currentStyle.textColor }]}
        >
          {currentTitle.main}{' '}
          <Text style={{ color: currentStyle.highlightColor }}>
            {currentTitle.highlight}
          </Text>
        </Text>
        <Text
          style={[
            styles.brandSliderSubtitle,
            { color: currentStyle.textColor },
          ]}
        >
          {currentTitle.text}
        </Text>
      </View>

      {/* Brand Slider with Manual Controls */}
      <View style={styles.sliderWrapper}>
        {/* Left Arrow */}
        <TouchableOpacity
          style={[styles.arrowButton, styles.arrowLeft]}
          onPress={() => handleManualScroll('left')}
        >
          <Text style={[styles.arrowText, { color: currentStyle.arrowColor }]}>
            ‹
          </Text>
        </TouchableOpacity>

        {/* Brand List */}
        <View style={styles.brandSliderContent}>
          <FlatList
            ref={flatListRef}
            data={duplicatedBrands}
            renderItem={renderBrandItem}
            keyExtractor={(item, index) => `brand-${item.id}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            decelerationRate="fast"
            initialNumToRender={15}
            maxToRenderPerBatch={15}
            windowSize={10}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            getItemLayout={(data, index) => ({
              length: itemWidth,
              offset: itemWidth * index,
              index,
            })}
            style={{ zIndex: 2 }}
          />

          {/* Gradient overlays */}
          <LinearGradient
            pointerEvents="none"
            colors={[
              currentStyle.bgGradient[0] + 'FF',
              currentStyle.bgGradient[0] + '00',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.brandGradientLeft, { zIndex: 0 }]}
          />

          <LinearGradient
            pointerEvents="none"
            colors={[
              currentStyle.bgGradient[0] + '00',
              currentStyle.bgGradient[0] + 'FF',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.brandGradientRight, { zIndex: 0 }]}
          />
        </View>

        {/* Right Arrow */}
        <TouchableOpacity
          style={[styles.arrowButton, styles.arrowRight]}
          onPress={() => handleManualScroll('right')}
        >
          <Text style={[styles.arrowText, { color: currentStyle.arrowColor }]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Dots */}
      <View style={styles.progressContainer}>
        {titles.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  index === currentTitleIndex
                    ? currentStyle.highlightColor
                    : currentStyle.cardBorder,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  brandSliderContainer: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'visible',
  },
  brandSliderHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  brandSliderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  brandSliderSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  sliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 120,
    overflow: 'visible',
  },
  brandSliderContent: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  brandCard: {
    width: 84,
    height: 84,
    marginHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  brandLogo: {
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  brandName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  brandGradientLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
  },
  brandGradientRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  arrowLeft: {
    left: 8,
    top: '50%',
    marginTop: -18,
  },
  arrowRight: {
    right: 8,
    top: '50%',
    marginTop: -18,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    opacity: 0.7,
  },
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default BrandSlider;
