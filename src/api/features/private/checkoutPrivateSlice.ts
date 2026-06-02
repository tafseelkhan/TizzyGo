import Config from 'react-native-config';
import { getToken } from '../../connections/token/tokenSlice';
import { fetchHandler } from '../../../core/utils/handler/fetchHandler';
import { API_ENDPOINTS } from '../../connections/snippet/apiEndpoints';

const API_BASE_URL = Config.API_AXIOS_BASE_URL;

// ================================
// TYPES
// ================================

export interface CalculationParams {
  mongoObjectId: string;
  quantity: number;
  vendorCodeUID: string;
  sellerId: string;
  displayProductId: string;
  isLocationUpdate?: boolean;
  sellerLat?: number;
  sellerLng?: number;
  sellerAddress?: string;
  buyerLat?: number;
  buyerLng?: number;
  buyerAddress?: string;
  buyerGooglePlaceId?: string;
  couponCode?: string;
}

export interface ProductFetchParams {
  productId: string;
}

// ================================
// TOKEN HELPER
// ================================

const getHeaders = async () => {
  const token = await getToken();

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// ================================
// 1. FETCH CALCULATED CHECKOUT DATA
// ================================
class CheckoutApi {
  fetchCalculatedDataAPI = async (params: CalculationParams) => {
    const urlParams = new URLSearchParams();

    urlParams.append('productId', params.mongoObjectId);
    urlParams.append('quantity', params.quantity.toString());
    urlParams.append('vendorCodeUID', params.vendorCodeUID);
    urlParams.append('sellerId', params.sellerId);
    urlParams.append('productDataId', params.displayProductId);

    if (params.isLocationUpdate) {
      urlParams.append('isLocationUpdate', 'true');
    }

    if (params.sellerLat && params.sellerLng) {
      urlParams.append('sellerLat', params.sellerLat.toString());
      urlParams.append('sellerLng', params.sellerLng.toString());
    }

    if (params.sellerAddress) {
      urlParams.append('sellerAddress', params.sellerAddress);
    }

    if (params.buyerLat && params.buyerLng) {
      urlParams.append('buyerLat', params.buyerLat.toString());
      urlParams.append('buyerLng', params.buyerLng.toString());
    }

    if (params.buyerAddress) {
      urlParams.append('buyerAddress', params.buyerAddress);
    }

    if (params.buyerGooglePlaceId) {
      urlParams.append('buyerGooglePlaceId', params.buyerGooglePlaceId);
    }

    if (params.couponCode) {
      urlParams.append('couponCode', params.couponCode);
    }

    const data = await fetchHandler(
      `${API_BASE_URL}/api/buyer/buy?${urlParams.toString()}`,
      {
        method: 'GET',
        headers: await getHeaders(),
      },
    );

    return data;
  };
}
export const checkoutApi = new CheckoutApi();
