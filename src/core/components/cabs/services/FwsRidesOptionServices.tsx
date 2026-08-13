import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// ---------- Types ----------
type CardSize = 'large' | 'medium' | 'small';

interface ServiceItem {
  id: string;
  name: string;
  image: any;
  screen: string;
  size: CardSize;
}

// ---------- Data ----------
const SERVICES: ServiceItem[] = [
  {
    id: 'local',
    name: 'FWSLocal',
    image: require('../../../../assets/cabs/FWSLocalRide.png'),
    screen: 'LocalRideLocationInput',
    size: 'large',
  },
  {
    id: 'airport',
    name: 'FWSAirport',
    image: require('../../../../assets/cabs/FWSAirport.png'),
    screen: 'FWSAirport',
    size: 'large',
  },
  {
    id: 'intercity',
    name: 'FWSIntercity',
    image: require('../../../../assets/cabs/FWSIntercity.png'),
    screen: 'FWSIntercity',
    size: 'medium',
  },
  {
    id: 'outstation',
    name: 'FWSOutstation',
    image: require('../../../../assets/cabs/FWSOutstation.png'),
    screen: 'FWSOutstation',
    size: 'medium',
  },
  {
    id: 'scheduled',
    name: 'FWSScheduled',
    image: require('../../../../assets/cabs/FWSScheduled.png'),
    screen: 'FWSScheduled',
    size: 'medium',
  },
  {
    id: 'shared',
    name: 'FWSShared',
    image: require('../../../../assets/cabs/FWSShared.png'),
    screen: 'FWSShared',
    size: 'small',
  },
  {
    id: 'corporate',
    name: 'FWSCorporate',
    image: require('../../../../assets/cabs/FWSCorporate.png'),
    screen: 'FWSCorporate',
    size: 'small',
  },
  {
    id: 'rental',
    name: 'FWSRental',
    image: require('../../../../assets/cabs/FWSRental.png'),
    screen: 'FWSRental',
    size: 'small',
  },
];

// ---------- Helpers ----------
const groupIntoRows = (items: ServiceItem[]) => {
  const rows: ServiceItem[][] = [];
  let i = 0;
  while (i < items.length) {
    const size = items[i].size;
    const perRow = size === 'large' ? 2 : size === 'medium' ? 3 : 4;
    rows.push(items.slice(i, i + perRow));
    i += perRow;
  }
  return rows;
};

const ServiceGridScreen = () => {
  const navigation = useNavigation();
  const rows = groupIntoRows(SERVICES);

  const handleServicePress = (service: ServiceItem) => {
    try {
      navigation.navigate(service.screen as never);
    } catch (error) {
      Alert.alert(
        'Navigation Error',
        `Could not navigate to ${service.screen}. Please check if screen is registered.`,
      );
    }
  };

  // Function to get image style based on service id
  const getImageStyle = (serviceId: string) => {
    if (serviceId === 'corporate') {
      return styles.imageCorporate;
    } else if (serviceId === 'scheduled') {
      return styles.imageScheduled;
    } else if (serviceId === 'local' || serviceId === 'airport') {
      return styles.imageLarge;
    } else if (serviceId === 'intercity' || serviceId === 'outstation') {
      return styles.imageMedium;
    } else {
      return styles.imageSmall;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>FWS-Services</Text>
        <Text style={styles.subtitle}>
          Anything • Anyweek • Anytime • Anywhere • Always
        </Text>

        {/* Rows */}
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map(service => (
              <Pressable
                key={service.id}
                onPress={() => handleServicePress(service)}
                style={[
                  styles.card,
                  service.size === 'large' && styles.cardLarge,
                  service.size === 'medium' && styles.cardMedium,
                  service.size === 'small' && styles.cardSmall,
                ]}
              >
                {/* Image container */}
                <View
                  style={[
                    styles.imageContainer,
                    service.size === 'large' && styles.imageContainerLarge,
                    service.size === 'medium' && styles.imageContainerMedium,
                    service.size === 'small' && styles.imageContainerSmall,
                  ]}
                >
                  <Image
                    source={service.image}
                    style={[styles.image, getImageStyle(service.id)]}
                    resizeMode="contain"
                  />
                </View>

                {/* Label */}
                <View style={styles.labelContainer}>
                  <Text style={styles.cardLabel} numberOfLines={1}>
                    {service.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 24,
    fontFamily: 'Poppins-LightItalic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  // Card Base - Hover effect removed
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // Card Sizes
  cardLarge: {
    width: '48.5%',
    height: 180,
    padding: 16,
  },
  cardMedium: {
    width: '31.8%',
    height: 155,
    padding: 12,
  },
  cardSmall: {
    width: '28.8%',
    height: 130,
    padding: 6,
  },

  // Image Container
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  imageContainerLarge: {},
  imageContainerMedium: {},
  imageContainerSmall: {},

  // Base Image Style
  image: {
    alignSelf: 'center',
  },

  // Individual Image Styles
  imageLarge: {
    width: 160,
    height: 140,
  },
  imageMedium: {
    width: 145,
    height: 140,
  },
  imageSmall: {
    width: 135,
    height: 125,
  },
  // Corporate ki image chhoti (iska aspect ratio alag hai isliye chhoti kiya)
  imageCorporate: {
    width: 100,
    height: 100,
  },
  // Scheduled ki image thodi badi (kyunki chhoti dikh rahi thi)
  imageScheduled: {
    width: 148,
    height: 138,
    left: -10,
  },

  // Label
  labelContainer: {
    paddingTop: 4,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Light',
    color: '#1A1A1A',
    textAlign: 'center',
  },
});

export default ServiceGridScreen;
