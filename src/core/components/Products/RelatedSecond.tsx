import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  NavigationProp,
} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');

// Define navigation param list
type RootStackParamList = {
  Home: undefined;
  ProductDetail: {
    id: string;
    category?: string;
  };
  CategoryProducts: {
    category: string;
  };
  // Add other screens as needed
};

type ProductDetailRouteProp = {
  key: string;
  name: 'ProductDetail';
  params: {
    category: string;
    id: string;
  };
};

interface Props {
  id?: string;
  category?: string;
  userId?: string;
}

type Product = {
  _id: string;
  title: string;
  description: string;
  category?: string;
  images?: any[];
  videos?: any[];
  originalPrice?: number;
  price?: number;
  FinalPrice?: number;
  Discount?: number;
  Offer?: number;
};

// Get Media URL function
const getMediaUrl = (item: string | { url: string }): string => {
  if (typeof item === 'string') {
    return item;
  }
  return item.url;
};

// Custom Like Component (replacing Expo-based LikeComponent)
const LikeButton: React.FC<{ productId: string; size?: string }> = ({
  productId,
  size = '22',
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // Add your like API call here
  };

  const iconSize = parseInt(size) || 22;

  return (
    <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
      <Icon
        name={isLiked ? 'favorite' : 'favorite-border'}
        size={iconSize}
        color={isLiked ? '#FF6B6B' : '#FFFFFF'}
      />
    </TouchableOpacity>
  );
};

const RelatedSecond: React.FC<Props> = ({
  userId,
  id: propId,
  category: propCategory,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const route = useRoute<ProductDetailRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Get id from route params or props
  const routeParams = route.params || {};
  const id = propId || routeParams.id;
  const category = propCategory || routeParams.category;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        if (!id) {
          console.log('No product ID provided, skipping fetch');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Slot = 2 for RelatedSecond
        const url = `http://192.168.251.121:5000/api/public/related/${id}?slot=2`;
        console.log('Fetching related products from URL:', url);
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to fetch related products:', errorText);
          throw new Error('Failed to fetch related products.');
        }

        const raw = await response.json();

        let data: Product[] = Array.isArray(raw)
          ? raw
          : raw.products
          ? raw.products
          : raw.data
          ? raw.data
          : [];

        if (!Array.isArray(data)) data = [];

        // Exclude current product
        const related = data.filter(p => p._id !== id);

        setProducts(related);
      } catch (error: any) {
        console.error('Error fetching related products:', error);
        setError(error.message || 'Failed to load related products.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [id]);

  const navigateToProduct = (product: Product) => {
    navigation.navigate('ProductDetail', {
      id: product._id,
      category: product.category || category,
    });
  };

  // Function to split products into pairs for EXACTLY 2 ROWS
  const getProductPairs = () => {
    const pairs = [];
    for (let i = 0; i < products.length; i += 2) {
      pairs.push(products.slice(i, i + 2));
    }
    return pairs;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.mainTitle}>Budget Buys!</Text>
            <Text style={styles.subTitle}>Affordable fashion for everyone</Text>
          </View>
          <View style={styles.coinPlaceholder}>
            <Image
              source={require('../../../assets/images/coin.png')}
              style={styles.coinImage}
              resizeMode="contain"
            />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.loadingContainer}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.loadingColumn}>
                <View style={styles.loadingCard}>
                  <View style={styles.loadingImage}>
                    <ActivityIndicator size="small" color="#CCCCCC" />
                  </View>
                  <View style={styles.loadingText} />
                  <View style={styles.loadingPrice} />
                </View>
                <View style={styles.loadingCard}>
                  <View style={styles.loadingImage}>
                    <ActivityIndicator size="small" color="#CCCCCC" />
                  </View>
                  <View style={styles.loadingText} />
                  <View style={styles.loadingPrice} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !products.length) {
    return null;
  }

  const productPairs = getProductPairs();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.mainTitle}>Budget Buys!</Text>
          <Text style={styles.subTitle}>Affordable fashion for everyone</Text>
        </View>
        <View style={styles.coinPlaceholder}>
          <Image
            source={require('../../../assets/images/coin.png')}
            style={styles.coinImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Products Horizontal Scroll with EXACTLY 2 ROWS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}
      >
        {productPairs.map((pair, index) => (
          <View key={index} style={styles.column}>
            {/* ROW 1 */}
            {pair[0] && (
              <ProductCard
                product={pair[0]}
                userId={userId || 'userId123'}
                onPress={() => navigateToProduct(pair[0])}
              />
            )}

            {/* ROW 2 */}
            {pair[1] && (
              <ProductCard
                product={pair[1]}
                userId={userId || 'userId123'}
                onPress={() => navigateToProduct(pair[1])}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// Product Card Component - MAXIMUM VERTICAL SIZE
interface ProductCardProps {
  product: Product;
  userId: string;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  userId,
  onPress,
}) => {
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [imageError, setImageError] = useState(false);

  const media = [
    ...(product.images || []).map(getMediaUrl),
    ...(product.videos || []).map(getMediaUrl),
  ].filter(url => url !== '');

  // Calculate final price
  useEffect(() => {
    const calculatePricing = () => {
      const finPrice = product.FinalPrice || product.price || 0;
      setFinalPrice(finPrice);
    };
    calculatePricing();
  }, [product.price, product.FinalPrice]);

  // Shorten title for display
  const getShortTitle = (title: string) => {
    return title.length > 35 ? title.substring(0, 35) + '...' : title;
  };

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image Section - MAXIMUM VERTICAL SIZE */}
      <View style={styles.imageContainer}>
        {media.length > 0 && !imageError ? (
          <Image
            source={{ uri: media[0] }}
            style={styles.productImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="image-not-supported" size={40} color="#9CA3AF" />
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* Content Overlay - BOTTOM SECTION */}
        <View style={styles.contentOverlay}>
          {/* Title - First Line */}
          <Text style={styles.productTitle} numberOfLines={1}>
            {getShortTitle(product.title)}
          </Text>

          {/* Description - Second Line */}
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description || 'Fashion Product'}
          </Text>

          {/* Price - Third Line */}
          <Text style={styles.priceText}>₹{finalPrice}</Text>
        </View>

        {/* Like Button - TOP RIGHT */}
        <View style={styles.likeButtonContainer}>
          <LikeButton productId={product._id} size={'22'} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'System',
  },
  coinPlaceholder: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  coinImage: {
    width: 80,
    height: 80,
  },
  // Loading Styles for 2 ROWS
  loadingContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  loadingColumn: {
    gap: 20,
  },
  loadingCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingImage: {
    height: 280,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  loadingPrice: {
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    width: '60%',
  },
  // Products Container
  productsContainer: {
    gap: 20,
    paddingRight: 16,
  },
  // Column container for EXACTLY 2 ROWS
  column: {
    gap: 20,
  },
  // Product Card Styles - MAXIMUM VERTICAL SIZE
  productCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'System',
  },
  // Content Overlay - BOTTOM SECTION WITH TRANSPARENT BACKGROUND
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'System',
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'System',
    marginBottom: 8,
    opacity: 0.9,
    lineHeight: 18,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  // Like Button - TOP RIGHT
  likeButtonContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  likeButton: {
    padding: 2,
  },
});

export default RelatedSecond;
