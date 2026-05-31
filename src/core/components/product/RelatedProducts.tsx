import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  NavigationProp,
} from '@react-navigation/native';
import LikeComponent from '../global/LikeGlobal';

const { width: screenWidth } = Dimensions.get('window');

// Define navigation param list
type RootStackParamList = {
  ProductDetail: {
    id: string;
    category?: string;
  };
  // Add other routes as needed
};

// Custom Icon Components - replacing lucide-react-native
const Star = ({ size, color, fill, style }: any) => {
  return (
    <Text
      style={[
        style,
        { fontSize: size, color: fill === '#FFD700' ? '#FFD700' : color },
      ]}
    >
      {fill === '#FFD700' ? '★' : '☆'}
    </Text>
  );
};

const ChevronRight = ({ size, color, style }: any) => {
  return <Text style={[style, { fontSize: size, color }]}>›</Text>;
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
  averageRating?: number;
  reviewCount?: number;
};

// Get Media URL function
const getMediaUrl = (item: string | { url: string }): string => {
  if (typeof item === 'string') {
    return item;
  }
  return item.url;
};

const RelatedProducts: React.FC<Props> = ({ userId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [showAll, setShowAll] = useState(false);
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

        // Slot = 1
        const url = `http://172.20.10.12:5000/api/public/related/${id}?slot=1`;
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

        // Show 4 initially
        setDisplayedProducts(related.slice(0, 4));
      } catch (error: any) {
        setError(error.message || 'Failed to load related products.');
        setProducts([]);
        setDisplayedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRelated();
    }
  }, [id]);

  const handleViewMore = () => {
    if (showAll) {
      // Show less - only 4 products
      setDisplayedProducts(products.slice(0, 4));
      setShowAll(false);
    } else {
      // Show ALL products (not just 8)
      setDisplayedProducts(products);
      setShowAll(true);
    }
  };

  const navigateToProduct = (product: Product) => {
    navigation.navigate('ProductDetail', {
      id: product._id,
      category: product.category || category,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Related Products</Text>
        <View style={styles.loadingGrid}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={styles.loadingCard}>
              <View style={styles.loadingImage} />
              <View style={styles.loadingText} />
              <View style={styles.loadingPrice} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error || !products.length) {
    return null;
  }

  // Render product item for FlatList
  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      userId={userId || 'userId123'}
      onPress={() => navigateToProduct(item)}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Related Products</Text>

      <FlatList
        scrollEnabled={false}
        data={displayedProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.productsContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* View More Products Button - Show only if there are more than 4 products */}
      {products.length > 4 && (
        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={handleViewMore}
        >
          <Text style={styles.viewMoreText}>
            {showAll
              ? 'View Less Products'
              : `View More Products (${products.length - 4} more)`}
          </Text>
          <ChevronRight
            size={18}
            color="#3B82F6"
            style={[styles.chevron, showAll && styles.chevronUp]}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Product Card Component - EXACT IMAGE DESIGN
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
  const [discount, setDiscount] = useState<number | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [imageError, setImageError] = useState(false);

  const media = [
    ...(product.images || []).map(getMediaUrl),
    ...(product.videos || []).map(getMediaUrl),
  ].filter(url => url !== '');

  // Calculate pricing - EXACTLY LIKE IMAGE
  useEffect(() => {
    const calculatePricing = () => {
      const origPrice = product.originalPrice || product.price || 0;
      setOriginalPrice(origPrice);

      const finPrice = product.FinalPrice || product.price || origPrice;
      setFinalPrice(finPrice);

      if (product.Discount) {
        setDiscount(product.Discount);
      } else if (origPrice > finPrice && origPrice > 0) {
        const discountPercent = Math.round(
          ((origPrice - finPrice) / origPrice) * 100,
        );
        setDiscount(discountPercent);
      } else {
        setDiscount(null);
      }
    };

    calculatePricing();
  }, [
    product.price,
    product.originalPrice,
    product.Discount,
    product.FinalPrice,
  ]);

  const averageRating = product.averageRating || 0;

  // Render stars manually
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={12} color="#FFD700" fill="#FFD700" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} size={12} color="#FFD700" fill="transparent" />,
        );
      } else {
        stars.push(
          <Star key={i} size={12} color="#E5E7EB" fill="transparent" />,
        );
      }
    }
    return stars;
  };

  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
      {/* Image Section */}
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

        {/* Discount Badge - EXACTLY LIKE IMAGE */}
        {discount !== null && discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}

        {/* Like Button - Top Right */}
        <View style={styles.likeButtonContainer}>
          <LikeComponent productId={product._id} size={'18'} />
        </View>
      </View>

      {/* Content Section - EXACT IMAGE LAYOUT */}
      <View style={styles.contentContainer}>
        {/* Brand Name - First Line (Bold) */}
        <Text style={styles.brandName} numberOfLines={1}>
          {product.title}
        </Text>

        {/* Product Description - Second Line */}
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description || 'Product description'}
        </Text>

        {/* Pricing Section - Third Line EXACTLY LIKE IMAGE */}
        <View style={styles.pricingContainer}>
          <Text style={styles.finalPrice}>₹{finalPrice}</Text>
          {originalPrice > finalPrice && discount !== null && discount > 0 ? (
            <View style={styles.originalPriceContainer}>
              <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              <Text style={styles.discountPercentage}> ({discount}% OFF)</Text>
            </View>
          ) : null}
        </View>

        {/* Rating Section - Bottom Line */}
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>{renderStars()}</View>
          <Text style={styles.ratingCount}>({product.reviewCount || 0})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'System',
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  loadingCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    gap: 8,
  },
  loadingImage: {
    height: 160,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  loadingText: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  loadingPrice: {
    height: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 7,
    width: '60%',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productsContainer: {
    paddingBottom: 8,
  },

  // View More Button Styles
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: 'System',
    marginRight: 8,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },

  // Product Card Styles - EXACT IMAGE DESIGN
  productCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 12,
  },

  // Discount Badge - EXACTLY LIKE IMAGE
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Like Button
  likeButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    padding: 4,
  },

  // Content Section - EXACT IMAGE LAYOUT
  contentContainer: {
    paddingHorizontal: 4,
    gap: 6,
  },

  // Brand Name - First Line (Bold) - EXACTLY LIKE IMAGE
  brandName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'System',
  },

  // Product Description - Second Line
  productDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
    fontFamily: 'System',
    height: 32,
  },

  // Pricing Section - EXACTLY LIKE IMAGE
  pricingContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  finalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'System',
  },
  originalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
    fontFamily: 'System',
  },
  discountPercentage: {
    fontSize: 12,
    color: '#FF0000',
    fontWeight: '600',
    fontFamily: 'System',
  },

  // Rating Section - Bottom Line
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingCount: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'System',
  },
});

export default RelatedProducts;
