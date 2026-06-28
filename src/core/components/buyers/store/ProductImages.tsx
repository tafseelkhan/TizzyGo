// components/Products/ProductImages.tsx - FIXED VERSION
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  PanResponder,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../contexts/theme/ThemeContext';

const { width, height } = Dimensions.get('window');

// ============= UPDATED INTERFACES FOR NEW DATA STRUCTURE =============

export interface Variant {
  _id?: string;
  fields?: Record<string, string>;
  combinationKey?: string;
  images?: string[];
  video?: string;
  stock?: number;
  quantityAvailable?: number;
  price?: number;
  finalPrice?: number;
  mrp?: number;
  discount?: number;
  sku?: string;
  isDefault?: boolean;
  variantId?: string;
  inStock?: boolean;
}

interface ProductImagesProps {
  variants: Variant[];
  onVariantChange?: (variantIndex: number) => void;
  initialVariantIndex?: number;
}

const colorMap: Record<string, string> = {
  red: '#FF0000',
  blue: '#0000FF',
  green: '#008000',
  black: '#000000',
  white: '#FFFFFF',
  yellow: '#FFFF00',
  pink: '#FFC0CB',
  purple: '#800080',
  orange: '#FFA500',
  gray: '#808080',
  grey: '#808080',
  brown: '#A52A2A',
  navy: '#000080',
  maroon: '#800000',
  teal: '#008080',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  silver: '#C0C0C0',
  gold: '#FFD700',
  beige: '#F5F5DC',
  cream: '#FFFDD0',
  khaki: '#F0E68C',
  olive: '#808000',
  lime: '#00FF00',
  coral: '#FF7F50',
  turquoise: '#40E0D0',
  lavender: '#E6E6FA',
  violet: '#EE82EE',
  indigo: '#4B0082',
  transparent: '#00000000',
  f: '#808080',
  gg: '#A0A0A0',
  '0b': '#0B3B60',
  ttt: '#5C6BC0',
  gG: '#9E9E9E',
};

// Helper function to validate Firebase image URLs - SILENT (no console logs)
const getValidImageUrl = (url: string): string => {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return '';
};

// FIXED: SafeImage component with proper useEffect dependencies
const SafeImage: React.FC<{
  uri: string;
  style: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}> = React.memo(({ uri, style, resizeMode = 'cover' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const validUri = useMemo(() => getValidImageUrl(uri), [uri]);

  // FIXED: Reset states only when validUri actually changes
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [validUri]); // ✅ Only depends on validUri, not uri

  if (!validUri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <Icon name="image-outline" size={32} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <View style={style}>
      {loading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#F3F4F6',
            },
          ]}
        >
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      )}
      {error && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#F3F4F6',
            },
          ]}
        >
          <Icon name="image-off-outline" size={32} color="#9CA3AF" />
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
            Failed to load
          </Text>
        </View>
      )}
      <Image
        source={{ uri: validUri }}
        style={[style, { opacity: loading || error ? 0 : 1 }]}
        resizeMode={resizeMode}
        onLoadStart={() => {
          setLoading(true);
          setError(false);
        }}
        onLoadEnd={() => {
          setLoading(false);
        }}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </View>
  );
});

// Helper: Convert old variant fields array to new object format
const normalizeVariantFields = (variant: Variant): Record<string, string> => {
  if (
    variant.fields &&
    typeof variant.fields === 'object' &&
    !Array.isArray(variant.fields)
  ) {
    return variant.fields;
  }

  if (variant.fields && Array.isArray(variant.fields)) {
    const normalized: Record<string, string> = {};
    variant.fields.forEach((field: any) => {
      if (field.name && field.value) {
        normalized[field.name] = field.value;
      }
    });
    return normalized;
  }

  return {};
};

const getVariantDisplayName = (variant: Variant): string => {
  const fields = normalizeVariantFields(variant);
  if (Object.keys(fields).length > 0) {
    return Object.entries(fields)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' • ');
  }
  if (variant.combinationKey) {
    return variant.combinationKey.replace(/\|/g, ' • ');
  }
  return '';
};

