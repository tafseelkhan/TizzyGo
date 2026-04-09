import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CART_API_URL = 'http://192.168.251.121:5000';

interface CartItemParams {
  productId: string;
  productData?: any;
  quantity?: number;
}

interface AddToCartProps {
  userId?: string;
  showCartButton?: boolean;
  showQuantityOnly?: boolean;
  quantity: number;
  onAddToCart: () => void;
  isInCart: boolean;
  onUpdateQuantity: (newQuantity: number) => void;
  onRemoveFromCart: () => void;
  productId: string;
  productData: any;
  initialIsInCart?: boolean;
  initialQuantity?: number;
  productLoading?: boolean;
  productAvailable?: boolean;
  maxQuantity?: number;
  style?: any;
  isAdding: boolean;
  isLoading: boolean;
  compact?: boolean;
}

interface CartState {
  isInCart: boolean;
  quantity: number;
  isLoading: boolean;
  isAdding: boolean;
}

// Cart API functions
export const addToCart = async (params: CartItemParams): Promise<boolean> => {
  const { productId, productData, quantity = 1 } = params;

  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert('Error', 'Please login to add items to cart');
      return false;
    }

    const response = await fetch(`${CART_API_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId,
        productData,
        quantity,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add to cart');
    }

    return true;
  } catch (error: any) {
    Alert.alert('Error', 'Failed to add item to cart');
    return false;
  }
};

export const updateCartItem = async (
  params: Omit<CartItemParams, 'productData'>,
): Promise<boolean> => {
  const { productId, quantity = 1 } = params;

  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert('Error', 'Please login to update cart');
      return false;
    }

    const response = await fetch(`${CART_API_URL}/api/cart/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId,
        quantity,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update cart');
    }

    return true;
  } catch {
    Alert.alert('Error', 'Failed to update cart');
    return false;
  }
};

