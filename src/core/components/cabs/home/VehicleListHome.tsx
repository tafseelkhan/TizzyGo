import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface CarItem {
  id: string;
  name: string;
  price: string;
  image: any;
  bgColor: string;
  serviceType: string;
  screen: string;
}

const DEFAULT_VEHICLES: CarItem[] = [
  {
    id: 'local',
    name: 'FWSLocal',
    price: '₹150',
    image: require('../../../../assets/cabs/FWSLocalRide.png'),
    bgColor: '#FFFFFF',
    serviceType: 'local',
    screen: 'LocalRideLocationInput',
  },
  {
    id: 'airport',
    name: 'FWSAirport',
    price: '₹200',
    image: require('../../../../assets/cabs/FWSAirport.png'),
    bgColor: '#FFFFFF',
    serviceType: 'airport',
    screen: 'AirportLocationInput',
  },
  {
    id: 'intercity',
    name: 'FWSIntercity',
    price: '₹180',
    image: require('../../../../assets/cabs/FWSIntercity.png'),
    bgColor: '#FFFFFF',
    serviceType: 'intercity',
    screen: 'LocalRideLocationInput',
  },
  // {
  //   id: 'outstation',
  //   name: 'FWSOutstation',
  //   price: '₹250',
  //   image: require('../../../../assets/cabs/FWSOutstation.png'),
  //   bgColor: '#FFFFFF',
  //   serviceType: 'outstation',
  //   screen: 'FWSOutstation',
  // },
  // {
  //   id: 'scheduled',
  //   name: 'FWSScheduled',
  //   price: '₹130',
  //   image: require('../../../../assets/cabs/FWSScheduled.png'),
  //   bgColor: '#FFFFFF',
  //   serviceType: 'scheduled',
  //   screen: 'FWSScheduled',
  // },
  // {
  //   id: 'shared',
  //   name: 'FWSShared',
  //   price: '₹90',
  //   image: require('../../../../assets/cabs/FWSShared.png'),
  //   bgColor: '#FFFFFF',
  //   serviceType: 'shared',
  //   screen: 'FWSShared',
  // },
  // {
  //   id: 'corporate',
  //   name: 'FWSCorporate',
  //   price: '₹300',
  //   image: require('../../../../assets/cabs/FWSCorporate.png'),
  //   bgColor: '#FFFFFF',
  //   serviceType: 'corporate',
  //   screen: 'FWSCorporate',
  // },
  // {
  //   id: 'rental',
  //   name: 'FWSRental',
  //   price: '₹120',
  //   image: require('../../../../assets/cabs/FWSRental.png'),
  //   bgColor: '#FFFFFF',
  //   serviceType: 'rental',
  //   screen: 'FWSRental',
  // },
];

interface VehiclesListProps {
  vehicles?: CarItem[];
  onBookPress?: (vehicle: CarItem) => void;
  serviceFilter?: string;
}

const VehiclesList: React.FC<VehiclesListProps> = ({
  vehicles = DEFAULT_VEHICLES,
  onBookPress,
  serviceFilter,
}) => {
  const navigation = useNavigation();

  const filteredVehicles = serviceFilter
    ? vehicles.filter(v => v.serviceType === serviceFilter)
    : vehicles;

  const handleBookPress = (vehicle: CarItem) => {
    if (onBookPress) {
      onBookPress(vehicle);
    } else {
      try {
        navigation.navigate(vehicle.screen as never);
      } catch (error) {
        Alert.alert(
          'Navigation Error',
          `Could not navigate to ${vehicle.screen}. Please check if screen is registered.`,
        );
      }
    }
  };

  const renderItem = ({ item }: { item: CarItem }) => (
    <View style={[styles.carCard, { backgroundColor: item.bgColor }]}>
      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.serviceType?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={item.image}
          style={styles.carImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.servicePrice}>{item.price}</Text>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => handleBookPress(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.bookButtonText}>Book Now</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredVehicles}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  carCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  badgeContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  carImage: {
    width: '100%',
    height: 140,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2ECC71',
  },
  bookButton: {
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

export default VehiclesList;
