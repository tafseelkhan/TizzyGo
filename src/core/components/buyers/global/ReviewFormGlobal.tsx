// components/ReviewForm.tsx - NO EMOJIS, ONLY ICONS

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  launchImageLibrary,
  ImageLibraryOptions,
  ImagePickerResponse,
  launchCamera,
  CameraOptions,
} from 'react-native-image-picker';
import { useTheme } from '../../../contexts/theme/ThemeContext';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

interface ReviewFormProps {
  handleSubmit: (formData: any, reviewId?: string) => void;
  handleCancel: () => void;
  loadingSubmit: boolean;
  productId: string;
}

const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  border: '#E2E8F0',
  primary: '#6366F1',
  secondary: '#64748B',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  muted: '#94A3B8',
};

const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  border: '#334155',
  primary: '#818CF8',
  secondary: '#94A3B8',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  muted: '#64748B',
};

const StarRating = ({
  rating,
  onRatingChange,
  disabled = false,
  size = 32,
}: {
  rating: number | null;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
  size?: number;
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          onPress={() => !disabled && onRatingChange(star)}
          disabled={disabled}
          style={styles.starTouch}
        >
          <Text
            style={{
              fontSize: size,
              color: rating && star <= rating ? '#F59E0B' : colors.border,
            }}
          >
            {rating && star <= rating ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function ReviewForm({
  handleSubmit,
  handleCancel,
  loadingSubmit,
  productId,
}: ReviewFormProps) {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageBase64, setImageBase64] = useState<string[]>([]);
  const [openConfirmSubmit, setOpenConfirmSubmit] = useState(false);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);

  // Permission functions...
  const checkPhotoPermission = async (): Promise<boolean> => {
    try {
      let permission;
      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
        const androidVersion =
          typeof Platform.Version === 'string'
            ? parseInt(Platform.Version, 10)
            : Platform.Version;
        if (androidVersion >= 33) {
          permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }
      }
      const result = await check(permission);
      if (result === RESULTS.GRANTED) return true;
      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }
      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Please enable photo library access in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }
      return false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  };

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;
      const result = await check(permission);
      if (result === RESULTS.GRANTED) return true;
      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }
      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Please enable camera access in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }
      return false;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  };

  const handleImagePick = () => setShowImagePickerOptions(true);

  const pickFromGallery = async () => {
    setShowImagePickerOptions(false);
    const hasPermission = await checkPhotoPermission();
    if (!hasPermission) return;

    try {
      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        selectionLimit: 5 - images.length,
        quality: 0.8,
        includeBase64: true,
      };

      launchImageLibrary(options, (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert(
            'Error',
            response.errorMessage || 'Failed to pick images',
          );
          return;
        }
        if (!response.assets || response.assets.length === 0) return;

        const availableSlots = 5 - images.length;
        if (availableSlots <= 0) {
          Alert.alert('Limit Reached', 'Maximum 5 images allowed');
          return;
        }

        const newAssets = response.assets.slice(0, availableSlots);
        const newImageUris = newAssets
          .map(asset => asset.uri)
          .filter((uri): uri is string => uri !== undefined && uri !== null);
        const newBase64Images = newAssets
          .map(asset => asset.base64)
          .filter(
            (base64): base64 is string =>
              base64 !== undefined && base64 !== null,
          );

        if (newImageUris.length > 0) {
          setImages([...images, ...newImageUris]);
          setImageBase64([...imageBase64, ...newBase64Images]);
        }
      });
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takeFromCamera = async () => {
    setShowImagePickerOptions(false);
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) return;

    try {
      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
        saveToPhotos: true,
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to take photo');
          return;
        }
        if (!response.assets || response.assets.length === 0) return;

        const availableSlots = 5 - images.length;
        if (availableSlots <= 0) {
          Alert.alert('Limit Reached', 'Maximum 5 images allowed');
          return;
        }

        const newAsset = response.assets[0];
        if (newAsset.uri && newAsset.base64) {
          setImages([...images, newAsset.uri]);
          setImageBase64([...imageBase64, newAsset.base64]);
        }
      });
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleDeleteNewImage = (index: number) => {
    const newList = [...images];
    const newBase64List = [...imageBase64];
    newList.splice(index, 1);
    newBase64List.splice(index, 1);
    setImages(newList);
    setImageBase64(newBase64List);
  };

  const handleFormSubmit = async () => {
    if (!rating) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    const submitData = {
      productId: productId,
      rating: rating,
      review: reviewText || '',
      images: imageBase64
        .filter(base64 => base64 && base64.trim() !== '')
        .map(base64 => `data:image/jpeg;base64,${base64}`),
    };

    handleSubmit(submitData);
    setOpenConfirmSubmit(false);
  };

  const resetForm = () => {
    setRating(null);
    setReviewText('');
    setImages([]);
    setImageBase64([]);
  };

  // Image picker modal
  const ImagePickerModal = () => (
    <Modal
      visible={showImagePickerOptions}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowImagePickerOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.pickerModalContent, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.pickerModalTitle, { color: colors.text }]}>
            Add Photos
          </Text>

          <TouchableOpacity
            onPress={pickFromGallery}
            style={[styles.pickerOption, { borderBottomColor: colors.border }]}
          >
            <View
              style={[
                styles.pickerIcon,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Icon name="images" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.pickerOptionText, { color: colors.text }]}>
              Choose from Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={takeFromCamera}
            style={[styles.pickerOption, { borderBottomColor: colors.border }]}
          >
            <View
              style={[
                styles.pickerIcon,
                { backgroundColor: colors.success + '20' },
              ]}
            >
              <Icon name="camera" size={24} color={colors.success} />
            </View>
            <Text style={[styles.pickerOptionText, { color: colors.text }]}>
              Take a Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowImagePickerOptions(false)}
            style={styles.pickerCancelButton}
          >
            <Text style={[styles.pickerCancelText, { color: colors.error }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        {/* ✅ FIX: Removed emoji, using icon with text */}
        <View style={styles.titleContainer}>
          <MaterialIcon name="rate-review" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Write a Review
          </Text>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Your Rating
          </Text>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            disabled={loadingSubmit}
            size={32}
          />
          {!rating && (
            <View style={styles.errorContainer}>
              <Icon name="warning-outline" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                Please select a rating
              </Text>
            </View>
          )}
        </View>

        {/* Review Text */}
        <View style={styles.textInputWrapper}>
          <TextInput
            placeholder="What do you think about this product?"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
            style={[
              styles.textInput,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.background,
              },
            ]}
            value={reviewText}
            onChangeText={setReviewText}
            editable={!loadingSubmit}
          />
        </View>

        {/* Images */}
        <View style={styles.section}>
          {/* ✅ FIX: Removed emoji, using icon with text */}
          <View style={styles.imageLabelContainer}>
            <Icon name="camera-outline" size={18} color={colors.text} />
            <Text style={[styles.imageLabel, { color: colors.text }]}>
              Add Photos (Optional)
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image
                    source={{ uri }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={[
                      styles.deleteImageButton,
                      { backgroundColor: colors.error },
                    ]}
                    onPress={() => handleDeleteNewImage(index)}
                  >
                    <Icon name="close" size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                onPress={handleImagePick}
                disabled={images.length >= 5 || loadingSubmit}
                style={[
                  styles.uploadButton,
                  {
                    borderColor:
                      images.length >= 5 ? colors.border : colors.primary,
                    opacity: images.length >= 5 || loadingSubmit ? 0.5 : 1,
                  },
                ]}
              >
                <MaterialIcon
                  name="cloud-upload"
                  size={28}
                  color={images.length >= 5 ? colors.border : colors.primary}
                />
                <Text
                  style={[
                    styles.uploadText,
                    {
                      color:
                        images.length >= 5 ? colors.border : colors.primary,
                    },
                  ]}
                >
                  Upload
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <Text style={[styles.imageCount, { color: colors.muted }]}>
            {images.length} of 5 images
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              handleCancel();
            }}
            disabled={loadingSubmit}
            style={[
              styles.cancelButton,
              {
                borderColor: colors.border,
                opacity: loadingSubmit ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!rating) {
                Alert.alert('Rating Required', 'Please select a star rating.');
                return;
              }
              setOpenConfirmSubmit(true);
            }}
            disabled={loadingSubmit}
            style={[
              styles.submitButton,
              {
                backgroundColor: loadingSubmit ? colors.border : colors.primary,
                opacity: loadingSubmit ? 0.5 : 1,
              },
            ]}
          >
            {loadingSubmit ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Post Review</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Confirm Modal */}
        <Modal
          visible={openConfirmSubmit}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setOpenConfirmSubmit(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.confirmModalContent,
                { backgroundColor: colors.card },
              ]}
            >
              <Text style={[styles.confirmTitle, { color: colors.text }]}>
                Confirm Submission
              </Text>

              <View style={styles.confirmSection}>
                <Text style={[styles.confirmLabel, { color: colors.text }]}>
                  Rating
                </Text>
                <StarRating
                  rating={rating}
                  onRatingChange={() => {}}
                  disabled={true}
                  size={24}
                />
              </View>

              {reviewText && (
                <View style={styles.confirmSection}>
                  <Text style={[styles.confirmLabel, { color: colors.text }]}>
                    Review
                  </Text>
                  <Text style={[styles.confirmText, { color: colors.muted }]}>
                    {reviewText.substring(0, 150)}
                    {reviewText.length > 150 ? '...' : ''}
                  </Text>
                </View>
              )}

              {images.length > 0 && (
                <View style={styles.confirmSection}>
                  <Text style={[styles.confirmLabel, { color: colors.text }]}>
                    Photos ({images.length})
                  </Text>
                </View>
              )}

              <View style={styles.confirmButtonRow}>
                <TouchableOpacity
                  onPress={() => setOpenConfirmSubmit(false)}
                  style={[
                    styles.confirmCancelButton,
                    { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.confirmCancelText, { color: colors.text }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleFormSubmit}
                  style={[
                    styles.confirmSubmitButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.confirmSubmitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <ImagePickerModal />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
  },
  starTouch: {
    padding: 2,
  },
  textInputWrapper: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 16,
    minHeight: 100,
  },
  imageLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: 80,
    height: 80,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 12,
    padding: 4,
  },
  uploadButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  imageCount: {
    fontSize: 12,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerModalContent: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  pickerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalContent: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmSection: {
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  confirmText: {
    fontSize: 14,
    lineHeight: 20,
  },
  confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmSubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