export const removeFromCart = async (productId: string): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert('Error', 'Please login to remove from cart');
      return false;
    }

    const response = await fetch(`${CART_API_URL}/api/cart/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove from cart');
    }

    return true;
  } catch {
    Alert.alert('Error', 'Failed to remove from cart');
    return false;
  }
};

export const fetchCart = async (
  productId: string,
): Promise<{ inCart: boolean; quantity: number } | null> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch(
      `${CART_API_URL}/api/cart/check?productId=${productId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch cart status');
    }

    const data = await response.json();
    return {
      inCart: data.inCart || false,
      quantity: data.quantity || 1,
    };
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

// Custom animation component without Lottie
const CustomAnimation: React.FC<{
  type: 'success' | 'failed';
  onFinish: () => void;
}> = ({ type, onFinish }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.delay(800),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const getIcon = () => {
    if (type === 'success') {
      return '✓';
    }
    return '✗';
  };

  const getColor = () => {
    if (type === 'success') {
      return '#4CAF50';
    }
    return '#F44336';
  };

  return (
    <Animated.View
      style={[
        styles.animationContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.animationCircle, { backgroundColor: getColor() }]}>
        <Text style={styles.animationIcon}>{getIcon()}</Text>
      </View>
    </Animated.View>
  );
};

const AddToCart: React.FC<AddToCartProps> = ({
  productId,
  productData,
  initialIsInCart = false,
  initialQuantity = 1,
  productLoading = false,
  productAvailable = true,
  maxQuantity = 10,
  style = {},
  compact = false,
}) => {
  const [cartState, setCartState] = useState<CartState>({
    isInCart: initialIsInCart,
    quantity: initialQuantity,
    isLoading: false,
    isAdding: false,
  });

  const [showAnim, setShowAnim] = useState<'success' | 'failed' | null>(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  // Animation references
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpenRef = useRef(false);
  const animationFinishedRef = useRef(false);

  useEffect(() => {
    const checkCartStatus = async () => {
      try {
        const cartStatus = await fetchCart(productId);
        if (cartStatus) {
          setCartState(prev => ({
            ...prev,
            isInCart: cartStatus.inCart,
            quantity: cartStatus.quantity,
          }));
        }
      } catch (error) {
        console.error('Error checking cart status:', error);
      }
    };

    checkCartStatus();
  }, [productId]);

  const showQuantityController = () => {
    if (modalOpenRef.current) return;

    modalOpenRef.current = true;
    setShowQuantityModal(true);

    // Reset animations
    slideAnim.setValue(0);
    scaleAnim.setValue(0);

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
      ]).start();
    }, 50);
  };

  const hideQuantityController = () => {
    if (!modalOpenRef.current) return;

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start(() => {
      setShowQuantityModal(false);
      modalOpenRef.current = false;
    });
  };

  const slideUpAnimation = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0],
        }),
      },
    ],
  };

  const scaleAnimation = {
    transform: [
      {
        scale: scaleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxQuantity) return;

    setCartState(prev => ({ ...prev, isLoading: true }));

    const success = await updateCartItem({
      productId,
      quantity: newQuantity,
    });

    if (success) {
      setCartState(prev => ({
        ...prev,
        quantity: newQuantity,
        isLoading: false,
      }));
      setShowAnim('success');
    } else {
      setCartState(prev => ({ ...prev, isLoading: false }));
      setShowAnim('failed');
    }
  };

  const handleAnimationFinish = () => {
    animationFinishedRef.current = true;

    // Success animation ke baad automatically modal open karo
    if (showAnim === 'success' && cartState.isInCart && !modalOpenRef.current) {
      setTimeout(() => {
        showQuantityController();
      }, 300);
    }

    setShowAnim(null);
  };

  const handleAddToCart = async () => {
    if (!productAvailable) {
      setShowAnim('failed');
      return;
    }

    setCartState(prev => ({ ...prev, isAdding: true }));
    animationFinishedRef.current = false;

    try {
      const timeout = new Promise<boolean>(resolve =>
        setTimeout(() => resolve(false), 5000),
      );

      const success = await Promise.race([
        addToCart({
          productId,
          productData,
          quantity: 1,
        }),
        timeout,
      ]);

      if (success) {
        setCartState({
          isInCart: true,
          quantity: 1,
          isLoading: false,
          isAdding: false,
        });
        setShowAnim('success');

        // Animation finish hone ka wait karo, modal automatically open ho jayega
        // handleAnimationFinish function mein handle ho raha hai
      } else {
        setCartState(prev => ({ ...prev, isAdding: false }));
        setShowAnim('failed');
      }
    } catch {
      setCartState(prev => ({ ...prev, isAdding: false }));
      setShowAnim('failed');
    }
  };

  const handleRemoveFromCart = async () => {
    setCartState(prev => ({ ...prev, isLoading: true }));

    const success = await removeFromCart(productId);
    if (success) {
      setCartState({
        isInCart: false,
        quantity: 1,
        isLoading: false,
        isAdding: false,
      });
      setShowAnim('success');
      hideQuantityController();
    } else {
      setCartState(prev => ({ ...prev, isLoading: false }));
      setShowAnim('failed');
    }
  };

  // Compact version for product cards
  if (compact) {
    if (!cartState.isInCart) {
      return (
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={cartState.isAdding || productLoading || !productAvailable}
          style={[
            styles.compactAddButton,
            (!productAvailable || cartState.isAdding || productLoading) &&
              styles.disabledButton,
          ]}
        >
          {cartState.isAdding ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.compactButtonText}>
              {!productAvailable ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          onPress={showQuantityController}
          style={styles.compactQuantityButton}
        >
          <Text style={styles.compactQuantityText}>{cartState.quantity}</Text>
          <Text style={styles.arrowIcon}>▼</Text>
        </TouchableOpacity>

        <Modal
          visible={showQuantityModal}
          transparent={true}
          animationType="fade"
          onRequestClose={hideQuantityController}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={hideQuantityController}
          >
            <Animated.View style={[styles.modalContent, slideUpAnimation]}>
              <Animated.View
                style={[styles.modalQuantityContainer, scaleAnimation]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Quantity</Text>
                  <TouchableOpacity onPress={hideQuantityController}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalControls}>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(cartState.quantity - 1)}
                    disabled={cartState.isLoading || cartState.quantity <= 1}
                    style={[
                      styles.modalQuantityButton,
                      (cartState.quantity <= 1 || cartState.isLoading) &&
                        styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.modalButtonText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.modalQuantityDisplay}>
                    {cartState.isLoading ? (
                      <ActivityIndicator size="small" color="#4B5563" />
                    ) : (
                      <Text style={styles.modalQuantityText}>
                        {cartState.quantity}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleQuantityChange(cartState.quantity + 1)}
                    disabled={
                      cartState.isLoading || cartState.quantity >= maxQuantity
                    }
                    style={[
                      styles.modalQuantityButton,
                      (cartState.quantity >= maxQuantity ||
                        cartState.isLoading) &&
                        styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.modalButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleRemoveFromCart}
                  disabled={cartState.isLoading}
                  style={[
                    styles.modalRemoveButton,
                    cartState.isLoading && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.modalRemoveText}>Remove from Cart</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // Full version (original code)
  return (
    <View style={[styles.container, style]}>
      <Modal
        visible={showAnim !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAnim(null)}
      >
        <View style={styles.modalOverlay}>
          <CustomAnimation
            type={showAnim === 'success' ? 'success' : 'failed'}
            onFinish={handleAnimationFinish}
          />
        </View>
      </Modal>

      {!cartState.isInCart ? (
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={cartState.isAdding || productLoading || !productAvailable}
          style={[
            styles.addButton,
            (!productAvailable || cartState.isAdding || productLoading) &&
              styles.disabledButton,
          ]}
        >
          {cartState.isAdding ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>
                {!productAvailable ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.fullContainer}>
          <TouchableOpacity
            onPress={showQuantityController}
            style={styles.showControlsButton}
          >
            <Text style={styles.showControlsText}>
              Qty: {cartState.quantity}
            </Text>
            <Text style={styles.arrowIcon}>▼</Text>
          </TouchableOpacity>

          <Modal
            visible={showQuantityModal}
            transparent={true}
            animationType="fade"
            onRequestClose={hideQuantityController}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={hideQuantityController}
            >
              <Animated.View style={[styles.modalContent, slideUpAnimation]}>
                <Animated.View
                  style={[styles.modalQuantityContainer, scaleAnimation]}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Update Quantity</Text>
                    <TouchableOpacity onPress={hideQuantityController}>
                      <Text style={styles.closeIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalControls}>
                    <TouchableOpacity
                      onPress={() =>
                        handleQuantityChange(cartState.quantity - 1)
                      }
                      disabled={cartState.isLoading || cartState.quantity <= 1}
                      style={[
                        styles.modalQuantityButton,
                        (cartState.quantity <= 1 || cartState.isLoading) &&
                          styles.disabledButton,
                      ]}
                    >
                      <Text style={styles.modalButtonText}>−</Text>
                    </TouchableOpacity>

                    <View style={styles.modalQuantityDisplay}>
                      {cartState.isLoading ? (
                        <ActivityIndicator size="small" color="#4B5563" />
                      ) : (
                        <Text style={styles.modalQuantityText}>
                          {cartState.quantity}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        handleQuantityChange(cartState.quantity + 1)
                      }
                      disabled={
                        cartState.isLoading || cartState.quantity >= maxQuantity
                      }
                      style={[
                        styles.modalQuantityButton,
                        (cartState.quantity >= maxQuantity ||
                          cartState.isLoading) &&
                          styles.disabledButton,
                      ]}
                    >
                      <Text style={styles.modalButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleRemoveFromCart}
                    disabled={cartState.isLoading}
                    style={[
                      styles.modalRemoveButton,
                      cartState.isLoading && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.modalRemoveText}>Remove from Cart</Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  fullContainer: {
    width: '100%',
  },
  compactContainer: {
    position: 'relative',
  },
  // Compact styles
  compactAddButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  compactButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  compactQuantityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 28,
    minWidth: 60,
    justifyContent: 'space-between',
  },
  compactQuantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  closeIcon: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  // Original full styles
  addButton: {
    width: '100%',
    backgroundColor: '#ffd000ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  showControlsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  showControlsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalQuantityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    marginBottom: 16,
  },
  modalQuantityButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalQuantityDisplay: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalQuantityText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  modalRemoveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  disabledButton: {
    opacity: 0.5,
  },
  animationContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  animationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationIcon: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default AddToCart;
