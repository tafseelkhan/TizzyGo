// components/ReviewForm.tsx
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
  Linking, // ✅ Add Linking import
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  launchImageLibrary,
  ImageLibraryOptions,
  ImagePickerResponse,
  launchCamera,
  CameraOptions, // ✅ Import CameraOptions for camera specific options
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
  background: '#FFFFFF',
  card: '#F8F9FA',
  text: '#1E293B',
  border: '#E2E8F0',
  primary: '#3B82F6',
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
  primary: '#60A5FA',
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
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          onPress={() => !disabled && onRatingChange(star)}
          disabled={disabled}
        >
          <Text
            style={{
              fontSize: size,
              color: rating && star <= rating ? '#ffd700' : colors.border,
              marginRight: 4,
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

  // Permission check function
  const checkPhotoPermission = async (): Promise<boolean> => {
    try {
      let permission;
      
      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
        // For Android 13+ - Fix: Convert Platform.Version to number
        const androidVersion = typeof Platform.Version === 'string' 
          ? parseInt(Platform.Version, 10) 
          : Platform.Version;
          
        if (androidVersion >= 33) {
          permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }
      }

      const result = await check(permission);
      
      if (result === RESULTS.GRANTED) {
        return true;
      }
      
      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }
      
      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Please enable photo library access in settings to upload images.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
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
      let permission;
      
      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.CAMERA;
      } else {
        permission = PERMISSIONS.ANDROID.CAMERA;
      }

      const result = await check(permission);
      
      if (result === RESULTS.GRANTED) {
        return true;
      }
      
      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }
      
      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Please enable camera access in settings to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  };

  // Show image picker options (Gallery or Camera)
  const handleImagePick = () => {
    setShowImagePickerOptions(true);
  };

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
        if (response.didCancel) {
          console.log('User cancelled image picker');
          return;
        }

        if (response.errorCode) {
          console.log('ImagePicker Error Code: ', response.errorCode);
          Alert.alert('Error', response.errorMessage || 'Failed to pick images');
          return;
        }

        if (!response.assets || response.assets.length === 0) {
          console.log('No assets selected');
          return;
        }

        const availableSlots = 5 - images.length;
        if (availableSlots <= 0) {
          Alert.alert('Limit Reached', 'You can only upload up to 5 images');
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
      // ✅ Fix: Use CameraOptions instead of ImageLibraryOptions
      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
        saveToPhotos: true, // This works with CameraOptions
      };

      launchCamera(options, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled camera');
          return;
        }

        if (response.errorCode) {
          console.log('Camera Error Code: ', response.errorCode);
          Alert.alert('Error', response.errorMessage || 'Failed to take photo');
          return;
        }

        if (!response.assets || response.assets.length === 0) {
          console.log('No photo captured');
          return;
        }

        const availableSlots = 5 - images.length;
        if (availableSlots <= 0) {
          Alert.alert('Limit Reached', 'You can only upload up to 5 images');
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

    console.log('📦 Sending FINAL JSON data:', {
      productId: submitData.productId,
      rating: submitData.rating,
      review: submitData.review,
      imagesCount: submitData.images.length,
    });

    handleSubmit(submitData);
    setOpenConfirmSubmit(false);
  };

  const resetForm = () => {
    setRating(null);
    setReviewText('');
    setImages([]);
    setImageBase64([]);
  };

  // Image picker options modal
  const ImagePickerModal = () => (
    <Modal
      visible={showImagePickerOptions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePickerOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Choose Option
          </Text>
          
          <TouchableOpacity
            onPress={pickFromGallery}
            style={[
              styles.pickerOption,
              { borderBottomColor: colors.border }
            ]}
          >
            <Icon name="images" size={24} color={colors.primary} />
            <Text style={[styles.pickerOptionText, { color: colors.text }]}>
              Choose from Gallery
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={takeFromCamera}
            style={styles.pickerOption}
          >
            <Icon name="camera" size={24} color={colors.primary} />
            <Text style={[styles.pickerOptionText, { color: colors.text }]}>
              Take a Photo
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setShowImagePickerOptions(false)}
            style={[
              styles.pickerCancelButton,
              { borderTopColor: colors.border }
            ]}
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
        <Text style={[styles.title, { color: colors.text }]}>Add a Review</Text>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Your Rating</Text>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            disabled={loadingSubmit}
            size={28}
          />
          {!rating && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              * Please select a rating
            </Text>
          )}
        </View>

        {/* Review Text */}
        <TextInput
          placeholder="Write your review (optional)"
          placeholderTextColor={colors.text + '80'}
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

        {/* Images */}
        <View style={styles.section}>
          <Text style={[styles.imageLabel, { color: colors.text, opacity: 0.8 }]}>
            Images (Optional, max 5)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {/* New Images */}
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
                    <Icon name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Upload Button */}
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
                  size={24}
                  color={images.length >= 5 ? colors.border : colors.primary}
                />
                <Text
                  style={[
                    styles.uploadText,
                    {
                      color: images.length >= 5 ? colors.border : colors.primary,
                    },
                  ]}
                >
                  Upload {'\n'}(Max 5)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <Text style={[styles.imageCount, { color: colors.text, opacity: 0.8 }]}>
            {images.length} of 5 images selected
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
                borderColor: colors.primary,
                opacity: loadingSubmit ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[styles.cancelButtonText, { color: colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!rating) {
                Alert.alert(
                  'Rating Required',
                  'Please select a star rating before submitting.',
                );
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

        {/* Confirm Submit Modal */}
        <Modal
          visible={openConfirmSubmit}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setOpenConfirmSubmit(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Confirm Submission
              </Text>

              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.text }]}>
                  Rating:{' '}
                </Text>
                <StarRating
                  rating={rating}
                  onRatingChange={() => {}}
                  disabled={true}
                  size={20}
                />
                <Text style={[styles.modalText, { color: colors.text }]}>
                  {rating} stars
                </Text>
              </View>

              {reviewText && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.text }]}>
                    Review:
                  </Text>
                  <Text
                    style={[
                      styles.modalReviewText,
                      { color: colors.text, opacity: 0.8 },
                    ]}
                  >
                    {reviewText.substring(0, 100)}
                    {reviewText.length > 100 ? '...' : ''}
                  </Text>
                </View>
              )}

              {images.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: colors.text }]}>
                    Images: {images.length}
                  </Text>
                  <Text
                    style={[
                      styles.modalReviewText,
                      { color: colors.text, opacity: 0.8, fontSize: 12 },
                    ]}
                  >
                    (Base64 images will be uploaded)
                  </Text>
                </View>
              )}

              <Text style={[styles.modalConfirmText, { color: colors.text }]}>
                Are you sure you want to submit this review?
              </Text>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  onPress={() => setOpenConfirmSubmit(false)}
                  style={[
                    styles.modalCancelButton,
                    { borderColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalCancelButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleFormSubmit}
                  style={[
                    styles.modalSubmitButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.modalSubmitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      
      {/* Image Picker Options Modal */}
      <ImagePickerModal />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 16,
    minHeight: 100,
  },
  imageLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  imageContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  imageCount: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalText: {
    fontSize: 14,
    marginTop: 4,
  },
  modalReviewText: {
    fontSize: 14,
  },
  modalConfirmText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 8,
  },
  modalCancelButtonText: {
    fontSize: 16,
  },
  modalSubmitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalSubmitButtonText: {
    color: 'white',
    fontSize: 16,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  pickerCancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 8,
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});