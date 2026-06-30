import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  NavigationProp,
} from '@react-navigation/native';
import LikeComponent from '../global/LikeGlobal';
import AddToCart from './AddToCart';

const { width: screenWidth } = Dimensions.get('window');

// Define navigation param list
type RootStackParamList = {
  ProductDetail: {
    id: string;
    category?: string;
  };
  // Add other routes as needed
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
  id: string;
  category?: string;
  userId?: string;
}

interface Product {
  _id: string;
  id?: string;
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
  brand?: string;
  rating?: number;
  model?: string;
  averageRating?: number;
  reviewCount?: number;
  stock?: number;
}

// Get Media URL function
const getMediaUrl = (item: string | { url: string }): string => {
  if (typeof item === 'string') {
    return item;
  }
  return item.url;
};

const RelatedThird: React.FC<Props> = ({ userId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const route = useRoute<ProductDetailRouteProp>();
  const { id, category } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        if (!id) throw new Error('Product ID is missing.');

        setLoading(true);
        setError(null);

        // Slot = 3 for RelatedThird
        const url = `http://192.168.250.121:5000/api/public/related/${id}?slot=3`;
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
        setError(error.message || 'Failed to load related products.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRelated();
    }
  }, [id]);

  const navigateToProduct = (product: Product) => {
    navigation.navigate('ProductDetail', {
      id: product._id,
      category: product.category || category,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Similar Products</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.loadingContainer}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.loadingCard}>
                <View style={styles.loadingImage} />
                <View style={styles.loadingContent}>
                  <View style={styles.loadingRating} />
                  <View style={styles.loadingBrand} />
                  <View style={styles.loadingTitle} />
                  <View style={styles.loadingPrice} />
                </View>
                <View style={styles.loadingButton} />
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

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Similar Products</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}
      >
        {products.map((product, index) => (
          <SimilarProductCard
            key={product._id || index.toString()}
            product={product}
            onPress={() => navigateToProduct(product)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// Similar Product Card Component - EXACT DESIGN LIKE IMAGE
interface SimilarProductCardProps {
  product: Product;
  onPress: () => void;
}

const SimilarProductCard: React.FC<SimilarProductCardProps> = ({
  product,
  onPress,
}) => {
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [imageError, setImageError] = useState(false);

  const media = [
    ...(product.images || []).map(getMediaUrl),
    ...(product.videos || []).map(getMediaUrl),
  ].filter(url => url !== '');

  // Calculate pricing
  useEffect(() => {
    const calculatePricing = () => {
      const origPrice = product.originalPrice || product.price || 0;
      setOriginalPrice(origPrice);

      const finPrice = product.FinalPrice || product.price || 0;
      setFinalPrice(finPrice);

      if (product.Discount) {
        setDiscount(product.Discount);
      } else if (origPrice > finPrice && origPrice > 0) {
        const discountPercent = Math.round(
          ((origPrice - finPrice) / origPrice) * 100,
        );
        setDiscount(discountPercent);
      } else {
        setDiscount(0);
      }
    };
    calculatePricing();
  }, [
    product.price,
    product.FinalPrice,
    product.originalPrice,
    product.Discount,
  ]);

  // Shorten title for display
  const getShortTitle = (title: string) => {
    return title.length > 25 ? title.substring(0, 25) + '...' : title;
  };

  const getShortBrand = (brand: string) => {
    return brand && brand.length > 15 ? brand.substring(0, 15) + '...' : brand;
  };

  return (
    <View style={styles.productCard}>
      {/* Image Section */}
      <TouchableOpacity onPress={onPress}>
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
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {/* Rating Badge - TOP LEFT */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>
              ★ {product.rating?.toFixed(1) || '4.2'}
            </Text>
          </View>

          {/* Like Button - TOP RIGHT */}
          <View style={styles.likeButtonContainer}>
            <LikeComponent productId={product._id} size={'18'} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Product Info Section */}
      <View style={styles.productInfo}>
        {/* Brand Name */}
        <Text style={styles.brandText}>
          {getShortBrand(product.brand || 'Brand')}
        </Text>

        {/* Product Title */}
        <Text style={styles.productTitle} numberOfLines={2}>
          {getShortTitle(product.title)}
        </Text>

        {/* Price Section */}
        <View style={styles.priceContainer}>
          {discount > 0 ? (
            <>
              <Text style={styles.finalPrice}>₹{finalPrice}</Text>
              <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </>
          ) : (
            <Text style={styles.finalPrice}>₹{finalPrice}</Text>
          )}
        </View>

        {/* Add to Cart Component - Only pass required props */}
        <AddToCart
          productId={product._id}
          productData={product}
          productLoading={false}
          productAvailable={!!product}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    fontFamily: 'System',
  },
  // Products Container
  productsContainer: {
    gap: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  loadingCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  loadingImage: {
    height: 140,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  loadingContent: {
    gap: 6,
  },
  loadingRating: {
    height: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '30%',
  },
  loadingBrand: {
    height: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '50%',
  },
  loadingTitle: {
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '80%',
  },
  loadingPrice: {
    height: 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    width: '60%',
  },
  loadingButton: {
    height: 36,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  // Product Card Styles
  productCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  // Rating Badge
  ratingContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
  },
  // Like Button
  likeButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    padding: 4,
  },
  // Product Info Section
  productInfo: {
    padding: 12,
    gap: 6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'System',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
    lineHeight: 18,
    height: 36,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  finalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'System',
  },
  originalPrice: {
    fontSize: 12,
    color: '#666666',
    textDecorationLine: 'line-through',
    fontFamily: 'System',
  },
  discountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF3B30',
    fontFamily: 'System',
  },
});

export default RelatedThird;
