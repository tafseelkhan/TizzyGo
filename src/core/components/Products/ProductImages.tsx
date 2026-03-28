// components/Products/ProductImages.tsx
import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useTheme } from '../../contexts/theme/ThemeContext'; // Adjust path as needed

const { width } = Dimensions.get('window');

// Types
export interface VariantField {
  name: string;
  value: string;
}

export interface Variant {
  _id?: string;
  fields: VariantField[];
  images: string[];
  video?: string;
  stock?: number;
  price?: number;
}

interface ProductImagesProps {
  variants: Variant[];
  onVariantChange?: (variantIndex: number) => void;
  initialVariantIndex?: number;
}

// Color mapping for common colors
const colorMap: Record<string, string> = {
  // Basic colors
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

  // Additional colors
  aliceblue: '#F0F8FF',
  antiquewhite: '#FAEBD7',
  aqua: '#00FFFF',
  aquamarine: '#7FFFD4',
  azure: '#F0FFFF',
  bisque: '#FFE4C4',
  blanchedalmond: '#FFEBCD',
  blueviolet: '#8A2BE2',
  burlywood: '#DEB887',
  cadetblue: '#5F9EA0',
  chartreuse: '#7FFF00',
  chocolate: '#D2691E',
  cornflowerblue: '#6495ED',
  cornsilk: '#FFF8DC',
  crimson: '#DC143C',
  darkblue: '#00008B',
  darkcyan: '#008B8B',
  darkgoldenrod: '#B8860B',
  darkgray: '#A9A9A9',
  darkgreen: '#006400',
  darkgrey: '#A9A9A9',
  darkkhaki: '#BDB76B',
  darkmagenta: '#8B008B',
  darkolivegreen: '#556B2F',
  darkorange: '#FF8C00',
  darkorchid: '#9932CC',
  darkred: '#8B0000',
  darksalmon: '#E9967A',
  darkseagreen: '#8FBC8F',
  darkslateblue: '#483D8B',
  darkslategray: '#2F4F4F',
  darkslategrey: '#2F4F4F',
  darkturquoise: '#00CED1',
  darkviolet: '#9400D3',
  deeppink: '#FF1493',
  deepskyblue: '#00BFFF',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1E90FF',
  firebrick: '#B22222',
  floralwhite: '#FFFAF0',
  forestgreen: '#228B22',
  fuchsia: '#FF00FF',
  gainsboro: '#DCDCDC',
  ghostwhite: '#F8F8FF',
  goldenrod: '#DAA520',
  greenyellow: '#ADFF2F',
  honeydew: '#F0FFF0',
  hotpink: '#FF69B4',
  indianred: '#CD5C5C',
  ivory: '#FFFFF0',
  lavenderblush: '#FFF0F5',
  lawngreen: '#7CFC00',
  lemonchiffon: '#FFFACD',
  lightblue: '#ADD8E6',
  lightcoral: '#F08080',
  lightcyan: '#E0FFFF',
  lightgoldenrodyellow: '#FAFAD2',
  lightgray: '#D3D3D3',
  lightgreen: '#90EE90',
  lightgrey: '#D3D3D3',
  lightpink: '#FFB6C1',
  lightsalmon: '#FFA07A',
  lightseagreen: '#20B2AA',
  lightskyblue: '#87CEFA',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#B0C4DE',
  lightyellow: '#FFFFE0',
  linen: '#FAF0E6',
  mediumaquamarine: '#66CDAA',
  mediumblue: '#0000CD',
  mediumorchid: '#BA55D3',
  mediumpurple: '#9370DB',
  mediumseagreen: '#3CB371',
  mediumslateblue: '#7B68EE',
  mediumspringgreen: '#00FA9A',
  mediumturquoise: '#48D1CC',
  mediumvioletred: '#C71585',
  midnightblue: '#191970',
  mintcream: '#F5FFFA',
  mistyrose: '#FFE4E1',
  moccasin: '#FFE4B5',
  navajowhite: '#FFDEAD',
  oldlace: '#FDF5E6',
  olivedrab: '#6B8E23',
  orangered: '#FF4500',
  orchid: '#DA70D6',
  palegoldenrod: '#EEE8AA',
  palegreen: '#98FB98',
  paleturquoise: '#AFEEEE',
  palevioletred: '#DB7093',
  papayawhip: '#FFEFD5',
  peachpuff: '#FFDAB9',
  peru: '#CD853F',
  plum: '#DDA0DD',
  powderblue: '#B0E0E6',
  rosybrown: '#BC8F8F',
  royalblue: '#4169E1',
  saddlebrown: '#8B4513',
  salmon: '#FA8072',
  sandybrown: '#F4A460',
  seagreen: '#2E8B57',
  seashell: '#FFF5EE',
  sienna: '#A0522D',
  skyblue: '#87CEEB',
  slateblue: '#6A5ACD',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#FFFAFA',
  springgreen: '#00FF7F',
  steelblue: '#4682B4',
  tan: '#D2B48C',
  thistle: '#D8BFD8',
  tomato: '#FF6347',
  wheat: '#F5DEB3',
  whitesmoke: '#F5F5F5',
  yellowgreen: '#9ACD32',

  // Transparent
  transparent: '#00000000',
};