const getVariantStock = (variant: Variant): number => {
  if (variant.quantityAvailable !== undefined) return variant.quantityAvailable;
  if (variant.stock !== undefined) return variant.stock;
  return 0;
};

const getVariantPrice = (variant: Variant): number => {
  if (variant.finalPrice) return variant.finalPrice;
  if (variant.price) return variant.price;
  return 0;
};

const ProductImages: React.FC<ProductImagesProps> = ({
  variants,
  onVariantChange,
  initialVariantIndex = 0,
}) => {
  const { isDark } = useTheme();

  // FIXED: Memoize validVariants to prevent recalculation on every render
  const validVariants = useMemo(() => {
    return variants.filter(
      v => v && (normalizeVariantFields(v) || v.combinationKey),
    );
  }, [variants]);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(
    initialVariantIndex >= validVariants.length ? 0 : initialVariantIndex,
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [tempSelectedOptions, setTempSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [availableOptions, setAvailableOptions] = useState<
    Record<string, string[]>
  >({});
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImage, setZoomImage] = useState('');
  const [tempVariantIndex, setTempVariantIndex] =
    useState(selectedVariantIndex);

  const swipeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // FIXED: Memoize selectedVariant to prevent unnecessary re-renders
  const selectedVariant = useMemo(() => {
    return validVariants[selectedVariantIndex];
  }, [validVariants, selectedVariantIndex]);

  const selectedVariantFields = useMemo(() => {
    return normalizeVariantFields(selectedVariant);
  }, [selectedVariant]);

  const images = useMemo(() => {
    return selectedVariant?.images || [];
  }, [selectedVariant]);

  const selectedImage = useMemo(() => {
    return images[selectedImageIndex] || '';
  }, [images, selectedImageIndex]);

  const dynamicStyles = getDynamicStyles(isDark);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Animated.spring(scaleAnim, {
          toValue: 1.05,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: swipeAnim }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (evt, gestureState) => {
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        if (gestureState.dx < -50 && selectedImageIndex < images.length - 1) {
          setSelectedImageIndex(selectedImageIndex + 1);
        } else if (gestureState.dx > 50 && selectedImageIndex > 0) {
          setSelectedImageIndex(selectedImageIndex - 1);
        }
        swipeAnim.setValue(0);
      },
    }),
  ).current;

  // FIXED: Build available options from all variants - proper dependencies
  useEffect(() => {
    if (validVariants.length > 0) {
      const options: Record<string, string[]> = {};
      validVariants.forEach(variant => {
        const fields = normalizeVariantFields(variant);
        Object.entries(fields).forEach(([name, value]) => {
          if (!options[name]) options[name] = [];
          if (!options[name].includes(value)) options[name].push(value);
        });
      });
      setAvailableOptions(options);

      const currentOptions: Record<string, string> = {};
      const fields = normalizeVariantFields(
        validVariants[selectedVariantIndex],
      );
      Object.entries(fields).forEach(([name, value]) => {
        currentOptions[name] = value;
      });
      setTempSelectedOptions(currentOptions);
    }
  }, [validVariants, selectedVariantIndex]); // ✅ Proper dependencies

  const findVariantByOptions = useCallback(
    (options: Record<string, string>) => {
      for (let i = 0; i < validVariants.length; i++) {
        const variant = validVariants[i];
        const fields = normalizeVariantFields(variant);
        let matches = true;
        for (const [key, value] of Object.entries(options)) {
          if (fields[key] !== value) {
            matches = false;
            break;
          }
        }
        if (matches) return i;
      }
      return selectedVariantIndex;
    },
    [validVariants, selectedVariantIndex],
  );

  const handleTempOptionSelect = useCallback(
    (fieldName: string, value: string) => {
      const newOptions = { ...tempSelectedOptions, [fieldName]: value };
      setTempSelectedOptions(newOptions);
      setTempVariantIndex(findVariantByOptions(newOptions));
    },
    [tempSelectedOptions, findVariantByOptions],
  );

  const handleApplySelection = useCallback(() => {
    const variantIndex = findVariantByOptions(tempSelectedOptions);
    setSelectedVariantIndex(variantIndex);
    setSelectedImageIndex(0);
    if (onVariantChange) onVariantChange(variantIndex);
    setShowVariantModal(false);
  }, [tempSelectedOptions, findVariantByOptions, onVariantChange]);

  const handleQuickColorSelect = useCallback(
    (fieldName: string, value: string) => {
      const newOptions = { ...tempSelectedOptions, [fieldName]: value };
      const variantIndex = findVariantByOptions(newOptions);
      setTempSelectedOptions(newOptions);
      setSelectedVariantIndex(variantIndex);
      setSelectedImageIndex(0);
      if (onVariantChange) onVariantChange(variantIndex);
    },
    [tempSelectedOptions, findVariantByOptions, onVariantChange],
  );

  const getColorValue = useCallback((colorName: string): string => {
    if (!colorName) return '#E5E7EB';
    const lowerColor = colorName.toLowerCase();
    if (colorMap[lowerColor]) return colorMap[lowerColor];
    for (const [key, value] of Object.entries(colorMap)) {
      if (lowerColor.includes(key)) return value;
    }
    return '#E5E7EB';
  }, []);

  const isColorField = useCallback((fieldName: string) => {
    const lowerField = fieldName.toLowerCase();
    return lowerField.includes('color') || lowerField.includes('colour');
  }, []);

  const getVariantDisplayFields = useCallback(
    (variant: Variant): { name: string; value: string }[] => {
      const fields = normalizeVariantFields(variant);
      return Object.entries(fields).map(([name, value]) => ({ name, value }));
    },
    [],
  );

  const colorFields = useMemo(() => {
    return Object.keys(availableOptions).filter(isColorField);
  }, [availableOptions, isColorField]);

  const otherFields = useMemo(() => {
    return Object.keys(availableOptions).filter(field => !isColorField(field));
  }, [availableOptions, isColorField]);

  const tempVariant = useMemo(() => {
    return validVariants[tempVariantIndex];
  }, [validVariants, tempVariantIndex]);

  const tempVariantFields = useMemo(() => {
    return normalizeVariantFields(tempVariant);
  }, [tempVariant]);

  const handleImageZoom = useCallback((image: string) => {
    setZoomImage(image);
    setShowZoomModal(true);
  }, []);

  const handleZoomImageChange = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'left' && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1);
        setZoomImage(images[selectedImageIndex - 1]);
      } else if (
        direction === 'right' &&
        selectedImageIndex < images.length - 1
      ) {
        setSelectedImageIndex(selectedImageIndex + 1);
        setZoomImage(images[selectedImageIndex + 1]);
      }
    },
    [selectedImageIndex, images],
  );

  if (validVariants.length === 0) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.placeholder}>
          <Icon
            name="image-outline"
            size={48}
            color={isDark ? '#64748B' : '#9CA3AF'}
          />
          <Text style={dynamicStyles.placeholderText}>No Images Available</Text>
        </View>
      </View>
    );
  }

  const variantDisplayName = getVariantDisplayName(selectedVariant);
  const variantFieldsArray = getVariantDisplayFields(selectedVariant);
  const variantStock = getVariantStock(selectedVariant);
  const variantPrice = getVariantPrice(selectedVariant);

  return (
    <View style={dynamicStyles.container}>
      {/* Main Image Container */}
      <View style={dynamicStyles.mainImageContainer}>
        <Animated.View
          style={[
            dynamicStyles.mainImageWrapper,
            { transform: [{ translateX: swipeAnim }, { scale: scaleAnim }] },
          ]}
          {...panResponder.panHandlers}
        >
          {selectedImage ? (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => handleImageZoom(selectedImage)}
              style={dynamicStyles.imageTouchable}
            >
              <SafeImage
                uri={selectedImage}
                style={dynamicStyles.mainImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={dynamicStyles.imagePlaceholder}>
              <Icon
                name="image-outline"
                size={48}
                color={isDark ? '#64748B' : '#9CA3AF'}
              />
              <Text style={dynamicStyles.placeholderText}>No Image</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Selected Variant Chip */}
      {variantDisplayName && (
        <View style={dynamicStyles.selectedVariantContainer}>
          <View style={dynamicStyles.selectedVariantCard}>
            <Icon name="checkmark-circle-outline" size={20} color="#10B981" />
            <Text style={dynamicStyles.selectedVariantLabel}>Selected:</Text>
            <Text style={dynamicStyles.selectedVariantValue} numberOfLines={1}>
              {variantDisplayName}
            </Text>
          </View>
        </View>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <View style={dynamicStyles.thumbnailsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.thumbnailsContainer}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  dynamicStyles.thumbnail,
                  selectedImageIndex === index &&
                    dynamicStyles.selectedThumbnail,
                ]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <SafeImage
                  uri={image}
                  style={dynamicStyles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Color Selector */}
      {colorFields.length > 0 && (
        <View style={dynamicStyles.colorSection}>
          <Text style={dynamicStyles.sectionTitle}>Colors</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.colorContainer}
          >
            {colorFields.map(fieldName => (
              <React.Fragment key={fieldName}>
                {availableOptions[fieldName].map(value => (
                  <TouchableOpacity
                    key={`${fieldName}-${value}`}
                    style={[
                      dynamicStyles.colorOption,
                      tempSelectedOptions[fieldName] === value &&
                        dynamicStyles.selectedColorOption,
                    ]}
                    onPress={() => handleQuickColorSelect(fieldName, value)}
                  >
                    <View
                      style={[
                        dynamicStyles.colorCircle,
                        { backgroundColor: getColorValue(value) },
                      ]}
                    />
                    <Text style={dynamicStyles.colorText} numberOfLines={1}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Select Variant Button */}
      {(otherFields.length > 0 || colorFields.length > 1) && (
        <TouchableOpacity
          style={dynamicStyles.selectVariantButton}
          onPress={() => {
            const currentOptions: Record<string, string> = {};
            const fields = normalizeVariantFields(selectedVariant);
            Object.entries(fields).forEach(([name, value]) => {
              currentOptions[name] = value;
            });
            setTempSelectedOptions(currentOptions);
            setTempVariantIndex(selectedVariantIndex);
            setShowVariantModal(true);
          }}
        >
          <View style={dynamicStyles.buttonGradient}>
            <Icon name="shuffle-outline" size={22} color="#FFFFFF" />
            <Text style={dynamicStyles.selectVariantButtonText}>
              Select {otherFields.length > 0 ? 'Size & Options' : 'Variant'}
            </Text>
            <Icon name="arrow-forward-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Rest of the modal JSX remains same... */}
      {/* Variant Modal */}
      <Modal
        visible={showVariantModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVariantModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <View>
                <Text style={dynamicStyles.modalTitle}>Choose Options</Text>
                <Text style={dynamicStyles.modalSubtitle}>
                  Select your preferred variant
                </Text>
              </View>
              <TouchableOpacity
                style={dynamicStyles.closeButton}
                onPress={() => setShowVariantModal(false)}
              >
                <Icon
                  name="close-outline"
                  size={26}
                  color={isDark ? '#CBD5E1' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={dynamicStyles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {colorFields.map(fieldName => (
                <View key={fieldName} style={dynamicStyles.optionSection}>
                  <Text style={dynamicStyles.optionLabel}>{fieldName}</Text>
                  <View style={dynamicStyles.optionGrid}>
                    {availableOptions[fieldName].map(value => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          dynamicStyles.colorModalOption,
                          tempSelectedOptions[fieldName] === value &&
                            dynamicStyles.selectedColorModalOption,
                        ]}
                        onPress={() => handleTempOptionSelect(fieldName, value)}
                      >
                        <View
                          style={[
                            dynamicStyles.modalColorCircle,
                            { backgroundColor: getColorValue(value) },
                          ]}
                        />
                        <Text
                          style={dynamicStyles.modalColorText}
                          numberOfLines={1}
                        >
                          {value}
                        </Text>
                        {tempSelectedOptions[fieldName] === value && (
                          <View style={dynamicStyles.checkMark}>
                            <Icon name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {otherFields.map(fieldName => (
                <View key={fieldName} style={dynamicStyles.optionSection}>
                  <Text style={dynamicStyles.optionLabel}>{fieldName}</Text>
                  <View style={dynamicStyles.optionGrid}>
                    {availableOptions[fieldName].map(value => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          dynamicStyles.textOption,
                          tempSelectedOptions[fieldName] === value &&
                            dynamicStyles.selectedTextOption,
                        ]}
                        onPress={() => handleTempOptionSelect(fieldName, value)}
                      >
                        <Text
                          style={[
                            dynamicStyles.textOptionText,
                            tempSelectedOptions[fieldName] === value &&
                              dynamicStyles.selectedTextOptionText,
                          ]}
                        >
                          {value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {tempVariant && Object.keys(tempVariantFields).length > 0 && (
                <View style={dynamicStyles.previewCard}>
                  <Text style={dynamicStyles.previewTitle}>
                    Selected Preview
                  </Text>
                  <View style={dynamicStyles.previewDetails}>
                    {Object.entries(tempVariantFields).map(
                      ([name, value], index) => (
                        <View key={index} style={dynamicStyles.previewField}>
                          <Text style={dynamicStyles.previewFieldName}>
                            {name}:
                          </Text>
                          <Text style={dynamicStyles.previewFieldValue}>
                            {value}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                  {variantPrice > 0 && (
                    <View style={dynamicStyles.priceRow}>
                      <Text style={dynamicStyles.priceLabel}>Price:</Text>
                      <Text style={dynamicStyles.priceValue}>
                        ₹{variantPrice}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={dynamicStyles.modalButtonContainer}>
                <TouchableOpacity
                  style={dynamicStyles.modalCancelButton}
                  onPress={() => setShowVariantModal(false)}
                >
                  <Text style={dynamicStyles.modalCancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={dynamicStyles.modalApplyButton}
                  onPress={handleApplySelection}
                >
                  <Text style={dynamicStyles.modalApplyButtonText}>
                    Apply Selection
                  </Text>
                  <Icon name="checkmark-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Zoom Modal */}
      <Modal
        visible={showZoomModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowZoomModal(false)}
      >
        <View style={dynamicStyles.zoomModalOverlay}>
          <TouchableOpacity
            style={dynamicStyles.zoomCloseButton}
            onPress={() => setShowZoomModal(false)}
          >
            <Icon name="close-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={dynamicStyles.zoomContainer}>
            {selectedImageIndex > 0 && (
              <TouchableOpacity
                style={dynamicStyles.zoomArrowLeft}
                onPress={() => handleZoomImageChange('left')}
              >
                <Icon name="chevron-back-outline" size={32} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={1}
              style={dynamicStyles.zoomImageContainer}
              onPress={() => setShowZoomModal(false)}
            >
              <SafeImage
                uri={zoomImage}
                style={dynamicStyles.zoomImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {selectedImageIndex < images.length - 1 && (
              <TouchableOpacity
                style={dynamicStyles.zoomArrowRight}
                onPress={() => handleZoomImageChange('right')}
              >
                <Icon
                  name="chevron-forward-outline"
                  size={32}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={dynamicStyles.imageCounter}>
            <Text style={dynamicStyles.imageCounterText}>
              {selectedImageIndex + 1} / {images.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getDynamicStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    placeholder: {
      height: 400,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
    },
    placeholderText: {
      fontSize: 16,
      color: isDark ? '#CBD5E1' : '#6B7280',
      marginTop: 8,
    },
    mainImageContainer: {
      width: width,
      height: 420,
      backgroundColor: isDark ? '#0F172A' : '#eeeeee',
      position: 'relative',
      overflow: 'hidden',
    },
    mainImageWrapper: {
      width: '100%',
      height: '100%',
    },
    imageTouchable: {
      width: '100%',
      height: '100%',
    },
    mainImage: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
    },
    selectedVariantContainer: {
      paddingHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
    },
    selectedVariantCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#F0FDF4',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#166534' : '#D1FAE5',
      gap: 8,
    },
    selectedVariantLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#86EFAC' : '#059669',
    },
    selectedVariantValue: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#E2E8F0' : '#1F2937',
      flex: 1,
    },
    thumbnailsSection: {
      marginTop: 8,
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    thumbnailsContainer: {
      gap: 8,
    },
    thumbnail: {
      width: 70,
      height: 70,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      overflow: 'hidden',
    },
    selectedThumbnail: {
      borderColor: '#10B981',
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    colorSection: {
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 12,
    },
    colorContainer: {
      gap: 12,
      paddingRight: 16,
    },
    colorOption: {
      alignItems: 'center',
    },
    selectedColorOption: {
      padding: 4,
      borderRadius: 20,
      backgroundColor: '#D1FAE5',
    },
    colorCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      marginBottom: 4,
    },
    colorText: {
      fontSize: 12,
      color: isDark ? '#E2E8F0' : '#374151',
      maxWidth: 60,
      textAlign: 'center',
    },
    selectVariantButton: {
      marginHorizontal: 16,
      marginBottom: 20,
      borderRadius: 14,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    buttonGradient: {
      backgroundColor: '#10B981',
      flexDirection: 'row',
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    selectVariantButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    modalSubtitle: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#6B7280',
      marginTop: 2,
    },
    closeButton: {
      padding: 4,
    },
    modalScroll: {
      padding: 20,
      paddingBottom: 30,
    },
    optionSection: {
      marginBottom: 24,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 12,
    },
    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorModalOption: {
      alignItems: 'center',
      padding: 10,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: isDark ? '#475569' : '#E5E7EB',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      width: 80,
      position: 'relative',
    },
    selectedColorModalOption: {
      borderColor: '#10B981',
      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
    },
    modalColorCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginBottom: 6,
    },
    modalColorText: {
      fontSize: 12,
      color: isDark ? '#E2E8F0' : '#374151',
      textAlign: 'center',
    },
    checkMark: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#10B981',
      borderRadius: 12,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#1E293B' : '#FFFFFF',
    },
    textOption: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: isDark ? '#475569' : '#E5E7EB',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    },
    selectedTextOption: {
      borderColor: '#10B981',
      backgroundColor: '#10B981',
    },
    textOptionText: {
      fontSize: 14,
      color: isDark ? '#E2E8F0' : '#374151',
      fontWeight: '600',
    },
    selectedTextOptionText: {
      color: '#FFFFFF',
    },
    previewCard: {
      marginTop: 20,
      padding: 16,
      backgroundColor: isDark ? '#0F172A' : '#F0FDF4',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? '#166534' : '#D1FAE5',
    },
    previewTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#86EFAC' : '#059669',
      marginBottom: 12,
    },
    previewDetails: {
      gap: 10,
      marginBottom: 12,
    },
    previewField: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    previewFieldName: {
      fontSize: 13,
      color: isDark ? '#94A3B8' : '#6B7280',
    },
    previewFieldValue: {
      fontSize: 14,
      color: isDark ? '#F1F5F9' : '#1F2937',
      fontWeight: '600',
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#334155' : '#E5E7EB',
    },
    priceLabel: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
    },
    priceValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#10B981',
    },
    modalButtonContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      marginBottom: 10,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isDark ? '#475569' : '#E5E7EB',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      alignItems: 'center',
    },
    modalCancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#E2E8F0' : '#374151',
    },
    modalApplyButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#10B981',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    modalApplyButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    zoomModalOverlay: {
      flex: 1,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomCloseButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    zoomArrowLeft: {
      position: 'absolute',
      left: 16,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomArrowRight: {
      position: 'absolute',
      right: 16,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomImageContainer: {
      width: width,
      height: height * 0.7,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomImage: {
      width: '100%',
      height: '100%',
    },
    imageCounter: {
      position: 'absolute',
      bottom: 40,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    imageCounterText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default ProductImages;
