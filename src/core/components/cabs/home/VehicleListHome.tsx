import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Mock Data for Car Cards - YAHAN DEFINED
export interface CarItem {
  id: string;
  name: string;
  price: string;
  rating: number;
  image: any;
  bgColor: string;
  isFavorite: boolean;
}

const DEFAULT_VEHICLES: CarItem[] = [
  {
    id: '1',
    name: 'Voyage Fusion',
    price: '$95/h',
    rating: 4.9,
    image: { uri: 'https://pngimg.com/d/mercedes_PNG1.png' },
    bgColor: '#2ECC71',
    isFavorite: true,
  },
  {
    id: '2',
    name: 'Nissan Altima',
    price: '$75/h',
    rating: 4.8,
    image: { uri: 'https://pngimg.com/d/nissan_PNG43.png' },
    bgColor: '#FFFFFF',
    isFavorite: false,
  },
];

interface VehiclesListProps {
  vehicles?: CarItem[];
  onBookPress?: (vehicle: CarItem) => void;
  onFavoritePress?: (vehicle: CarItem) => void;
}

const VehiclesList: React.FC<VehiclesListProps> = ({
  vehicles = DEFAULT_VEHICLES,
  onBookPress,
  onFavoritePress,
}) => {
  return (
    <>
      {vehicles.map(item => (
        <View
          key={item.id}
          style={[styles.carCard, { backgroundColor: item.bgColor }]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.carName, { color: '#000' }]}>
                {item.name}
              </Text>
              <View style={styles.priceRatingRow}>
                <Text style={styles.carPrice}>{item.price}</Text>
                <View style={styles.ratingRow}>
                  <FontAwesome name="star" size={14} color="#000" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.favCircle}
              onPress={() => onFavoritePress && onFavoritePress(item)}
            >
              <FontAwesome
                name={item.isFavorite ? 'heart' : 'heart-o'}
                size={18}
                color={item.isFavorite ? '#FF0000' : '#A3A3A3'}
              />
            </TouchableOpacity>
          </View>

          <Image
            source={item.image}
            style={styles.carImage}
            resizeMode="contain"
          />

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => onBookPress && onBookPress(item)}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  carCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  carName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  priceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  carPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginLeft: 4,
  },
  favCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImage: {
    width: '100%',
    height: 140,
    marginVertical: 10,
  },
  bookButton: {
    backgroundColor: '#000000',
    alignSelf: 'flex-end',
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 22,
    marginTop: 5,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default VehiclesList;
