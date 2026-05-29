// utils/permissionUtils.ts
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

export const checkAndroidPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const cameraPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    const storagePermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );

    const androidVersion = typeof Platform.Version === 'string'
      ? parseInt(Platform.Version, 10)
      : Platform.Version;

    if (androidVersion >= 33) {
      const mediaPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      );
      if (!cameraPermission || !mediaPermission) {
        return await requestAndroidPermissions();
      }
    } else {
      if (!cameraPermission || !storagePermission) {
        return await requestAndroidPermissions();
      }
    }
    return true;
  } catch (err) {
    console.warn('Permission check error:', err);
    return false;
  }
};

export const requestAndroidPermissions = async (): Promise<boolean> => {
  try {
    const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.CAMERA];

    const androidVersion = typeof Platform.Version === 'string'
      ? parseInt(Platform.Version, 10)
      : Platform.Version;

    if (androidVersion >= 33) {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
    } else {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    }

    const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);

    const allGranted = Object.values(granted).every(
      status => status === PermissionsAndroid.RESULTS.GRANTED,
    );

    if (!allGranted) {
      Alert.alert(
        'Permission Required',
        'Camera and storage permissions are needed to upload photos. Please grant them in settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
};

export const showImageSourceDialog = (
  onCamera: () => void,
  onGallery: () => void
) => {
  Alert.alert(
    'Select Image Source',
    'Choose where to get your profile photo from',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: onCamera, style: 'default' },
      { text: 'Gallery', onPress: onGallery, style: 'default' },
    ],
    { cancelable: true },
  );
};