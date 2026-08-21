import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from './HeaderHome';
import CategoryTabs from './CategoryTabsHome';
import VehiclesList from './VehicleListHome';
import BottomNavigation from './BottomNavigationHome';
import { profileService } from '../../../services/profile/profileService';

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
  FWSRideOptions: undefined;
  LocalRideLocationInput: undefined;
  AirportLocationInput: undefined;
  [key: string]: any;
};

import { CarItem } from './VehicleListHome';

const HomeScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [userName, setUserName] = useState<string>('Martin');
  const [userImage, setUserImage] = useState<string | null>(null);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const result = await profileService.fetchProfile();
      if (result.success && result.data) {
        if (result.data.name) setUserName(result.data.name);
        if (result.data.image && result.data.image !== '') {
          setUserImage(result.data.image);
        }
      }
    } catch (error) {
      console.log('Profile fetch error:', error);
    }
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSearchPress = () => {
    navigation.navigate('FWSRideOptions');
  };

  const handleBookPress = (vehicle: CarItem) => {
    console.log('Book Now pressed for:', vehicle.name);
    navigation.navigate(vehicle.screen as never);
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

  const getFilterValue = (category: string) => {
    if (category === 'All') return undefined;
    return category.replace('FWS', '').toLowerCase();
  };

  const handleLocationUpdate = (newLocation: string) => {
    console.log('Location updated:', newLocation);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            <Header
              onSearchPress={handleSearchPress}
              onFilterPress={() => console.log('Filter pressed')}
              onNotificationPress={() => console.log('Notification pressed')}
              userName={userName}
              userImage={userImage}
              onLocationUpdate={handleLocationUpdate}
            />

            <View style={styles.contentPanel}>
              <CategoryTabs
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              <VehiclesList
                onBookPress={handleBookPress}
                serviceFilter={getFilterValue(selectedCategory)}
              />
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingBottom: 100,
  },
  contentPanel: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});

export default HomeScreen;
