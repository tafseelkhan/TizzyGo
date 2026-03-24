// components/Header.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  Dimensions,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import LottieView from "lottie-react-native";
import { useTheme } from "../../contexts/theme/ThemeContext";

// Import your components
import SearchBar from "./SearchBarHome";
import FilterDropdown from "./Common/FilterDropDownHome";
import CartButton from "./CartButtonHome";

// Import Lottie animations
const xaiAnimation = require("../../components/animations/lotties/Artificial Intelligence.json");

interface SearchResult {
  category: string;
  products: Array<{
    _id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
  }>;
}

interface Announcement {
  id: string;
  message: string;
  isActive: boolean;
  type: string;
}

interface HeaderProps {
  location: string;
  setLocation: (location: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  handleCategoryClick: (category: string) => void;
  onSearchResults?: (results: SearchResult[]) => void;
  onRefresh?: () => Promise<void>;
  userId?: string;
  disableScrollEffect?: boolean;
  refreshing?: boolean;
  showFilterButton?: boolean;
  hasSearchResults?: boolean;
  scrollY: Animated.Value;
  isDark?: boolean;
}

// Define navigation param types
type RootStackParamList = {
  "/": undefined;
  "/xai": undefined;
  [key: string]: any;
};

const Header: React.FC<HeaderProps> = ({
  location,
  setLocation,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  handleCategoryClick,
  onSearchResults,
  onRefresh,
  userId = "default-user",
  disableScrollEffect = false,
  refreshing = false,
  showFilterButton = false,
  hasSearchResults = false,
  scrollY,
  isDark: parentIsDark,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Get theme from ThemeContext (fallback to parent prop)
  const themeContext = useTheme();
  const isDark = parentIsDark !== undefined ? parentIsDark : themeContext?.isDark || false;

  // Theme-based colors
  const getThemeColors = () => {
    return {
      headerBg: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      textColor: isDark ? '#F1F5F9' : '#374151',
      subtitleColor: isDark ? '#94A3B8' : '#6b7280',
      logoColor: isDark ? '#7DD3FC' : 'rgba(0, 255, 213, 1)',
      logoSubtitle: isDark ? '#7DD3FC' : 'rgba(0, 255, 255, 1)',
      buttonBg: isDark ? '#2D3748' : 'white',
      xaiButtonBg: isDark ? '#334155' : 'rgba(255, 255, 255, 0.5)',
      buttonBorder: isDark ? '#4B5563' : 'rgba(255, 255, 255, 0.5)',
      shadowColor: isDark ? '#000' : '#000',
      announcementColors: isDark ? ['#0D9488', '#0891B2'] : ['#5EEAD4', '#38BDF8'],
    };
  };

  const themeColors = getThemeColors();

  // Animated values for header hide/show using scrollY
  const headerHeight = 120;

  const translateY = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: "clamp",
  });

  const opacity = scrollY.interpolate({
    inputRange: [0, headerHeight / 2, headerHeight],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  // Search active status track
  useEffect(() => {
    setIsSearchActive(searchQuery.length > 0 && hasSearchResults);
  }, [searchQuery, hasSearchResults]);

  // Announcement API fetch
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoadingAnnouncement(true);
        const response = await fetch("/api/admin/announcement");

        if (response.ok) {
          const data = await response.json();
          if (data.isActive) {
            setAnnouncement(data);
          }
        }
      } catch (error) {
        console.error("Announcement fetch error:", error);
        setAnnouncement({
          id: "default",
          message: "🚀 Free shipping on orders over $50! Limited time offer.",
          isActive: true,
          type: "info",
        });
      } finally {
        setLoadingAnnouncement(false);
      }
    };