// Icons as simple text/emoji since we're not using expo vector icons
const Icon = ({
  name,
  size = 24,
  color = '#FFFFFF',
}: {
  name: string;
  size?: number;
  color?: string;
}) => {
  const getIconChar = (iconName: string): string => {
    switch (iconName) {
      case 'zoom-in':
        return '🔍';
      case 'close':
        return '✕';
      case 'chevron-left':
        return '←';
      case 'chevron-right':
        return '→';
      case 'swipe':
        return '👆';
      default:
        return '●';
    }
  };

  return (
    <Text style={{ fontSize: size, color: color }}>{getIconChar(name)}</Text>
  );
};

const ProductImages: React.FC<ProductImagesProps> = ({
  variants,
  onVariantChange,
  initialVariantIndex = 0,
}) => {
  const { isDark, theme } = useTheme(); // Theme context

  const [selectedVariantIndex, setSelectedVariantIndex] =
    useState(initialVariantIndex);
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

  // Swipe animation for main image
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
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

        // Handle swipe to change image
        if (gestureState.dx < -50) {
          // Swipe left - next image
          if (selectedImageIndex < images.length - 1) {
            setSelectedImageIndex(selectedImageIndex + 1);
          }
        } else if (gestureState.dx > 50) {
          // Swipe right - previous image
          if (selectedImageIndex > 0) {
            setSelectedImageIndex(selectedImageIndex - 1);
          }
        }

        // Reset animation
        swipeAnim.setValue(0);
      },
    }),
  ).current;

  const selectedVariant = variants[selectedVariantIndex];
  const images = selectedVariant?.images || [];
  const selectedImage = images[selectedImageIndex] || '';

  // Temporary selected variant based on temp options
  const [tempVariantIndex, setTempVariantIndex] =
    useState(selectedVariantIndex);

  // Dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    // Container styles
    container: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#334155' : '#E5E7EB',
    },
    placeholder: {
      height: 300,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
      borderRadius: 12,
    },
    placeholderText: {
      fontSize: 16,
      color: isDark ? '#CBD5E1' : '#6B7280',
    },

    // Main image container
    mainImageContainer: {
      width: width - 32,
      height: 300,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
      marginBottom: 16,
      overflow: 'hidden',
      position: 'relative',
    },
    imagePlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
    },

    // Thumbnails
    thumbnailsSection: {
      marginBottom: 16,
    },
    thumbnail: {
      width: 80,
      height: 80,
      marginHorizontal: 4,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'transparent',
      overflow: 'hidden',
    },
    selectedThumbnail: {
      borderColor: '#3B82F6',
    },

    // Color section
    colorSection: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 8,
    },
    colorText: {
      fontSize: 12,
      color: isDark ? '#E2E8F0' : '#374151',
      maxWidth: 60,
      textAlign: 'center',
    },

    // More options button
    moreOptionsButton: {
      backgroundColor: '#3B82F6',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    moreOptionsText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },

    // Modal styles
    modalContent: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
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
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
    },
    closeButton: {
      fontSize: 24,
      color: isDark ? '#CBD5E1' : '#6B7280',
      fontWeight: '300',
    },
    modalScroll: {
      padding: 20,
      paddingBottom: 30,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 12,
    },
    colorModalOption: {
      alignItems: 'center',
      padding: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#475569' : '#E5E7EB',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      width: 80,
    },
    selectedColorModalOption: {
      borderColor: '#3B82F6',
      backgroundColor: isDark ? '#1E40AF' : '#EFF6FF',
    },
    modalColorText: {
      fontSize: 12,
      color: isDark ? '#E2E8F0' : '#374151',
      textAlign: 'center',
    },
    textOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#475569' : '#D1D5DB',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    },
    selectedTextOption: {
      borderColor: '#3B82F6',
      backgroundColor: '#3B82F6',
    },
    textOptionText: {
      fontSize: 14,
      color: isDark ? '#E2E8F0' : '#374151',
      fontWeight: '500',
    },
    selectedTextOptionText: {
      color: '#FFFFFF',
    },
    selectedInfo: {
      marginTop: 20,
      padding: 16,
      backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    selectedInfoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 12,
    },
    selectedFieldName: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
    },
    selectedFieldValue: {
      fontSize: 14,
      color: isDark ? '#F1F5F9' : '#1F2937',
      fontWeight: '500',
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginBottom: 8,
    },
    previewImageWrapper: {
      width: 80,
      height: 80,
      marginRight: 8,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#475569' : '#E5E7EB',
    },
    imageCount: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#6B7280',
      marginTop: 4,
      fontStyle: 'italic',
    },
    videoText: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
      marginTop: 4,
    },
    priceText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? '#F1F5F9' : '#1F2937',
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? '#475569' : '#D1D5DB',
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#E2E8F0' : '#374151',
    },
    applyButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      backgroundColor: '#3B82F6',
      alignItems: 'center',
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    // Zoom modal styles
    zoomModalOverlay: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#000000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomCloseButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomImageContainer: {
      width: width,
      height: width,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
  });

  // Initialize options
  useEffect(() => {
    if (variants.length > 0) {
      const options: Record<string, string[]> = {};
      const selectedVars = variants[selectedVariantIndex];

      // Get all available options
      variants.forEach(variant => {
        variant.fields?.forEach(field => {
          if (!options[field.name]) {
            options[field.name] = [];
          }
          if (!options[field.name].includes(field.value)) {
            options[field.name].push(field.value);
          }
        });
      });

      setAvailableOptions(options);

      // Set selected options from current variant
      const currentOptions: Record<string, string> = {};
      selectedVars.fields?.forEach(field => {
        currentOptions[field.name] = field.value;
      });
      setTempSelectedOptions(currentOptions);
    }
  }, [variants, selectedVariantIndex]);

  // Find variant based on selected options
  const findVariantByOptions = (options: Record<string, string>) => {
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const matches = variant.fields?.every(
        field => options[field.name] === field.value,
      );

      if (matches) {
        return i;
      }
    }

    return selectedVariantIndex; // Return current variant if no match
  };

  // Handle temporary option selection in modal
  const handleTempOptionSelect = (fieldName: string, value: string) => {
    const newOptions = {
      ...tempSelectedOptions,
      [fieldName]: value,
    };

    setTempSelectedOptions(newOptions);

    // Find matching variant for preview
    const variantIndex = findVariantByOptions(newOptions);
    setTempVariantIndex(variantIndex);
  };

  // Apply selected options
  const handleApplySelection = () => {
    const variantIndex = findVariantByOptions(tempSelectedOptions);

    // Update main state
    setSelectedVariantIndex(variantIndex);
    setSelectedImageIndex(0); // Reset to first image

    // Notify parent
    if (onVariantChange) {
      onVariantChange(variantIndex);
    }

    // Close modal
    setShowVariantModal(false);
  };

  // Handle quick color selection (outside modal)
  const handleQuickColorSelect = (fieldName: string, value: string) => {
    const newOptions = {
      ...tempSelectedOptions,
      [fieldName]: value,
    };

    const variantIndex = findVariantByOptions(newOptions);

    setTempSelectedOptions(newOptions);
    setSelectedVariantIndex(variantIndex);
    setSelectedImageIndex(0);

    if (onVariantChange) {
      onVariantChange(variantIndex);
    }
  };

  // Get color for color buttons
  const getColorValue = (colorName: string): string => {
    const lowerColor = colorName.toLowerCase();
    return colorMap[lowerColor] || '#E5E7EB'; // Default gray
  };

  // Check if it's a color field
  const isColorField = (fieldName: string) => {
    const lowerField = fieldName.toLowerCase();
    return lowerField.includes('color') || lowerField.includes('colour');
  };

  // Group fields by type
  const colorFields = Object.keys(availableOptions).filter(isColorField);
  const otherFields = Object.keys(availableOptions).filter(
    field => !isColorField(field),
  );

  // Get temporary variant for preview
  const tempVariant = variants[tempVariantIndex];

  // Handle image zoom
  const handleImageZoom = (image: string) => {
    setZoomImage(image);
    setShowZoomModal(true);
  };

  // Handle zoom modal image change
  const handleZoomImageChange = (direction: 'left' | 'right') => {
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
  };

  if (variants.length === 0) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.placeholder}>
          <Text style={dynamicStyles.placeholderText}>No Images Available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Main Image with Swipe and Zoom */}
      <View style={dynamicStyles.mainImageContainer}>
        <Animated.View
          style={{
            transform: [{ translateX: swipeAnim }, { scale: scaleAnim }],
          }}
          {...panResponder.panHandlers}
        >
          {selectedImage ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleImageZoom(selectedImage)}
            >
              <Image
                source={{ uri: selectedImage }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : (
            <View style={dynamicStyles.imagePlaceholder}>
              <Text style={dynamicStyles.placeholderText}>No Image</Text>
            </View>
          )}
        </Animated.View>

        {/* Zoom Icon */}
        {selectedImage && (
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleImageZoom(selectedImage)}
          >
            <Icon name="zoom-in" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Swipe Instructions */}
        {images.length > 1 && (
          <View style={styles.swipeInstruction}>
            <Icon name="swipe" size={16} color="#FFFFFF" />
            <Text style={styles.swipeInstructionText}>
              Swipe to see more images
            </Text>
          </View>
        )}

        {/* Variant Indicator */}
        <TouchableOpacity
          style={styles.variantIndicator}
          onPress={() => {
            // Reset temp options to current selection when opening modal
            const currentOptions: Record<string, string> = {};
            selectedVariant.fields?.forEach(field => {
              currentOptions[field.name] = field.value;
            });
            setTempSelectedOptions(currentOptions);
            setTempVariantIndex(selectedVariantIndex);
            setShowVariantModal(true);
          }}
        >
          <Text style={styles.variantIndicatorText}>
            {selectedVariant.fields?.map(field => field.value).join(' • ')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Image Thumbnails */}
      {images.length > 1 && (
        <View style={dynamicStyles.thumbnailsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailsContainer}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  dynamicStyles.thumbnail,
                  selectedImageIndex === index &&
                    dynamicStyles.selectedThumbnail,
                ]}
                onPress={() => {
                  setSelectedImageIndex(index);
                }}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Color Selector - Quick Access */}
      {colorFields.length > 0 && (
        <View style={dynamicStyles.colorSection}>
          <Text style={dynamicStyles.sectionTitle}>Color</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorContainer}
          >
            {colorFields.map(fieldName => (
              <React.Fragment key={fieldName}>
                {availableOptions[fieldName].map(value => (
                  <TouchableOpacity
                    key={`${fieldName}-${value}`}
                    style={[
                      styles.colorOption,
                      tempSelectedOptions[fieldName] === value &&
                        styles.selectedColorOption,
                    ]}
                    onPress={() => handleQuickColorSelect(fieldName, value)}
                  >
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: getColorValue(value) },
                        tempSelectedOptions[fieldName] === value &&
                          styles.selectedColorCircle,
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

      {/* Other Options Button */}
      {(otherFields.length > 0 || colorFields.length > 1) && (
        <TouchableOpacity
          style={dynamicStyles.moreOptionsButton}
          onPress={() => {
            const currentOptions: Record<string, string> = {};
            selectedVariant.fields?.forEach(field => {
              currentOptions[field.name] = field.value;
            });
            setTempSelectedOptions(currentOptions);
            setTempVariantIndex(selectedVariantIndex);
            setShowVariantModal(true);
          }}
        >
          <Text style={dynamicStyles.moreOptionsText}>
            Select{' '}
            {otherFields.length > 0 ? 'Size & Other Options' : 'More Colors'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Variant Selection Modal */}
      <Modal
        visible={showVariantModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVariantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Select Variant</Text>
              <TouchableOpacity onPress={() => setShowVariantModal(false)}>
                <Text style={dynamicStyles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={dynamicStyles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Color Fields */}
              {colorFields.map(fieldName => (
                <View key={fieldName} style={styles.optionSection}>
                  <Text style={dynamicStyles.optionLabel}>{fieldName}</Text>
                  <View style={styles.optionGrid}>
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
                            styles.modalColorCircle,
                            { backgroundColor: getColorValue(value) },
                          ]}
                        />
                        <Text
                          style={dynamicStyles.modalColorText}
                          numberOfLines={1}
                        >
                          {value}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {/* Other Fields */}
              {otherFields.map(fieldName => (
                <View key={fieldName} style={styles.optionSection}>
                  <Text style={dynamicStyles.optionLabel}>{fieldName}</Text>
                  <View style={styles.optionGrid}>
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

              {/* Selected Variant Preview */}
              {tempVariant && (
                <View style={dynamicStyles.selectedInfo}>
                  <Text style={dynamicStyles.selectedInfoTitle}>
                    Selected Variant Preview:
                  </Text>
                  <View style={styles.selectedDetails}>
                    {tempVariant.fields?.map((field, index) => (
                      <View key={index} style={styles.selectedField}>
                        <Text style={dynamicStyles.selectedFieldName}>
                          {field.name}:
                        </Text>
                        <Text style={dynamicStyles.selectedFieldValue}>
                          {field.value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Preview Images */}
                  {tempVariant.images && tempVariant.images.length > 0 && (
                    <View style={styles.previewImagesContainer}>
                      <Text style={dynamicStyles.previewTitle}>
                        Preview Images:
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        {tempVariant.images.slice(0, 3).map((image, index) => (
                          <View
                            key={index}
                            style={dynamicStyles.previewImageWrapper}
                          >
                            <Image
                              source={{ uri: image }}
                              style={styles.previewImage}
                              resizeMode="cover"
                            />
                          </View>
                        ))}
                      </ScrollView>
                      <Text style={dynamicStyles.imageCount}>
                        {tempVariant.images.length} image
                        {tempVariant.images.length > 1 ? 's' : ''} available
                      </Text>
                    </View>
                  )}

                  {/* Video Preview */}
                  {tempVariant.video && (
                    <View style={styles.videoPreview}>
                      <Text style={dynamicStyles.previewTitle}>
                        Video Available
                      </Text>
                      <View style={styles.videoIcon}>
                        <Text style={styles.videoIconText}>▶</Text>
                      </View>
                      <Text style={dynamicStyles.videoText}>
                        This variant includes a video
                      </Text>
                    </View>
                  )}

                  {/* Stock Status */}
                  {tempVariant.stock !== undefined && (
                    <Text
                      style={[
                        styles.stockText,
                        tempVariant.stock > 0
                          ? styles.inStock
                          : styles.outOfStock,
                      ]}
                    >
                      {tempVariant.stock > 0
                        ? `In Stock (${tempVariant.stock} available)`
                        : 'Out of Stock'}
                    </Text>
                  )}

                  {/* Price */}
                  {tempVariant.price !== undefined && (
                    <Text style={dynamicStyles.priceText}>
                      Price: ₹{tempVariant.price}
                    </Text>
                  )}
                </View>
              )}

              {/* Apply Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={dynamicStyles.cancelButton}
                  onPress={() => setShowVariantModal(false)}
                >
                  <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={dynamicStyles.applyButton}
                  onPress={handleApplySelection}
                >
                  <Text style={dynamicStyles.applyButtonText}>
                    Apply Selection
                  </Text>
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
        transparent={true}
        onRequestClose={() => setShowZoomModal(false)}
      >
        <View style={dynamicStyles.zoomModalOverlay}>
          {/* Close Button */}
          <TouchableOpacity
            style={dynamicStyles.zoomCloseButton}
            onPress={() => setShowZoomModal(false)}
          >
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Image with Swipe */}
          <View style={styles.zoomContainer}>
            {/* Left Arrow */}
            {selectedImageIndex > 0 && (
              <TouchableOpacity
                style={styles.zoomArrowLeft}
                onPress={() => handleZoomImageChange('left')}
              >
                <Icon name="chevron-left" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Image */}
            <TouchableOpacity
              activeOpacity={1}
              style={dynamicStyles.zoomImageContainer}
              onPress={() => setShowZoomModal(false)}
            >
              <Image
                source={{ uri: zoomImage }}
                style={dynamicStyles.zoomImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Right Arrow */}
            {selectedImageIndex < images.length - 1 && (
              <TouchableOpacity
                style={styles.zoomArrowRight}
                onPress={() => handleZoomImageChange('right')}
              >
                <Icon name="chevron-right" size={30} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {selectedImageIndex + 1} / {images.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Static styles (no theme dependency)
  mainImage: {
    width: '100%',
    height: '100%',
  },
  variantIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  variantIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  zoomButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeInstruction: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  swipeInstructionText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 6,
  },
  thumbnailsContainer: {
    paddingHorizontal: 8,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  colorContainer: {
    paddingRight: 16,
  },
  colorOption: {
    alignItems: 'center',
    marginRight: 12,
  },
  selectedColorOption: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  selectedColorCircle: {
    borderColor: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionSection: {
    marginBottom: 24,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalColorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  selectedDetails: {
    gap: 8,
    marginBottom: 16,
  },
  selectedField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewImagesContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  videoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  videoIconText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  inStock: {
    color: '#059669',
  },
  outOfStock: {
    color: '#DC2626',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },

  // Zoom modal static styles
  zoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  zoomArrowLeft: {
    position: 'absolute',
    left: 20,
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
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
