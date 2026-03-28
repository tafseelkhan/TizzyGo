import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  View,
  ScrollView,
  Image,
  Dimensions,
  Vibration,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  useSafeAreaInsets,
  SafeAreaView,
} from 'react-native-safe-area-context';
// ✅ REPLACED: Using react-native-vector-icons instead of @expo/vector-icons
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SwipeButton from 'rn-swipe-button';

// Theme Context Import
import { useTheme } from '../../contexts/theme/ThemeContext';

// Import types
import {
  ProductVariant,
  SelectedVariant,
  fetchProductVariants,
} from './AddToCart';

// ✅ Helper functions for media
const isVideoUrl = (url?: string) => {
  if (!url) return false;

  if (url.includes('firebasestorage.googleapis.com/v0/b/')) {
    const videoExtensions = [
      '.mp4',
      '.mov',
      '.webm',
      '.mkv',
      '.avi',
      '.wmv',
      '.flv',
      '.m4v',
    ];
    const hasVideoExtension = videoExtensions.some(ext =>
      url.toLowerCase().includes(ext),
    );

    const hasVideoInPath =
      url.toLowerCase().includes('/video/') ||
      url.toLowerCase().includes('video=true') ||
      url.toLowerCase().includes('media_type=video');

    return hasVideoExtension || hasVideoInPath;
  }

  return /\.(mp4|mov|webm|mkv|avi|wmv|flv|m4v)$/i.test(url);
};

const normalizeMedia = (images: string[] = [], video?: string) => {
  const media: { type: 'image' | 'video'; url: string }[] = [];

  images.forEach(img => {
    if (img && img.trim() !== '') {
      media.push({ type: 'image', url: img });
    }
  });

  if (video && video.trim() !== '') {
    media.unshift({ type: 'video', url: video });
  }

  return media;
};

// ✅ Async Storage Keys
const VARIANT_STORAGE_KEY = 'buynow_selected_variant_';
const BUYNOW_CART_ITEM_KEY = 'buynow_cart_item_';

// ✅ Interface
interface BuyNowProps {
  product?: {
    _id?: string;
    id?: string;
    [key: string]: any;
  } | null;
  productLoading?: boolean;
  productAvailable?: boolean;
  variants?: ProductVariant[];
  selectedVariant?: SelectedVariant | null;
  onVariantSelect?: (variant: SelectedVariant | null) => void;
}

// Local theme colors function
const getLocalThemeColors = (isDark: boolean) => {
  return {
    // Primary colors - theme based
    primary: isDark ? '#0ea5e9' : '#10B981',
    secondary: isDark ? '#7C3AED' : '#485696',
    accent: isDark ? '#F59E0B' : '#FFD166',
    success: isDark ? '#10B981' : '#06D6A0',
    danger: isDark ? '#EF4444' : '#EF476F',
    dark: isDark ? '#F1F5F9' : '#1A1A2E',
    light: isDark ? '#1E293B' : '#F8F9FA',
    gray: isDark ? '#94A3B8' : '#6C757D',
    white: isDark ? '#0F172A' : '#FFFFFF',
    black: isDark ? '#F1F5F9' : '#000000',
    railFill: isDark ? '#0ea5e9' : '#10B981',
    thumbIcon: isDark ? '#0F172A' : '#FFFFFF',
    railBackground: isDark ? '#334155' : '#E9ECEF',
    cardHover: isDark ? '#1E293B' : '#F0FFF4',

    // Additional theme colors
    modalBg: isDark ? '#1E293B' : '#FFFFFF',
    modalBorder: isDark ? '#334155' : '#f3f4f6',
    textPrimary: isDark ? '#F1F5F9' : '#1A1A2E',
    textSecondary: isDark ? '#CBD5E1' : '#485696',
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    borderColor: isDark ? '#334155' : '#E5E7EB',
    shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',

    // Status colors
    infoBg: isDark ? '#1E293B' : '#F0FFF4',
    infoBorder: isDark ? '#334155' : '#D1FAE5',
    videoBg: isDark ? '#1E293B' : '#E6F7F1',
    badgeBg: isDark ? '#3B82F6' : '#10B981',

    // Button states
    enabledButtonBg: isDark ? '#0ea5e9' : '#10B981',
    disabledButtonBg: isDark ? '#475569' : '#9CA3AF',
  };
};

// ✅ Thumb Icon Component - Theme aware
const ThumbIconComponent = ({ isDark = false }) => (
  <View
    style={[
      styles.thumbIconContent,
      {
        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
        borderColor: isDark ? '#0ea5e9' : '#10B981',
      },
    ]}
  >
    <Icon
      name="arrow-forward"
      size={16}
      color={isDark ? '#0ea5e9' : '#10B981'}
    />
  </View>
);