    fetchAnnouncement();
  }, []);

  // Scroll effect for background change
  useEffect(() => {
    if (disableScrollEffect) return;

    const listener = scrollY.addListener(({ value }) => {
      setIsScrolled(value > 20);
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, disableScrollEffect]);

  // Filter button show/hide logic
  const shouldShowFilterButton = showFilterButton && isSearchActive;

  const headerBackground = isScrolled
    ? [styles.scrolledHeader, { backgroundColor: themeColors.headerBg }]
    : styles.normalHeader;

  const { width } = Dimensions.get("window");

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.header,
        headerBackground,
        {
          transform: [{ translateY: disableScrollEffect ? 0 : translateY }],
          opacity: disableScrollEffect ? 1 : opacity,
        },
      ]}
    >
      {/* Status Bar Background for Mobile */}
      {Platform.OS !== "web" && width < 1024 && (
        <View style={[styles.statusBarBackground, { 
          backgroundColor: isDark ? '#0F172A' : 'white' 
        }]}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
            translucent
            backgroundColor="transparent"
          />
        </View>
      )}

      {/* Announcement Bar */}
      {!loadingAnnouncement && announcement && (
        <LinearGradient
          colors={themeColors.announcementColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.announcementBar}
        >
          <Text style={styles.announcementText}>{announcement.message}</Text>
        </LinearGradient>
      )}

      {loadingAnnouncement && (
        <View style={[styles.loadingAnnouncement, { 
          backgroundColor: isDark ? '#4B5563' : '#cbd5e1' 
        }]}>
          <Text style={[styles.announcementText, { 
            color: isDark ? '#E5E7EB' : 'white' 
          }]}>
            Loading announcement...
          </Text>
        </View>
      )}

      {/* Main Header Content */}
      <View style={styles.mainHeader}>
        {/* Desktop/Layout for larger screens */}
        <View style={styles.desktopHeader}>
          {/* Logo Section */}
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => navigation.navigate("/")}
          >
            <View style={styles.logoWrapper}>
              <View style={[
                styles.logoBackground, 
                { 
                  backgroundColor: themeColors.buttonBg,
                  borderColor: themeColors.buttonBg,
                  shadowColor: themeColors.shadowColor,
                }
              ]}>
                <Image
                  source={require("../../../assets/images/tizzy-logo.jpg")}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={[styles.logoTitle, { color: themeColors.logoColor }]}>
                TizzyGo
              </Text>
              <Text
                style={[
                  styles.logoSubtitle, 
                  isScrolled && styles.hiddenSubtitle,
                  { color: themeColors.subtitleColor }
                ]}
              >
                Shop Smarter, Live Better❤️
              </Text>
            </View>
          </TouchableOpacity>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearchResults={onSearchResults}
              userId={userId}
              handleCategoryClick={handleCategoryClick}
              isMobile={false}
              isDark={isDark}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* XAI Button - Hide when search active */}
            {!isSearchActive && (
              <TouchableOpacity
                style={[
                  styles.aiButton, 
                  { 
                    backgroundColor: themeColors.xaiButtonBg,
                    shadowColor: themeColors.shadowColor,
                  }
                ]}
                onPress={() => navigation.navigate("/xai")}
              >
                <View style={[
                  styles.lottieContainer,
                  { backgroundColor: 'transparent' }
                ]}>
                  <LottieView
                    source={xaiAnimation}
                    autoPlay
                    loop
                    style={styles.lottieAnimation}
                  />
                </View>
              </TouchableOpacity>
            )}

            {/* Cart Button - Hide when search active */}
            {!isSearchActive && (
              <CartButton 
                userId={userId} 
              />
            )}

            {/* Filter Button - Show only when search active and has results */}
            {shouldShowFilterButton && (
              <FilterDropdown
                selectedCategory={selectedCategory}
                handleCategoryClick={handleCategoryClick}
                isMobile={false}
              />
            )}
          </View>
        </View>

        {/* Mobile Header */}
        <View style={styles.mobileHeader}>
          {/* Top Mobile Bar */}
          <View style={styles.mobileTopBar}>
            {/* Logo */}
            <TouchableOpacity
              style={styles.mobileLogoContainer}
              onPress={() => navigation.navigate("/")}
            >
              <View style={[
                styles.mobileLogo, 
                { 
                  backgroundColor: themeColors.buttonBg,
                  shadowColor: themeColors.shadowColor,
                }
              ]}>
                <Image
                  source={require("../../../assets/images/tizzy-logo.jpg")}
                  style={styles.mobileLogoImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.mobileLogoText}>
                <Text style={[styles.mobileLogoTitle, { color: themeColors.logoSubtitle }]}>
                  TizzyGo
                </Text>
                <Text
                  style={[
                    styles.mobileLogoSubtitle,
                    isScrolled && styles.hiddenSubtitle,
                    { color: themeColors.subtitleColor }
                  ]}
                >
                  Shop Smarter❤️
                </Text>
              </View>
            </TouchableOpacity>

            {/* Mobile Action Buttons */}
            <View style={styles.mobileActions}>
              {/* XAI Button - Hide when search active */}
              {!isSearchActive && (
                <TouchableOpacity
                  style={[
                    styles.mobileAiButton, 
                    { 
                      backgroundColor: themeColors.xaiButtonBg,
                      borderColor: themeColors.buttonBorder,
                      shadowColor: themeColors.shadowColor,
                    }
                  ]}
                  onPress={() => navigation.navigate("/xai")}
                >
                  <View style={[
                    styles.mobileLottieContainer,
                    { backgroundColor: 'transparent' }
                  ]}>
                    <LottieView
                      source={xaiAnimation}
                      autoPlay
                      loop
                      style={styles.mobileLottie}
                    />
                  </View>
                </TouchableOpacity>
              )}

              {/* Cart Button - Hide when search active */}
              {!isSearchActive && (
                <CartButton 
                  userId={userId} 
                />
              )}

              {/* Filter Button - Show only when search active and has results */}
              {shouldShowFilterButton && (
                <FilterDropdown
                  selectedCategory={selectedCategory}
                  handleCategoryClick={handleCategoryClick}
                  isMobile={true}
                />
              )}
            </View>
          </View>

          {/* Mobile Search Bar */}
          <View style={styles.mobileSearchContainer}>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearchResults={onSearchResults}
              userId={userId}
              handleCategoryClick={handleCategoryClick}
              isMobile={true}
              isDark={isDark}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'transparent',
    height: 950,
    overflow: 'hidden',
  },
  statusBarBackground: {
    height: Platform.OS === "ios" ? 44 : StatusBar.currentHeight,
    backgroundColor: "white",
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  normalHeader: {
    backgroundColor: "transparent",
  },
  scrolledHeader: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  announcementBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop:
      Platform.OS !== "web" && width < 1024
        ? Platform.OS === "ios"
          ? 44
          : StatusBar.currentHeight
        : 0,
  },
  loadingAnnouncement: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#cbd5e1",
    marginTop:
      Platform.OS !== "web" && width < 1024
        ? Platform.OS === "ios"
          ? 44
          : StatusBar.currentHeight
        : 0,
  },
  announcementText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  mainHeader: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  desktopHeader: {
    display: width >= 1024 ? "flex" : "none",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    gap: 24,
  },
  mobileHeader: {
    display: width >= 1024 ? "none" : "flex",
    paddingVertical: 8,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  logoWrapper: {
    position: "relative",
  },
  logoBackground: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 2,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoTextContainer: {
    flexDirection: "column",
    minWidth: 0,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "billabong",
    letterSpacing: 1,
  },
  logoSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  hiddenSubtitle: {
    opacity: 0,
    height: 0,
  },
  searchContainer: {
    flexGrow: 1,
    maxWidth: 672,
  },
  locationContainer: {
    flexShrink: 0,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiButton: {
    padding: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lottieContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  lottieAnimation: {
    width: 40,
    height: 40,
  },
  mobileTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  mobileLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  mobileLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  mobileLogoImage: {
    width: "100%",
    height: "100%",
  },
  mobileLogoText: {
    flexDirection: "column",
  },
  mobileLogoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "billabong",
  },
  mobileLogoSubtitle: {
    fontSize: 10,
    fontWeight: "600",
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mobileAiButton: {
    padding: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  mobileLottieContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    overflow: 'hidden',
  },
  mobileLottie: {
    width: 20,
    height: 20,
  },
  mobileSearchContainer: {
    paddingBottom: 8,
  },
  mobileLocationContainer: {
    paddingBottom: 67,
  },
});

export default Header;