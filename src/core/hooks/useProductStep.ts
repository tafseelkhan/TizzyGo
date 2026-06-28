// hooks/useProductStep.ts

import { useState, useEffect, useCallback } from 'react';
import {
  fetchProduct,
  Product,
} from '../../api/features/private/productStepPrivateSlice';

interface UseProductProps {
  productId: string | null;
  variantId?: string | null;
  initialData?: Product | null;
  autoFetch?: boolean;
}

interface UseProductReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  fetchProductData: () => Promise<void>;
  onRefresh: () => void;
  setProduct: React.Dispatch<React.SetStateAction<Product | null>>;
}

export const useProduct = ({
  productId,
  variantId = null,
  initialData = null,
  autoFetch = true,
}: UseProductProps): UseProductReturn => {
  const [product, setProduct] = useState<Product | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchProductData = useCallback(async () => {
    if (!productId) {
      setError('Product ID missing');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // ✅ fetchProduct already returns merged product with selectedVariant
      const mergedProduct = await fetchProduct(productId, variantId ?? '');

      console.log('✅ Product fetched:', {
        id: mergedProduct._id,
        title: mergedProduct.title,
        hasSelectedVariant: !!mergedProduct.selectedVariant,
        selectedVariantId: mergedProduct.selectedVariant?.variantId,
      });

      setProduct(mergedProduct);
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError(err.message || 'Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId, variantId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProductData();
  }, [fetchProductData]);

  useEffect(() => {
    if (autoFetch) {
      fetchProductData();
    }
  }, [fetchProductData, autoFetch]);

  return {
    product,
    loading,
    error,
    refreshing,
    fetchProductData,
    onRefresh,
    setProduct,
  };
};
