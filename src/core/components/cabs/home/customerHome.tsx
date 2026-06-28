import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// ---------- Types ----------
interface CategoryTab {
  id: string;
  label: string;
}

interface CarListing {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  isFavorite: boolean;
}

// ---------- Static data (replace with API data later) ----------
const CATEGORIES: CategoryTab[] = [
  { id: 'all', label: 'All' },
  { id: 'rido', label: 'Rido' },
  { id: 'zido', label: 'Zido' },
  { id: 'hopz', label: 'Hopz' },
];

const FEATURED_CAR: CarListing = {
  id: 'voyage-fusion',
  name: 'Voyage Fusion',
  price: 95,
  rating: 4.9,
  image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
  isFavorite: true,
};

const CAR_LIST: CarListing[] = [
  {
    id: 'nissan-altima',
    name: 'Nissan Altima',
    price: 75,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
    isFavorite: false,
  },
];

// ---------- Theme (yellow -> green) ----------
const COLORS = {
  primary: '#1FAA59', // main green accent (was yellow)
  primaryDark: '#0E8C46',
  primaryLight: '#E6F7EC',
  black: '#1A1A1A',
  white: '#FFFFFF',
  gray: '#8A8A8A',
  lightGray: '#F2F2F2',
  cardGray: '#F5F5F5',
  heartActive: '#FF4D6D',
};

const HomeScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isFeaturedFavorite, setIsFeaturedFavorite] = useState<boolean>(
    FEATURED_CAR.isFavorite,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ---------- Header ---------- */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200',
              }}
              style={styles.avatar}
            />
            <View style={styles.locationPill}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationText}>San Francisco</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* ---------- Greeting ---------- */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>Hello Martin!</Text>
          <Text style={styles.greetingSubtitle}>
            Start your timeless adventure today.
          </Text>
        </View>

        {/* ---------- Search bar ---------- */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <View style={styles.searchTextWrap}>
            <Text style={styles.searchTitle}>Which classic?</Text>
            <Text style={styles.searchSubtitle}>Anywhere ・ Anytime</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ---------- Category tabs ---------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryRow}
          contentContainerStyle={styles.categoryRowContent}
        >
          {CATEGORIES.map(category => {
            const isActive = category.id === activeCategory;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    isActive && styles.categoryLabelActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ---------- Featured car card ---------- */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredHeader}>
            <View>
              <Text style={styles.featuredName}>{FEATURED_CAR.name}</Text>
              <Text style={styles.featuredPrice}>
                ${FEATURED_CAR.price}
                <Text style={styles.featuredPriceUnit}>/h</Text>
                <Text style={styles.featuredRating}>
                  {'   '}⭐ {FEATURED_CAR.rating}
                </Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => setIsFeaturedFavorite(!isFeaturedFavorite)}
            >
              <Text
                style={[
                  styles.favoriteIcon,
                  isFeaturedFavorite && styles.favoriteIconActive,
                ]}
              >
                {isFeaturedFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>

          <Image
            source={{ uri: FEATURED_CAR.image }}
            style={styles.featuredImage}
          />

          <TouchableOpacity style={styles.bookNowButton}>
            <Text style={styles.bookNowText}>Book Now</Text>
          </TouchableOpacity>
        </View>

        {/* ---------- Car list ---------- */}
        {CAR_LIST.map(car => (
          <View key={car.id} style={styles.listCard}>
            <Image source={{ uri: car.image }} style={styles.listImage} />
            <View style={styles.listInfo}>
              <Text style={styles.listName}>{car.name}</Text>
              <Text style={styles.listPrice}>
                ${car.price}
                <Text style={styles.listPriceUnit}>/h</Text>
              </Text>
              <Text style={styles.listRating}>⭐ {car.rating}</Text>
            </View>
            <TouchableOpacity style={styles.listFavoriteButton}>
              <Text style={styles.listFavoriteIcon}>
                {car.isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPin: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },

  // Greeting
  greetingBlock: {
    marginTop: 24,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.black,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 20,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchTextWrap: {
    flex: 1,
  },
  searchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
  searchSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 16,
  },

  // Categories
  categoryRow: {
    marginTop: 20,
  },
  categoryRowContent: {
    paddingRight: 20,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  categoryLabelActive: {
    color: COLORS.white,
  },

  // Featured card
  featuredCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 18,
    marginTop: 22,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  featuredName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
  },
  featuredPriceUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.white,
  },
  featuredRating: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 16,
  },
  favoriteIconActive: {},
  featuredImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginTop: 14,
    resizeMode: 'cover',
  },
  bookNowButton: {
    backgroundColor: COLORS.black,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  bookNowText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // List card
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardGray,
    borderRadius: 20,
    padding: 14,
    marginTop: 16,
  },
  listImage: {
    width: 70,
    height: 56,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  listInfo: {
    flex: 1,
    marginLeft: 14,
  },
  listName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  listPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  listPriceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.gray,
  },
  listRating: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  listFavoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFavoriteIcon: {
    fontSize: 16,
  },
});

export default HomeScreen;
