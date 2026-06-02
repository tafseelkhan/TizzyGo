// hooks/useProduct.ts
import { useState, useEffect, useCallback } from 'react';
import { fetchProduct, Product } from '../../api/features/private/productByIdPrivateSlice';

interface UseProductProps {
  productId: string | null;
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
  initialData = null,
  autoFetch = true,
}: UseProductProps): UseProductReturn => {
  const [product, setProduct] = useState<Product | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchProductData = useCallback(async () => {
    if (!productId) {
      setError('Product ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchProduct(productId);
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProductData();
  }, [fetchProductData]);

  useEffect(() => {
    if (autoFetch && !initialData) {
      fetchProductData();
    }
  }, [autoFetch, fetchProductData, initialData]);

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