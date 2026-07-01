import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import TizzyGo from '../screens/animations/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ProfileScreen from '../screens/profile/Profile';
import EditProfileScreen from '../screens/profile/ProfileEdit';

// Buyers Imports
import HomeScreen from '../screens/home/HomeScreen';
import SettingsScreen from '../screens/settings/Settings';
import ProductDetailScreen from '../screens/store/ProductDetailScreen';
import OrderSuccessScreen from '../screens/inventory/OrderSuccessScreen';
import BuyNowScreen from '../screens/shop/BuyNow';

// Cabs Imports
import CustomerHome from '../screens/cabs/home/customerHome';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Profile: undefined;
  EditProfile: undefined;

  // Buyers Screens
  CustomerShop: undefined;
  Settings: undefined;
  ProductDetail: { productId: string };
  OrderSuccessScreen: undefined;
  BuyNow: { productId: string; variantId?: string | null };

  // Cabs Screens
  CustomerCab: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={TizzyGo} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />

        {/* Buyer Screens - Add more when neeeded */}
        <Stack.Screen name="CustomerShop" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen
          name="OrderSuccessScreen"
          component={OrderSuccessScreen}
        />
        <Stack.Screen name="BuyNow" component={BuyNowScreen} />

        {/* Cabs Screens - Add more when needed */}
        <Stack.Screen name="CustomerCab" component={CustomerHome} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
