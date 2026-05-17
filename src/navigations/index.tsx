import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import TizzyGo from '../screens/animations/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/Profile';
import EditProfileScreen from '../screens/profile/ProfileEdit';
import SettingsScreen from '../screens/settings/Settings';
import ProductDetailScreen from '../screens/ProductDetail/ProductDetailScreen';
import OrderSuccessScreen from '../screens/Orders/OrderSuccessScreen';
import BuyNowScreen from '../screens/BuyNow/BuyNow';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  ProductDetail: { productId: string };
  OrderSuccessScreen: undefined;
  BuyNow: { productId: string };
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
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen
          name="OrderSuccessScreen"
          component={OrderSuccessScreen}
        />
        <Stack.Screen name="BuyNow" component={BuyNowScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
