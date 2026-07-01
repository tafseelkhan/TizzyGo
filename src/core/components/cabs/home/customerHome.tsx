import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from './HeaderHome';
import CategoryTabs from './CategoryTabsHome';
import VehiclesList from './VehicleListHome';
import BottomNavigation from './BottomNavigationHome';

// Define navigation param types
type RootStackParamList = {
  CustomerCab: undefined;
  CustomerShop: undefined;
  Seller: undefined;
  BookCab: undefined;
  Rentes: undefined;
  Shippings: undefined;
  Chat: undefined;
  MyAds: undefined;
  Profile: undefined;
  Search: undefined;
  [key: string]: any;
};

// CarItem type - Import from VehiclesList
import { CarItem } from './VehicleListHome';

const HomeScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<string>('home');

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  const handleBookPress = (vehicle: CarItem) => {
    console.log('Book Now pressed for:', vehicle.name);
    navigation.navigate('BookCab');
  };

  const handleFavoritePress = (vehicle: CarItem) => {
    console.log('Favorite toggled for:', vehicle.name);
    // Toggle favorite logic here
  };

  const handleHomePress = () => {
    navigation.navigate('CustomerCab');
  };

  const handleChatPress = () => {
    navigation.navigate('Chat');
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Component */}
        <Header
          onSearchPress={handleSearchPress}
          onFilterPress={() => console.log('Filter pressed')}
          onNotificationPress={() => console.log('Notification pressed')}
        />

        {/* Gray Content Panel */}
        <View style={styles.grayContentPanel}>
          {/* Category Tabs Component - Data inside component */}
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Vehicles List Component - Data inside component */}
          <VehiclesList
            onBookPress={handleBookPress}
            onFavoritePress={handleFavoritePress}
          />
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Bottom Navigation Component */}
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onSearchPress={handleSearchPress}
        onHomePress={handleHomePress}
        onChatPress={handleChatPress}
        onProfilePress={handleProfilePress}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAEAEA',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  grayContentPanel: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
