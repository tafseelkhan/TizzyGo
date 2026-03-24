// components/CartButtonWithGradient.tsx
import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { APIs } from "../../services/HomeService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '../../contexts/theme/ThemeContext';

// Import Lottie animations
const cartAnimation = require("../../components/animations/lotties/Add to cart.json");
const animationCart = require("../../components/animations/lotties/shop cart kdp.json");

interface CartButtonProps {
  userId: string;
}

// Define navigation param types
type RootStackParamList = {
  CartScreen: undefined;
  [key: string]: any;
};

const CartButton: React.FC<CartButtonProps> = ({ userId }) => {
  const { isDark } = useTheme();
  const [cartCount, setCartCount] = useState(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [currentCartAnimation, setCurrentCartAnimation] = useState(cartAnimation);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [bounceAnim] = useState(new Animated.Value(1));
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          setCartCount(0);
          return;
        }
        const data = await APIs.getCartCount();
        setCartCount(data.count || 0);

        if (data.count > 0) {
          animateBounce();
        }
      } catch (error) {
        console.error("Error fetching cart count:", error);
        setCartCount(0);
      }
    };

    fetchCartCount();
    const interval = setInterval(fetchCartCount, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const animateBounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.3,
        duration: 150,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    setIsHovered(true);
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsHovered(false);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleCartPress = () => {
    navigation.navigate("CartScreen");
  };
  
  const handleCartAnimationFinish = () => {
    setCurrentCartAnimation(
      currentCartAnimation === cartAnimation ? animationCart : cartAnimation
    );
  };

  // Theme-based colors
  const getGradientColors = () => {
    if (isDark) {
      return isHovered 
        ? ["#1E293B", "#334155"] 
        : ["#0F172A", "#1E293B"];
    } else {
      return isHovered 
        ? ["#f0fdfa", "#e0f2fe"] 
        : ["#f8fafc", "#ffffff"];
    }
  };

  const getBadgeBackgroundColor = () => {
    return isDark ? "#0d9488" : "#0d9488"; // Same color for both themes
  };

  const getBorderColor = () => {
    return isDark ? "#1E293B" : "#f8fafc";
  };

  return (
    <TouchableOpacity
      onPress={handleCartPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.button,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <LottieView
            source={currentCartAnimation}
            style={styles.lottie}
            autoPlay
            loop={false}
            onAnimationFinish={handleCartAnimationFinish}
            resizeMode="cover"
          />
        </LinearGradient>

        {/* Cart Count Badge */}
        {cartCount > 0 && (
          <Animated.View
            style={[
              styles.badge,
              {
                transform: [{ scale: bounceAnim }],
                backgroundColor: getBadgeBackgroundColor(),
                borderColor: getBorderColor(),
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {cartCount > 99 ? "99+" : cartCount}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  gradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
  },
  lottie: {
    width: 40,
    height: 40,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0d9488",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f8fafc",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 4,
  },
});

export default CartButton;