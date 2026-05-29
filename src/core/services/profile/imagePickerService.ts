// services/imagePickerService.ts
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { checkAndroidPermissions } from '../../utils/profile/permissionUtils';

export const imagePickerService = {
  async pickFromCamera(): Promise<{ uri: string; base64: string | null; type: string | null } | null> {
    const hasPermission = await checkAndroidPermissions();
    if (!hasPermission) return null;

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
      saveToPhotos: true,
    });

    return this.processImageResult(result);
  },

  async pickFromGallery(): Promise<{ uri: string; base64: string | null; type: string | null } | null> {
    const hasPermission = await checkAndroidPermissions();
    if (!hasPermission) return null;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
      selectionLimit: 1,
    });

    // Check file size (max 5MB)
    if (result.assets && result.assets[0] && result.assets[0].fileSize) {
      if (result.assets[0].fileSize > 5 * 1024 * 1024) {
        throw new Error('Image Too Large - Please select an image smaller than 5MB');
      }
    }

    return this.processImageResult(result);
  },

  processImageResult(result: ImagePickerResponse) {
    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      throw new Error(result.errorMessage || 'Failed to pick image');
    }

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const imageUri = asset.uri || '';
      const base64Data = asset.base64 || '';

      if (base64Data) {
        const imageData = `data:${asset.type || 'image/jpeg'};base64,${base64Data}`;
        return {
          uri: imageUri,
          base64: imageData,
          type: asset.type || null
        };
      } else if (imageUri) {
        return {
          uri: imageUri,
          base64: null,
          type: asset.type || null
        };
      }
    }

    return null;
  }
};