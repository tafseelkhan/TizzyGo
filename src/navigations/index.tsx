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
import CustomerHomeScreen from '../screens/cabs/home/customerHome';
import FwsRidesOptionServicesScreen from '../screens/cabs/services/FwsRidesOptionServices';
import FWSLocalRideScreen from '../screens/cabs/FWSLocalRide/FWSLocalRide';
import LocationInputScreen from '../screens/cabs/common/LocationInputScreen';
import RideSearchScreen from '../screens/cabs/common/RideSearchScreen';

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
  FWSRideOptions: undefined;
  FWSLocalRide: {
    pickup?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
    drop?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
    pickupText?: string;
    dropText?: string;
  };
  LocationInput: {
    pickupText?: string;
    dropText?: string;
    pickup?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
    drop?: {
      latitude: number;
      longitude: number;
      address: string;
      googlePlaceId: string;
    };
  };
  Tracking: { bookingId: string };
  RideSearch: {
    bookingId: string;
    pickup: {
      latitude: number;
      longitude: number;
      address: string;
    };
    drop: {
      latitude: number;
      longitude: number;
      address: string;
    };
    fare: number;
    rideType: string;
    customerId: string; // ✅ Add this
    polyline: string;
  };
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
        <Stack.Screen name="CustomerCab" component={CustomerHomeScreen} />
        <Stack.Screen
          name="FWSRideOptions"
          component={FwsRidesOptionServicesScreen}
        />
        <Stack.Screen name="FWSLocalRide" component={FWSLocalRideScreen} />
        <Stack.Screen name="LocationInput" component={LocationInputScreen} />
        <Stack.Screen name="RideSearch" component={RideSearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
