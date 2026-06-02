// components/LikeComponent.tsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  fetchLikeStatusAPI,
  toggleLikeAPI,
} from '../../../api/features/private/likeGlobalPrivateSlice';
import { getToken } from '../../../api/connections/token/tokenSlice';

interface LikeComponentProps {
  productId?: string;
  size?: string;
}

type RootStackParamList = {
  Login: undefined;
  [key: string]: any;
};

const LikeComponent: React.FC<LikeComponentProps> = ({ productId }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleInvalidToken = async () => {
    console.warn('⚠️ Invalid token detected. Redirecting to login...');
    navigation.navigate('Login');
  };

  const fetchLikeStatus = async () => {
    if (!productId) return;

    const token = await getToken();
    if (!token) {
      setLiked(false);
      return;
    }

    try {
      const { liked: isLiked, count } = await fetchLikeStatusAPI(productId);
      setLiked(isLiked);
      setLikeCount(count);
    } catch (err: any) {
      console.error('Error fetching like status:', err.message);
      if (err.message.includes('Unauthorized')) {
        handleInvalidToken();
      }
    }
  };

  const toggleLike = async () => {
    if (!productId || isLoading) return;

    const token = await getToken();
    if (!token) {
      Alert.alert('Info', 'Please login to like products');
      navigation.navigate('Login');
      return;
    }

    console.log('🔁 Toggling like...');
    setIsLoading(true);

    try {
      const { liked: isLiked, count } = await toggleLikeAPI(productId);

      setLiked(isLiked);
      setLikeCount(count);

      console.log('✅ Like toggle result:', { liked: isLiked, count });
    } catch (err: any) {
      console.error('Error toggling like:', err.message);
      Alert.alert('Error', err.message || 'Failed to toggle like');

      if (err.message.includes('Unauthorized')) {
        handleInvalidToken();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchLikeStatus();
    }
  }, [productId]);

  return (
    <TouchableOpacity
      onPress={toggleLike}
      disabled={!productId || isLoading}
      style={[
        styles.container,
        {
          opacity: !productId ? 0.5 : isLoading ? 0.7 : 1,
        },
      ]}
      activeOpacity={0.7}
    >
      <Icon
        name={liked ? 'heart' : 'heart-outline'}
        size={20}
        color={liked ? 'red' : 'gray'}
        style={styles.icon}
      />
      <Text style={[styles.countText, { color: liked ? 'red' : '#333' }]}>
        {likeCount}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  icon: {
    marginRight: 8,
  },
  countText: {
    fontSize: 14,
  },
});

export default LikeComponent;
