// components/LikeComponent.tsx
import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface LikeComponentProps {
  productId?: string;
  size?: string;
}

// Define navigation param types
type RootStackParamList = {
  login: undefined;
  [key: string]: any;
};

const LikeComponent: React.FC<LikeComponentProps> = ({ productId }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const handleInvalidToken = async () => {
    console.warn('⚠️ Invalid token detected. Redirecting to login...');
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
    navigation.navigate('Login');
  };

  const fetchLikeStatus = async () => {
    if (!productId) return;
    
    const token = await getAuthToken();
    if (!token) {
      setLiked(false);
      return;
    }

    try {
      const res = await fetch(`http://172.20.10.12:5000/api/likes/${productId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch like status: ${res.status}`);
      }

      const data = await res.json();
      setLiked(!!data.liked);
      setLikeCount(data.count || 0);
    } catch (err: any) {
      console.error('❌ Error fetching like status:', err.message);
    }
  };

  const toggleLike = async () => {
    if (!productId || isLoading) return;

    const token = await getAuthToken();
    if (!token) {
      Alert.alert('Info', 'Please login to like products');
      navigation.navigate('Login');
      return;
    }

    console.log('🔁 Toggling like...');

    setIsLoading(true);

    try {
      const res = await fetch('http://172.20.10.12:5000/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to toggle like');
      }

      const data = await res.json();
      console.log('✅ Like toggle result:', data);
      setLiked(data.liked);
      setLikeCount(data.count ?? (data.liked ? likeCount + 1 : Math.max(likeCount - 1, 0)));
      
    } catch (err: any) {
      console.error('❌ Error toggling like:', err.message);
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
        name={liked ? "heart" : "heart-outline"}
        size={20}
        color={liked ? 'red' : 'gray'}
        style={styles.icon}
      />
      <Text style={[
        styles.countText,
        { color: liked ? 'red' : '#333' }
      ]}>
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