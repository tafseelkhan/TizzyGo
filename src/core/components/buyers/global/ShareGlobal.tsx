// components/ProductShare.tsx - API CALL WHEN USER CLICKS ANY APP

import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RNShare from 'react-native-share';
import { shareService } from '../../../../api/features/private/shareGlobalPrivateSlice';
import { shareMessages } from '../../../mappings/global/shareMessageGlobalMapping';

interface Props {
  productId: string;
  productTitle: string;
  category: string;
  productImage?: string;
  productPrice?: string;
}

type RootStackParamList = {
  [key: string]: any;
};

const ProductShare: React.FC<Props> = ({
  productId,
  productTitle,
  category,
  productImage,
  productPrice,
}) => {
  const [loading, setLoading] = useState(false);
  const shareInProgress = useRef(false);
  const apiCalledRef = useRef(false); // ✅ Track if API already called
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ✅ Create fallback text (only if needed)
  const createFallbackText = (title: string, url: string): string => {
    let text = `🌟 ${title}\n\n`;
    if (productPrice) {
      text += `💰 Price: ${productPrice}\n\n`;
    }
    text += `📱 Check out this amazing product on TizzyGo!\n\n`;
    text += `🔗 ${url}\n\n`;
    text += `#TizzyGo #Shopping #Deals`;
    return text;
  };

  // ✅ Main share function
  const handleShare = async () => {
    // Prevent multiple clicks
    if (loading || shareInProgress.current) return;

    console.log('📤 Share button clicked...');
    setLoading(true);
    shareInProgress.current = true;
    apiCalledRef.current = false;

    try {
      // ✅ Step 1: Validate product data
      if (!productId || !productTitle) {
        console.error('❌ Invalid product data:', { productId, productTitle });
        Alert.alert('Error', 'Product information is incomplete.');
        setLoading(false);
        shareInProgress.current = false;
        return;
      }

      // ✅ Step 2: Prepare share data with shareMessages
      const fallbackUrl = `https://tizzy.app/product/${productId}`;
      let shareUrl = fallbackUrl;
      let shareText = createFallbackText(productTitle, shareUrl);

      // ✅ Try to get shareMessages text (but don't block)
      try {
        // Get random share message
        const randomMessage = shareMessages.getRandomMessage(
          category || productTitle,
        );
        if (randomMessage) {
          shareText = `${randomMessage}\n\n${shareText}`;
          console.log('✅ Using shareMessages random message');
        }
      } catch (msgError) {
        console.warn('⚠️ Error getting share message:', msgError);
      }

      console.log('📤 Opening share dialog...');

      // ✅ Step 3: Open share dialog
      const shareOptions = {
        title: `Check out "${productTitle}" on TizzyGo!`,
        message: shareText,
        subject: productTitle || 'Check out this product!',
        url: shareUrl,
        ...(productImage && { urls: [productImage] }),
        ...(Platform.OS === 'android' && { dialogTitle: 'Share via' }),
        ...(Platform.OS === 'ios' && {
          excludedActivityTypes: [
            'com.apple.UIKit.activity.AddToReadingList',
            'com.apple.UIKit.activity.AssignToContact',
          ],
        }),
      };

      // ✅ Step 4: Open share dialog
      console.log('📤 Share dialog opened - waiting for user action...');

      // ✅ CRITICAL: On Android, when user clicks ANY app in share list,
      // the promise resolves immediately (without waiting for actual share)
      // So we can call API right after the dialog is opened

      if (Platform.OS === 'android') {
        // ✅ On Android: API call when dialog opens (user has selected an app)
        console.log('📤 Android: User selected an app from share list');

        // ✅ Call API immediately (user has already clicked an app)
        await callShareAPI();

        // ✅ Now open the share dialog
        try {
          const result = await RNShare.open(shareOptions);
          console.log('📤 Share result:', result);

          // Check if user actually completed share
          const didShare =
            result?.success === true ||
            result?.message?.includes('completed') ||
            result?.message?.includes('success');

          if (didShare) {
            console.log('✅ User completed share');
          } else {
            console.log('⚠️ Share cancelled after app selection');
          }
        } catch (shareError: any) {
          // User cancelled after app selection - API already called though
          if (
            shareError.message?.toLowerCase().includes('user cancelled') ||
            shareError.message?.toLowerCase().includes('dismissed')
          ) {
            console.log(
              '⚠️ User cancelled after app selection - API already called',
            );
            // Note: API was already called when user clicked the app
          } else {
            throw shareError;
          }
        }
      } else {
        // ✅ On iOS: Different behavior
        try {
          const result = await RNShare.open(shareOptions);
          console.log('📤 Share result:', result);

          // On iOS, result.success indicates user completed share
          if (result?.success === true) {
            console.log('✅ iOS: User completed share');
            await callShareAPI();
          } else {
            console.log('⚠️ iOS: Share cancelled');
          }
        } catch (shareError: any) {
          if (
            shareError.message?.toLowerCase().includes('user cancelled') ||
            shareError.message?.toLowerCase().includes('dismissed')
          ) {
            console.log('⚠️ iOS: User cancelled - NO API');
          } else {
            throw shareError;
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      shareInProgress.current = false;
      console.log('🏁 Share process completed');
    }
  };

  // ✅ Separate function for API call
  const callShareAPI = async () => {
    // Prevent duplicate API calls
    if (apiCalledRef.current) {
      console.log('⚠️ API already called, skipping');
      return;
    }

    apiCalledRef.current = true;
    console.log('📤 Calling Share API...');

    try {
      const shareData = await shareService.createShare(
        productId,
        'product',
        'all',
      );

      console.log('📤 API Response:', JSON.stringify(shareData, null, 2));

      if (shareData?.share?._id) {
        const shareId = shareData.share._id;
        console.log('✅ Share record created with ID:', shareId);

        // Build URL with share ID
        const backendUrl = shareService.buildShareUrl(productTitle, shareId);
        console.log('✅ Share URL with ID:', backendUrl);

        // Track share
        try {
          if (typeof (shareService as any).trackShare === 'function') {
            await (shareService as any).trackShare(shareId);
            console.log('✅ Share tracked successfully');
          }
        } catch (trackError) {
          console.warn('⚠️ Failed to track share:', trackError);
        }

        // ✅ Show success message
        Alert.alert('Success 🎉', 'Product shared successfully!', [
          { text: 'OK' },
        ]);
      } else {
        console.warn('⚠️ API returned invalid data');
      }
    } catch (apiError) {
      console.error('❌ API call failed:', apiError);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.iconWrap}
        onPress={handleShare}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#6366F1" />
        ) : (
          <Icon name="share-outline" size={26} color="#64748B" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    padding: 8,
    minWidth: 42,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductShare;