// ✅ Function to fetch saved BuyNow cart item from server
const fetchSavedBuyNowCartItem = async (productId: string, token: string) => {
  try {
    const response = await fetch(
      `http://172.20.10.12:5000/api/cart/buynow-item?productId=${encodeURIComponent(
        productId,
      )}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      return null;
    }

    if (data.success && data.cartItem && data.cartItem.selectedVariant) {
      const selectedVariant = { ...data.cartItem.selectedVariant };
      if (!selectedVariant.variantId && selectedVariant._id) {
        selectedVariant.variantId = selectedVariant._id;
      }

      return {
        cartItem: data.cartItem,
        selectedVariant: selectedVariant,
        hasSavedItem: true,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
};

// ✅ Function to clear saved BuyNow cart item
const clearSavedBuyNowCart = async (productId: string) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return false;

    const response = await fetch(
      'http://172.20.10.12:5000/api/cart/clear-buynow',
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return false;
    }

    // Clear local storage
    const storageKey = `${VARIANT_STORAGE_KEY}${productId}`;
    await AsyncStorage.removeItem(storageKey);

    const cartItemKey = `${BUYNOW_CART_ITEM_KEY}${productId}`;
    await AsyncStorage.removeItem(cartItemKey);

    return true;
  } catch (error) {
    return false;
  }
};

const BuyNow: React.FC<BuyNowProps> = ({
  product,
  productLoading = false,
  productAvailable = true,
  variants: propVariants = [],
  selectedVariant: propSelectedVariant = null,
  onVariantSelect = () => {},
}) => {
  // Theme Context
  const { isDark } = useTheme();
  const themeColors = getLocalThemeColors(isDark);

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] =
    useState<SelectedVariant | null>(propSelectedVariant);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<
    number | null
  >(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>(propVariants);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const [hasSavedCartItem, setHasSavedCartItem] = useState(false);
  const [checkingSavedItem, setCheckingSavedItem] = useState(false);
  const [isModalInitialized, setIsModalInitialized] = useState(false);
  const [shouldShowSavedAlert, setShouldShowSavedAlert] = useState(false);
  const swipeButtonRef = useRef<any>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const hasCheckedRef = useRef(false);
  const modalOpenedRef = useRef(false);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const productId = product?._id || product?.id;

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Function to find variant by ID
  const findVariantIndexById = useCallback(
    (variantId: string): number => {
      if (!variants.length || !variantId) return -1;

      // Try to find by variantId
      let index = variants.findIndex(v => v._id === variantId);

      return index;
    },
    [variants],
  );

  // ✅ Default phone vibration
  const triggerVibration = useCallback(() => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 30, 0, 30]);
    } else {
      Vibration.vibrate(300);
    }
  }, []);

  // ✅ Load saved variant from server (only once)
  const loadSavedVariantFromServer = useCallback(async () => {
    if (!productId || !isMountedRef.current || hasCheckedRef.current)
      return false;

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return false;
      }

      setCheckingSavedItem(true);

      const savedItem = await fetchSavedBuyNowCartItem(productId, token);

      if (!isMountedRef.current) return false;

      if (savedItem && savedItem.selectedVariant) {
        // Find matching variant index
        let variantIndex = -1;
        let variantIdToUse =
          savedItem.selectedVariant.variantId || savedItem.selectedVariant._id;

        if (variants.length > 0 && variantIdToUse) {
          variantIndex = findVariantIndexById(variantIdToUse);
        }

        // Update state
        if (isMountedRef.current) {
          setSelectedVariant(savedItem.selectedVariant);
          onVariantSelect(savedItem.selectedVariant);
          setHasSavedCartItem(true);

          if (variantIndex !== -1) {
            setSelectedVariantIndex(variantIndex);
          }
        }

        // Save to local storage
        const storageKey = `${VARIANT_STORAGE_KEY}${productId}`;
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(savedItem.selectedVariant),
        );

        const cartItemKey = `${BUYNOW_CART_ITEM_KEY}${productId}`;
        await AsyncStorage.setItem(
          cartItemKey,
          JSON.stringify(savedItem.cartItem),
        );

        // Set flag to show saved alert
        setShouldShowSavedAlert(true);
        hasCheckedRef.current = true;

        return true;
      } else {
        if (isMountedRef.current) {
          setHasSavedCartItem(false);
        }

        // Check local storage as fallback
        const storageKey = `${VARIANT_STORAGE_KEY}${productId}`;
        const savedVariantData = await AsyncStorage.getItem(storageKey);

        if (savedVariantData) {
          const savedVariant = JSON.parse(savedVariantData);

          let variantIndex = -1;
          let variantIdToUse = savedVariant.variantId || savedVariant._id;

          if (variants.length > 0 && variantIdToUse) {
            variantIndex = findVariantIndexById(variantIdToUse);
          }

          if (isMountedRef.current) {
            if (variantIndex !== -1) {
              setSelectedVariantIndex(variantIndex);
              setSelectedVariant(savedVariant);
              onVariantSelect(savedVariant);
              setHasSavedCartItem(true);
              setShouldShowSavedAlert(true);
            } else if (savedVariant) {
              setSelectedVariant(savedVariant);
              onVariantSelect(savedVariant);
              setHasSavedCartItem(true);
              setShouldShowSavedAlert(true);
            }
          }
        }

        hasCheckedRef.current = true;
      }
    } catch (error) {
      console.error('Error loading saved variant:', error);
    } finally {
      if (isMountedRef.current) {
        setCheckingSavedItem(false);
      }
    }

    return false;
  }, [productId, variants, onVariantSelect, findVariantIndexById]);

  // ✅ Load saved variant when component mounts (only once)
  useEffect(() => {
    if (productId && isMountedRef.current) {
      // Clear previous check flag
      hasCheckedRef.current = false;

      // Load with delay to ensure variants are loaded first
      checkTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          loadSavedVariantFromServer();
        }
      }, 800);
    }

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [productId, loadSavedVariantFromServer]);

  // ✅ Check for saved item when Buy Now button is clicked (before showing modal)
  const checkAndShowAlert = useCallback(async () => {
    if (!productId || !shouldShowSavedAlert) return false;

    // Reset flag after checking
    setShouldShowSavedAlert(false);

    return hasSavedCartItem && selectedVariant;
  }, [productId, shouldShowSavedAlert, hasSavedCartItem, selectedVariant]);

  // ✅ Load variants
  useEffect(() => {
    const loadVariants = async () => {
      if (propVariants.length === 0 && product?.id) {
        setVariantsLoading(true);
        try {
          const fetchedVariants = await fetchProductVariants(product.id);
          if (isMountedRef.current) {
            setVariants(fetchedVariants);
          }
        } catch (error) {
          console.error('Error loading variants:', error);
        } finally {
          if (isMountedRef.current) {
            setVariantsLoading(false);
          }
        }
      } else if (propVariants.length > 0) {
        // Only set variants if they're different
        if (
          isMountedRef.current &&
          JSON.stringify(variants) !== JSON.stringify(propVariants)
        ) {
          setVariants(propVariants);
        }
      }
    };

    loadVariants();
  }, [product?.id, propVariants]);

  // ✅ Handle variant selection with vibration and storage
  const handleVariantSelect = useCallback(
    (variantIndex: number) => {
      triggerVibration();

      const selectedVariantObj = variants[variantIndex];
      if (!selectedVariantObj) return;

      const newVariant: SelectedVariant = {
        variantId: selectedVariantObj._id,
      };

      if (selectedVariantObj.fields) {
        selectedVariantObj.fields.forEach(field => {
          newVariant[field.name] = field.value;
          if (field.image) newVariant.variantImage = field.image;
          if (field.sku) newVariant.variantSku = field.sku;
        });
      }

      if (selectedVariantObj.images && selectedVariantObj.images.length > 0) {
        newVariant.variantImages = selectedVariantObj.images;
      }

      if (selectedVariantObj.video) {
        newVariant.variantVideo = selectedVariantObj.video;
      }

      if (isMountedRef.current) {
        setSelectedVariantIndex(variantIndex);
        setSelectedVariant(newVariant);
        onVariantSelect(newVariant);
      }

      // Save to local storage
      if (productId) {
        const storageKey = `${VARIANT_STORAGE_KEY}${productId}`;
        AsyncStorage.setItem(storageKey, JSON.stringify(newVariant));
      }
    },
    [variants, productId, onVariantSelect, triggerVibration],
  );

  // ✅ Check if a variant is selected
  const isVariantSelected = useCallback(() => {
    return (
      (selectedVariantIndex !== null || selectedVariant !== null) &&
      selectedVariant !== null
    );
  }, [selectedVariantIndex, selectedVariant]);

  // ✅ Check if product has variants
  const hasVariants = useCallback(() => {
    return variants && variants.length > 0;
  }, [variants]);

  // ✅ Handle proceeding with saved variant
  const handleProceedWithSavedVariant = useCallback(async () => {
    if (!product || !productId || !selectedVariant) return;

    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const requestBody: any = {
        productData: product,
      };

      if (selectedVariant && Object.keys(selectedVariant).length > 0) {
        requestBody.selectedVariant = selectedVariant;
      }

      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch('http://172.20.10.12:5000/api/cart/buy-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.error || 'Something went wrong!');
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      navigation.getParent()?.navigate('BuyNowNavigator', {
        screen: 'BuyNow',
        params: {
          productId: productId,
          selectedVariant,
          isFromSaved: true,
        },
      });
    } catch (err: any) {
      console.error('BuyNow error:', err);
      Alert.alert('Error', 'Failed to process buy now!');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [product, productId, selectedVariant, navigation]);

  // ✅ Direct Buy Now function
  const handleBuyNowClickDirect = useCallback(async () => {
    const productId = product?._id || product?.id;

    if (!product || !productId) {
      Alert.alert('Error', 'Product data missing!');
      return;
    }

    if (!productAvailable) {
      Alert.alert('Error', 'Product not available!');
      return;
    }

    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert('Error', 'Please login first!');
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const requestBody: any = {
        productData: product,
      };

      if (selectedVariant && Object.keys(selectedVariant).length > 0) {
        requestBody.selectedVariant = selectedVariant;
      }

      const res = await fetch('http://172.20.10.12:5000/api/cart/buy-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.error || 'Something went wrong!');
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      navigation.getParent()?.navigate('BuyNowNavigator', {
        screen: 'BuyNow',
        params: {
          productId: productId,
          selectedVariant,
        },
      });
    } catch (err: any) {
      console.error('BuyNow error:', err);
      Alert.alert('Error', 'Failed to process buy now!');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [product, productAvailable, selectedVariant, navigation]);

  // ✅ Handle "Choose New" option - Clear everything and show fresh modal
  const handleChooseNewVariant = useCallback(async () => {
    if (productId) {
      await clearSavedBuyNowCart(productId);
    }

    if (isMountedRef.current) {
      setHasSavedCartItem(false);
      setSelectedVariant(null);
      setSelectedVariantIndex(null);
      onVariantSelect(null);
      setIsModalInitialized(false);
      modalOpenedRef.current = false;

      // Reset the check flag so we can check again if needed
      hasCheckedRef.current = false;

      // Show modal with fresh state
      setShowVariantModal(true);
    }
  }, [productId, onVariantSelect]);

  // ✅ Main Buy Now click handler
  const handleBuyNowClick = useCallback(async () => {
    if (!product || !product?._id) {
      Alert.alert('Error', 'Product data missing!');
      return;
    }

    if (!productAvailable) {
      Alert.alert('Error', 'Product not available!');
      return;
    }

    // Check if we should show saved alert
    const hasSaved = await checkAndShowAlert();

    if (hasSaved) {
      Alert.alert(
        'Saved Selection Found',
        'You have a previously selected variant. Do you want to:',
        [
          {
            text: 'Use Saved',
            onPress: () => {
              handleProceedWithSavedVariant();
            },
            style: 'default',
          },
          {
            text: 'Choose New',
            onPress: () => {
              handleChooseNewVariant();
            },
            style: 'destructive',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
      return;
    }

    // No saved item or alert already shown, proceed normally
    if (hasVariants()) {
      setShowVariantModal(true);
      return;
    }

    handleBuyNowClickDirect();
  }, [
    product,
    productAvailable,
    checkAndShowAlert,
    hasVariants,
    handleProceedWithSavedVariant,
    handleChooseNewVariant,
    handleBuyNowClickDirect,
  ]);

  // ✅ Handle modal close - reset modal state
  const handleModalClose = useCallback(() => {
    setShowVariantModal(false);
    setIsModalInitialized(false);
    modalOpenedRef.current = false;

    // Reset swipe button if it exists
    if (swipeButtonRef.current && swipeButtonRef.current.reset) {
      setTimeout(() => {
        if (swipeButtonRef.current && swipeButtonRef.current.reset) {
          swipeButtonRef.current.reset();
        }
      }, 300);
    }
  }, []);

  // ✅ Initialize modal when opened
  useEffect(() => {
    if (showVariantModal && !isModalInitialized) {
      // Reset modal opened flag
      modalOpenedRef.current = true;

      // Reset swipe button when modal opens
      if (swipeButtonRef.current && swipeButtonRef.current.reset) {
        setTimeout(() => {
          if (swipeButtonRef.current && swipeButtonRef.current.reset) {
            swipeButtonRef.current.reset();
          }
        }, 100);
      }

      // When modal opens, check if we have a saved variant to preselect
      if (hasSavedCartItem && selectedVariant) {
        let variantIndex = -1;
        const variantIdToUse = selectedVariant.variantId || selectedVariant._id;

        if (variants.length > 0 && variantIdToUse) {
          variantIndex = findVariantIndexById(variantIdToUse);
        }

        if (variantIndex !== -1) {
          setSelectedVariantIndex(variantIndex);
        }
      } else {
        // No saved variant, reset to null
        setSelectedVariantIndex(null);
        setSelectedVariant(null);
      }

      setIsModalInitialized(true);
    }
  }, [
    showVariantModal,
    isModalInitialized,
    hasSavedCartItem,
    selectedVariant,
    variants,
    findVariantIndexById,
  ]);

  // ✅ Check if variant is selected in modal
  const isVariantSelectedInModal = useCallback(
    (variantIndex: number) => {
      // अगर modal अभी खुला नहीं है तो कुछ नहीं दिखाओ
      if (!modalOpenedRef.current) return false;

      // अगर कोई variant select नहीं है तो false
      if (selectedVariantIndex === null && selectedVariant === null)
        return false;

      // अगर selectedVariantIndex मौजूद है तो उसी से compare करो
      if (selectedVariantIndex !== null) {
        return selectedVariantIndex === variantIndex;
      }

      // अगर selectedVariant है लेकिन index नहीं है
      if (selectedVariant && variants.length > 0) {
        const variantId = variants[variantIndex]?._id;
        if (!variantId) return false;

        return (
          selectedVariant.variantId === variantId ||
          selectedVariant._id === variantId
        );
      }

      return false;
    },
    [selectedVariantIndex, selectedVariant, variants],
  );

  // ✅ Swipe handlers
  const handleSwipeStart = useCallback(() => {
    triggerVibration();
  }, [triggerVibration]);

  const handleSwipeSuccess = useCallback(async () => {
    if (isMountedRef.current) {
      setSwipeLoading(true);
    }

    const productId = product?._id || product?.id;

    if (!product || !productId) {
      Alert.alert('Error', 'Product data missing!');
      if (isMountedRef.current) {
        setSwipeLoading(false);
      }
      return;
    }

    if (!productAvailable) {
      Alert.alert('Error', 'Product not available!');
      if (isMountedRef.current) {
        setSwipeLoading(false);
      }
      if (swipeButtonRef.current && swipeButtonRef.current.reset) {
        swipeButtonRef.current.reset();
      }
      return;
    }

    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      Alert.alert('Error', 'Please login first!');
      if (isMountedRef.current) {
        setSwipeLoading(false);
      }
      if (swipeButtonRef.current && swipeButtonRef.current.reset) {
        swipeButtonRef.current.reset();
      }
      return;
    }

    try {
      const requestBody: any = {
        productData: product,
      };

      if (selectedVariant && Object.keys(selectedVariant).length > 0) {
        requestBody.selectedVariant = selectedVariant;
      }

      const res = await fetch('http://172.20.10.12:5000/api/cart/buy-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Error', data.error || 'Something went wrong!');
        if (isMountedRef.current) {
          setSwipeLoading(false);
        }
        if (swipeButtonRef.current && swipeButtonRef.current.reset) {
          setTimeout(() => {
            if (swipeButtonRef.current && swipeButtonRef.current.reset) {
              swipeButtonRef.current.reset();
            }
          }, 500);
        }
        return;
      }

      triggerVibration();
      setShowVariantModal(false);
      setIsModalInitialized(false);
      modalOpenedRef.current = false;

      setTimeout(() => {
        navigation.getParent()?.navigate('BuyNowNavigator', {
          screen: 'BuyNow',
          params: {
            productId: productId,
            selectedVariant,
          },
        });
      }, 500);
    } catch (err: any) {
      console.error('BuyNow swipe error:', err);
      Alert.alert('Error', 'Failed to process buy now!');
      if (isMountedRef.current) {
        setSwipeLoading(false);
      }
      if (swipeButtonRef.current && swipeButtonRef.current.reset) {
        setTimeout(() => {
          if (swipeButtonRef.current && swipeButtonRef.current.reset) {
            swipeButtonRef.current.reset();
          }
        }, 500);
      }
    }
  }, [
    product,
    productAvailable,
    selectedVariant,
    navigation,
    triggerVibration,
  ]);

  // ✅ Dynamic swipe button width
  const getSwipeButtonWidth = useMemo(() => {
    const padding = 32;
    return Math.min(screenWidth - padding, 400);
  }, [screenWidth]);

  // ✅ Format price
  const formatPrice = useCallback((price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  }, []);

  // ✅ Render media thumbnails
  const renderMediaThumbnail = useCallback(
    (variant: ProductVariant, index: number) => {
      const media = normalizeMedia(variant.images || [], variant.video);

      if (media.length === 0) {
        return (
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 8,
              backgroundColor: themeColors.light,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: themeColors.borderColor,
              borderStyle: 'dashed',
            }}
          >
            <Icon name="image" size={32} color={themeColors.gray} />
            <Text
              style={{
                fontSize: 11,
                color: themeColors.gray,
                marginTop: 4,
                fontWeight: '600',
              }}
            >
              No media
            </Text>
          </View>
        );
      }

      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.variantImagesContainer}
          contentContainerStyle={styles.variantImagesContent}
        >
          {media.map((item, mediaIndex) => {
            const isVideo = isVideoUrl(item.url);

            if (isVideo) {
              return (
                <View
                  key={`media-${index}-${mediaIndex}`}
                  style={styles.videoThumbnailContainer}
                >
                  <View
                    style={[
                      styles.videoThumbnail,
                      {
                        backgroundColor: themeColors.videoBg,
                        borderColor: themeColors.primary,
                      },
                    ]}
                  >
                    <Icon
                      name="videocam"
                      size={24}
                      color={themeColors.primary}
                    />
                  </View>
                  <View style={styles.videoPlayIcon}>
                    <Icon
                      name="play-circle-filled"
                      size={28}
                      color="rgba(255, 255, 255, 0.9)"
                    />
                  </View>
                  <View
                    style={[
                      styles.videoBadge,
                      { backgroundColor: themeColors.badgeBg },
                    ]}
                  >
                    <Icon name="videocam" size={12} color={themeColors.white} />
                    <Text style={styles.videoBadgeText}>VIDEO</Text>
                  </View>
                </View>
              );
            } else {
              return (
                <View
                  key={`media-${index}-${mediaIndex}`}
                  style={styles.imageContainer}
                >
                  <Image
                    source={{ uri: item.url }}
                    style={[
                      styles.variantImage,
                      { borderColor: themeColors.borderColor },
                    ]}
                    resizeMode="cover"
                  />
                </View>
              );
            }
          })}
        </ScrollView>
      );
    },
    [themeColors],
  );

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    // ✅ Modal Full Screen Container
    modalFullScreenContainer: {
      flex: 1,
      backgroundColor: 'transparent',
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    safeAreaWhite: {
      flex: 1,
      backgroundColor: themeColors.modalBg,
    },

    variantModalContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: themeColors.modalBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: screenHeight * 0.59,
      maxHeight: screenHeight * 0.65,
      shadowColor: themeColors.shadowColor,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 20,
    },

    variantModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.modalBorder,
      backgroundColor: themeColors.modalBg,
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    variantModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.textPrimary,
    },
    closeButton: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: themeColors.light,
    },

    savedIndicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.infoBg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginHorizontal: 16,
      marginBottom: 12,
      gap: 6,
      borderWidth: 1,
      borderColor: themeColors.infoBorder,
    },
    savedIndicatorText: {
      fontSize: 13,
      color: themeColors.success,
      fontWeight: '600',
    },

    variantModalSubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: 12,
      fontWeight: '500',
      paddingHorizontal: 16,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      height: 150,
      gap: 12,
      backgroundColor: themeColors.modalBg,
    },
    loadingText: {
      fontSize: 14,
      color: themeColors.gray,
      fontWeight: '500',
    },

    variantListContainer: {
      paddingHorizontal: 4,
      backgroundColor: themeColors.modalBg,
    },

    variantScrollView: {
      flex: 1,
      backgroundColor: themeColors.modalBg,
    },
    variantScrollContent: {
      paddingBottom: 20,
      paddingTop: 8,
      backgroundColor: themeColors.modalBg,
    },

    variantCard: {
      backgroundColor: themeColors.cardBg,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: themeColors.borderColor,
      marginBottom: 12,
      overflow: 'hidden',
      shadowColor: themeColors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
      marginHorizontal: 12,
    },
    variantCardSelected: {
      backgroundColor: themeColors.cardHover,
      borderColor: themeColors.primary,
      borderWidth: 2,
      shadowColor: themeColors.primary,
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    selectedBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: themeColors.success,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },

    variantImagesContainer: {
      maxHeight: 100,
      backgroundColor: themeColors.light,
    },
    variantImagesContent: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },

    variantDetails: {
      padding: 12,
      backgroundColor: themeColors.cardBg,
    },
    variantHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    variantName: {
      fontSize: 15,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      flexWrap: 'wrap',
    },
    fieldName: {
      fontSize: 12,
      color: themeColors.textSecondary,
      marginRight: 6,
      width: 70,
      fontWeight: '500',
    },
    fieldValue: {
      fontSize: 13,
      fontWeight: '500',
      color: themeColors.textPrimary,
      flex: 1,
    },
    fieldPrice: {
      fontSize: 12,
      fontWeight: '600',
      color: themeColors.success,
      marginLeft: 6,
    },

    variantBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    statusTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusDefault: {
      backgroundColor: themeColors.light,
    },
    statusSelected: {
      backgroundColor: themeColors.success,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: themeColors.textPrimary,
    },
    statusSelectedText: {
      color: themeColors.white,
    },
    videoIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      gap: 4,
    },
    videoIndicatorText: {
      fontSize: 10,
      fontWeight: '600',
      color: themeColors.white,
    },

    noVariantsContainer: {
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: themeColors.modalBg,
    },
    noVariantsText: {
      fontSize: 16,
      color: themeColors.textPrimary,
      textAlign: 'center',
      fontWeight: '600',
      marginTop: 8,
    },
    noVariantsSubtext: {
      fontSize: 13,
      color: themeColors.gray,
      textAlign: 'center',
      fontWeight: '500',
    },

    swipeSectionSafeArea: {
      backgroundColor: themeColors.modalBg,
      borderTopWidth: 1,
      borderTopColor: themeColors.modalBorder,
    },

    swipeSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.modalBg,
      alignItems: 'center',
    },
    swipeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: themeColors.infoBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: themeColors.infoBorder,
      width: '100%',
    },
    swipeInfoText: {
      fontSize: 13,
      color: themeColors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },

    swipeButtonWrapper: {
      position: 'relative',
      width: '100%',
      alignItems: 'center',
    },
    swipeButtonContainer: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: themeColors.primary,
      backgroundColor: themeColors.primary,
    },
    swipeRail: {
      borderRadius: 24,
    },
    swipeButtonTitle: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.3,
    },

    thumbIcon: {
      borderRadius: 20,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      width: 40,
      height: 40,
      backgroundColor: themeColors.white,
    },
    thumbIconContent: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.white,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: themeColors.primary,
    },

    selectPromptContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.light,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: themeColors.railBackground,
      borderStyle: 'dashed',
      gap: 8,
      width: '100%',
    },
    selectPromptText: {
      fontSize: 13,
      color: themeColors.gray,
      fontWeight: '500',
    },

    swipeLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      gap: 8,
    },
    swipeLoadingText: {
      fontSize: 13,
      color: themeColors.primary,
      fontWeight: '600',
    },

    buyNowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 140,
      borderRadius: 8,
      gap: 6,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
      alignSelf: 'flex-start',
      minWidth: 120,
    },
    enabledButton: {
      backgroundColor: themeColors.enabledButtonBg,
      borderWidth: 1,
      borderColor: themeColors.primary,
    },
    disabledButton: {
      backgroundColor: themeColors.disabledButtonBg,
      borderWidth: 1,
      borderColor: themeColors.disabledButtonBg,
      opacity: 0.6,
    },
    buttonIconContainer: {
      padding: 5,
      left: 5,
      borderRadius: 6,
      marginRight: 4,
    },
    buttonText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    enabledButtonText: {
      color: themeColors.white,
    },
    disabledButtonText: {
      color: themeColors.white,
    },
  });

  return (
    <>
      {/* ✅ Modal Component */}
      <Modal
        visible={showVariantModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View style={dynamicStyles.modalFullScreenContainer}>
          <TouchableWithoutFeedback onPress={handleModalClose}>
            <View style={dynamicStyles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={dynamicStyles.variantModalContainer}>
            <SafeAreaView style={dynamicStyles.safeAreaWhite}>
              {/* Modal Header */}
              <View style={dynamicStyles.variantModalHeader}>
                <View style={dynamicStyles.modalHeaderLeft}>
                  <Icon
                    name="inventory"
                    size={24}
                    color={themeColors.primary}
                  />
                  <Text style={dynamicStyles.variantModalTitle}>
                    Select Option
                  </Text>
                </View>
                <TouchableOpacity
                  style={dynamicStyles.closeButton}
                  onPress={handleModalClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={24} color={themeColors.dark} />
                </TouchableOpacity>
              </View>

              {/* Variant List */}
              <ScrollView
                style={dynamicStyles.variantScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={dynamicStyles.variantScrollContent}
              >
                {variantsLoading ? (
                  <View style={dynamicStyles.loadingContainer}>
                    <ActivityIndicator
                      size="large"
                      color={themeColors.primary}
                    />
                    <Text style={dynamicStyles.loadingText}>
                      Loading options...
                    </Text>
                  </View>
                ) : (
                  <View style={dynamicStyles.variantListContainer}>
                    <Text style={dynamicStyles.variantModalSubtitle}>
                      {variants.length} variant
                      {variants.length !== 1 ? 's' : ''} available
                    </Text>

                    {variants && variants.length > 0 ? (
                      variants.map((variant, index) => {
                        const fields = variant.fields || [];

                        const isSelected = isVariantSelectedInModal(index);

                        return (
                          <TouchableOpacity
                            key={`buynow-variant-${variant._id || index}`}
                            style={[
                              dynamicStyles.variantCard,
                              isSelected && dynamicStyles.variantCardSelected,
                            ]}
                            onPress={() => handleVariantSelect(index)}
                            activeOpacity={0.7}
                          >
                            {isSelected && (
                              <View style={dynamicStyles.selectedBadge}>
                                <Icon
                                  name="check"
                                  size={16}
                                  color={themeColors.white}
                                />
                              </View>
                            )}

                            {renderMediaThumbnail(variant, index)}

                            <View style={dynamicStyles.variantDetails}>
                              <View style={dynamicStyles.variantHeader}>
                                <Text style={dynamicStyles.variantName}>
                                  Option {index + 1}
                                </Text>
                                {variant.video && (
                                  <View
                                    style={{
                                      backgroundColor: themeColors.videoBg,
                                      padding: 4,
                                      borderRadius: 8,
                                    }}
                                  >
                                    <Icon
                                      name="videocam"
                                      size={20}
                                      color={themeColors.primary}
                                    />
                                  </View>
                                )}
                              </View>

                              {fields.map((field, fieldIndex) => (
                                <View
                                  key={`buynow-field-${index}-${fieldIndex}`}
                                  style={dynamicStyles.fieldRow}
                                >
                                  <Text style={dynamicStyles.fieldName}>
                                    {field.name}:
                                  </Text>
                                  <Text style={dynamicStyles.fieldValue}>
                                    {field.value}
                                  </Text>
                                  {field.price && field.price > 0 && (
                                    <Text style={dynamicStyles.fieldPrice}>
                                      +{formatPrice(field.price)}
                                    </Text>
                                  )}
                                </View>
                              ))}

                              <View style={dynamicStyles.variantBottomRow}>
                                <View
                                  style={[
                                    dynamicStyles.statusTag,
                                    isSelected
                                      ? dynamicStyles.statusSelected
                                      : dynamicStyles.statusDefault,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      dynamicStyles.statusText,
                                      isSelected &&
                                        dynamicStyles.statusSelectedText,
                                    ]}
                                  >
                                    {isSelected ? 'Selected' : 'Available'}
                                  </Text>
                                </View>

                                {variant.video && (
                                  <TouchableOpacity
                                    style={dynamicStyles.videoIndicator}
                                  >
                                    <Icon
                                      name="play-circle"
                                      size={14}
                                      color={themeColors.white}
                                    />
                                    <Text
                                      style={dynamicStyles.videoIndicatorText}
                                    >
                                      Video Available
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <View style={dynamicStyles.noVariantsContainer}>
                        <Icon
                          name="inventory"
                          size={48}
                          color={themeColors.gray}
                        />
                        <Text style={dynamicStyles.noVariantsText}>
                          No variants available
                        </Text>
                        <Text style={dynamicStyles.noVariantsSubtext}>
                          Proceed with basic product
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>

            {/* ✅ SWIPE BUTTON SECTION - FIXED: Removed unsupported props */}
            <SafeAreaView style={dynamicStyles.swipeSectionSafeArea}>
              <View style={dynamicStyles.swipeSection}>
                <View style={dynamicStyles.swipeInfo}>
                  <Icon
                    name="info-outline"
                    size={16}
                    color={themeColors.secondary}
                  />
                  <Text style={dynamicStyles.swipeInfoText}>
                    {isVariantSelected()
                      ? 'Swipe to confirm purchase'
                      : 'Select an option to proceed'}
                  </Text>
                </View>

                {isVariantSelected() ? (
                  <View style={dynamicStyles.swipeButtonWrapper}>
                    <SwipeButton
                      ref={swipeButtonRef}
                      disabled={swipeLoading}
                      swipeSuccessThreshold={70}
                      height={48}
                      width={getSwipeButtonWidth}
                      title="Swipe to Buy Now"
                      titleStyles={dynamicStyles.swipeButtonTitle}
                      titleColor={themeColors.white}
                      titleFontSize={14}
                      onSwipeStart={handleSwipeStart}
                      onSwipeSuccess={handleSwipeSuccess}
                      shouldResetAfterSuccess={false}
                      railFillBackgroundColor={themeColors.railFill}
                      railFillBorderColor={themeColors.primary}
                      thumbIconBackgroundColor={themeColors.white}
                      thumbIconBorderColor={themeColors.primary}
                      railBackgroundColor={themeColors.railBackground}
                      railBorderColor={themeColors.light}
                      containerStyles={dynamicStyles.swipeButtonContainer}
                      railStyles={dynamicStyles.swipeRail}
                      thumbIconStyles={dynamicStyles.thumbIcon}
                      thumbIconComponent={() => (
                        <ThumbIconComponent isDark={isDark} />
                      )}
                    />
                    {swipeLoading && (
                      <View style={dynamicStyles.swipeLoadingOverlay}>
                        <ActivityIndicator
                          size="small"
                          color={themeColors.primary}
                        />
                        <Text style={dynamicStyles.swipeLoadingText}>
                          Processing...
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={dynamicStyles.selectPromptContainer}
                    onPress={() => {
                      if (variants.length > 0) {
                        handleVariantSelect(0);
                      }
                    }}
                    disabled={variants.length === 0}
                    activeOpacity={0.6}
                  >
                    <Icon name="touch-app" size={18} color={themeColors.gray} />
                    <Text style={dynamicStyles.selectPromptText}>
                      {variants.length > 0
                        ? 'Tap to select first option'
                        : 'No options available'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* ✅ Single Buy Now Button */}
      <TouchableOpacity
        onPress={handleBuyNowClick}
        disabled={
          loading ||
          productLoading ||
          !productAvailable ||
          !product ||
          checkingSavedItem
        }
        style={[
          dynamicStyles.buyNowButton,
          !productAvailable || loading || productLoading || !product
            ? dynamicStyles.disabledButton
            : dynamicStyles.enabledButton,
        ]}
        activeOpacity={0.7}
      >
        {loading || checkingSavedItem ? (
          <ActivityIndicator size="small" color={themeColors.white} />
        ) : (
          <>
            <View style={dynamicStyles.buttonIconContainer}>
              <FontAwesome5
                name="shopping-basket"
                size={16}
                color={themeColors.white}
              />
            </View>
            <Text
              style={[
                dynamicStyles.buttonText,
                !productAvailable || loading || productLoading || !product
                  ? dynamicStyles.disabledButtonText
                  : dynamicStyles.enabledButtonText,
              ]}
            >
              {checkingSavedItem ? 'Checking...' : 'Buy Now'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Static styles that don't change with theme
  variantImagesContainer: {
    maxHeight: 100,
  },
  variantImagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imageContainer: {
    marginRight: 8,
  },
  variantImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },

  videoThumbnailContainer: {
    position: 'relative',
    marginRight: 8,
  },
  videoThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -14 }, { translateY: -14 }],
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 2,
  },
  videoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  videoBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  thumbIconContent: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
  },
});

export default BuyNow;
