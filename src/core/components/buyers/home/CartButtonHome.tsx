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
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { APIs } from "../../../services/HomeService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '../../../contexts/theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import Lottie animation
const cartAnimation = require("../../components/animations/lotties/Add to cart.json");

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
  const [scaleAnim] = useState(new Animated.Value(1));
  const [bounceAnim] = useState(new Animated.Value(1));

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
    Animated.timing(scaleAnim, {
      toValue: 0.92,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleCartPress = () => {
    navigation.navigate("CartScreen");
  };

  // Get button background color based on theme
  const getButtonBackgroundColor = () => {
    return isDark ? '#00000000' : '#00000000';
  };

  const getButtonBorderColor = () => {
    return isDark ? '#4B5563' : '#E5E7EB';
  };

  const getBadgeBackgroundColor = () => {
    return '#0d9488'; // Teal color for badge
  };

  const getIconColor = () => {
    return isDark ? '#F1F5F9' : '#1f2937';
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
            backgroundColor: getButtonBackgroundColor(),
            borderColor: getButtonBorderColor(),
          },
        ]}
      >
        {/* Cart Icon with Lottie Animation */}
        <View style={styles.iconContainer}>
          <LottieView
            source={cartAnimation}
            style={styles.lottie}
            autoPlay={true}
            loop={true}
            resizeMode="cover"
          />
        </View>

        {/* Cart Count Badge */}
        {cartCount > 0 && (
          <Animated.View
            style={[
              styles.badge,
              {
                transform: [{ scale: bounceAnim }],
                backgroundColor: getBadgeBackgroundColor(),
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
    padding: 4,
  },
  button: {
    width: 58,
    height: 58,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: 32,
    height: 32,
    marginLeft: -30,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0d9488",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
    paddingHorizontal: 5,
  },
});

export default CartButton;