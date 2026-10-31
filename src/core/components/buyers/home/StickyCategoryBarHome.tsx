// src/core/components/buyers/home/StickyCategoryBarHome.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'For You', icon: 'apps' },
  { name: 'Cars', icon: 'car' },
  { name: 'Mobiles', icon: 'smartphone' },
  { name: 'Properties', icon: 'business' },
  { name: 'Electronics', icon: 'devices' },
  { name: 'Furniture', icon: 'chair' },
  { name: 'Fashion', icon: 'tshirt' },
  { name: 'Sports', icon: 'basketball' },
];

interface StickyCategoryBarProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
  isDark: boolean;
  scrollY: Animated.Value;
  tintColors?: string[];
}

function getCategoryIcon(iconName: string, color: string, size = 24) {
  switch (iconName) {
    case 'apps': return <Ionicons name="grid-outline" size={size} color={color} />;
    case 'home': return <Ionicons name="home-outline" size={size} color={color} />;
    case 'car': return <Ionicons name="car-outline" size={size} color={color} />;
    case 'bike': return <MaterialIcons name="two-wheeler" size={size} color={color} />;
    case 'motorcycle': return <MaterialIcons name="two-wheeler" size={size} color={color} />;
    case 'smartphone': return <Ionicons name="phone-portrait-outline" size={size} color={color} />;
    case 'business': return <Ionicons name="business-outline" size={size} color={color} />;
    case 'devices': return <MaterialIcons name="devices-other" size={size} color={color} />;
    case 'chair': return <MaterialIcons name="chair" size={size} color={color} />;
    case 'tshirt': return <Ionicons name="shirt-outline" size={size} color={color} />;
    case 'basketball': return <Ionicons name="basketball-outline" size={size} color={color} />;
    case 'beauty': return <Ionicons name="sparkles-outline" size={size} color={color} />;
    case 'pets': return <Ionicons name="paw-outline" size={size} color={color} />;
    case 'jobs': return <Ionicons name="briefcase-outline" size={size} color={color} />;
    case 'services': return <Ionicons name="build-outline" size={size} color={color} />;
    case 'books': return <Ionicons name="book-outline" size={size} color={color} />;
    case 'toys': return <Ionicons name="game-controller-outline" size={size} color={color} />;
    default: return <Ionicons name="apps-outline" size={size} color={color} />;
  }
}

const StickyCategoryBar: React.FC<StickyCategoryBarProps> = ({
  selectedCategory,
  onSelect,
  isDark,
  scrollY,
}) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.7)' : '#000000';

  const CHIP_TOP_OFFSET = -20;

  const iconOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const iconTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });

  const iconScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const bgOpacity = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const activeIndex = CATEGORIES.findIndex(
      cat => cat.name === selectedCategory || (selectedCategory === 'All' && cat.name === 'For You')
    );
    if (activeIndex !== -1 && scrollRef.current) {
      const estimatedX = activeIndex * 80 - screenWidth / 2 + 45;
      scrollRef.current.scrollTo({ x: Math.max(0, estimatedX), animated: true });
    }
  }, [selectedCategory]);

  const CONTENT_PADDING_TOP = insets.top + CHIP_TOP_OFFSET;
  const WHITE_BG_OVERLAP_UP = 12;
  const whiteBgTop = -(CONTENT_PADDING_TOP + WHITE_BG_OVERLAP_UP);

  const whiteBgContentHeight = 24 + 4 + 18 + 4 + 8 + 20;
  const whiteBgHeight = CONTENT_PADDING_TOP + WHITE_BG_OVERLAP_UP + whiteBgContentHeight;

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.scrollBg,
          {
            top: whiteBgTop,
            height: whiteBgHeight,
            opacity: bgOpacity,
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          },
        ]}
        pointerEvents="none"
      />

      <View style={{ paddingTop: CONTENT_PADDING_TOP }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled
          nestedScrollEnabled
          bounces
          style={{ width: '100%' }}
        >
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.name || (selectedCategory === 'All' && cat.name === 'For You');
            return (
              <TouchableOpacity
                key={cat.name}
                onPress={() => onSelect(cat.name === 'For You' ? 'All' : cat.name)}
                activeOpacity={0.8}
                style={styles.chip}
              >
                <Animated.View
                  style={{
                    opacity: iconOpacity,
                    transform: [
                      { translateY: iconTranslateY },
                      { scale: iconScale },
                    ],
                    marginBottom: 4,
                    zIndex: 2,
                  }}
                >
                  {getCategoryIcon(cat.icon, isActive ? activeColor : inactiveColor, 24)}
                </Animated.View>

                <Text
                  style={[
                    styles.chipText,
                    { color: isActive ? activeColor : inactiveColor },
                    isActive && styles.chipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>

                {isActive && (
                  <View
                    style={[
                      styles.indicator,
                      {
                        backgroundColor: isDark ? '#FFFFFF' : '#000000',
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  // ✅ White container — NO rounded corners now
  scrollBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    // ❌ Removed borderBottomLeftRadius / borderBottomRightRadius
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 24,
    paddingBottom: 8,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    zIndex: 2,
  },
  chipTextActive: {
    fontWeight: '800',
  },
  indicator: {
    position: 'absolute',
    bottom: -4,
    width: '80%',
    height: 2,
    borderRadius: 2,
    zIndex: 2,
  },
});

export default StickyCategoryBar;