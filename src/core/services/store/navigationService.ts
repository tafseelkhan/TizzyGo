// services/navigationService.ts

import { NavigationProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

type Navigation = NavigationProp<any>;

export const handleGoBack = (navigation: Navigation) => {
  navigation.goBack();
};

export const handleGoHome = (navigation: Navigation) => {
  navigation.navigate('Home');
};

export const handleCategoryPress = (
  navigation: Navigation,
  category?: string,
) => {
  if (category) {
    navigation.navigate('CategoryProducts', { category });
  }
};

export const handleMorePress = (
  navigation: Navigation,
  productId?: string,
  productTitle?: string,
) => {
  if (productId) {
    navigation.navigate('ProductMore', {
      productId,
      productTitle: productTitle || 'Product Details',
    });
  } else {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Unable to load more details',
    });
  }
};
