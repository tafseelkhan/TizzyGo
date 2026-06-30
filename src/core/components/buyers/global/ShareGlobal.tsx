// components/ProductShare.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { shareService } from '../../../../api/features/private/shareGlobalPrivateSlice';
import { shareMessages } from '../../../Mappings/global/shareMessageGlobalMapping';

interface Props {
  productId: string;
  productTitle: string;
  category: string;
}

type RootStackParamList = {
  [key: string]: any;
};

const ProductShare: React.FC<Props> = ({
  productId,
  productTitle,
  category,
}) => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleShare = async () => {
    try {
      setLoading(true);

      // Step 1: Create share record in backend
      const shareData = await shareService.createShare(productId, 'product', 'all');
      
      if (!shareData) {
        return; // Error already handled in service
      }

      // Step 2: Build share URL
      const shareUrl = shareService.buildShareUrl(productTitle, shareData.share._id);

      // Step 3: Generate complete share text
      const shareText = shareMessages.getCompleteShareText(productTitle, shareUrl);

      // Step 4: Trigger native share
      await Share.share({
        message: shareText,
        title: `Check out "${productTitle}" on TizzyGo!`,
      });

    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share failed', 'Unable to share the product link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView>
      <TouchableOpacity
        style={styles.iconWrap}
        onPress={handleShare}
        disabled={loading}
      >
        <Icon name="share-outline" size={26} color={loading ? '#ccc' : 'gray'} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    padding: 8,
  },
});

export default ProductShare;