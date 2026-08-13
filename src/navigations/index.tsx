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
import YourOrderScreen from '../screens/inventory/YourOrders/YourOrders';
import CheckOutScreen from '../screens/shop/CheckOutScreen';
import CartScreen from '../screens/cart/CartScreen';
import PaymentSuccess from '../screens/inventory/paymentSuccess';
import OrderTrackingScreen from '../screens/inventory/Tracking/OrderTrackingScreen';

// Cabs Imports
import CustomerHomeScreen from '../screens/cabs/home/customerHome';
import FwsRidesOptionServicesScreen from '../screens/cabs/services/FwsRidesOptionServices';
import FWSLocalRideScreen from '../screens/cabs/FWSLocalRide/FWSLocalRide';
import LocalRideLocationInput from '../screens/cabs/FWSLocalRide/common/LocationInputScreen';
import RideSearchScreen from '../screens/cabs/FWSLocalRide/common/RideSearchScreen';
import FWSAirportScreen from '../screens/cabs/FWSAirport/FWSAirport';
import AirportLocationInput from '../screens/cabs/FWSAirport/common/LocationInputScreen';

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
  YourOrders: undefined;
  CheckOutScreen: { productId: string; variantId?: string | null };
  CartScreen: undefined;
  OrderConfirmation: { checkoutSessionId: string };
  OrderTracking: { orderId: string };

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
  FWSAirport: {
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
    selectedOption?: string;
  };
  AirportLocationInput: {
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
  LocalRideLocationInput: {
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
        <Stack.Screen name="YourOrders" component={YourOrderScreen} />
        <Stack.Screen name="CheckOutScreen" component={CheckOutScreen} />
        <Stack.Screen name="CartScreen" component={CartScreen} />
        <Stack.Screen name="OrderConfirmation" component={PaymentSuccess} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />

        {/* Cabs Screens - Add more when needed */}
        <Stack.Screen name="CustomerCab" component={CustomerHomeScreen} />
        <Stack.Screen
          name="FWSRideOptions"
          component={FwsRidesOptionServicesScreen}
        />
        <Stack.Screen name="FWSLocalRide" component={FWSLocalRideScreen} />
        <Stack.Screen
          name="LocalRideLocationInput"
          component={LocalRideLocationInput}
        />
        <Stack.Screen name="RideSearch" component={RideSearchScreen} />
        <Stack.Screen name="FWSAirport" component={FWSAirportScreen} />
        <Stack.Screen
          name="AirportLocationInput"
          component={AirportLocationInput}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
