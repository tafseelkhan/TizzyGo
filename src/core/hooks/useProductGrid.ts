// hooks/useProductGrid.ts - FINAL FIXED VERSION
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Product } from '../utils/home/productGridUtils';
import { ProductGridService } from '../services/buyers/home/productGridService';
import {
  getPaginatedProducts,
  splitIntoColumns,
  getRandomProducts,
  generatePageNumbers,
} from '../utils/home/productGridUtils';

interface UseProductGridProps {
  products: Product[];
  isLoading: boolean;
  onRefresh?: () => void;
  refreshTrigger?: boolean;
}

interface UseProductGridReturn {
  currentPage: number;
  refreshing: boolean;
  localProducts: Product[];
  currentProducts: Product[];
  column1: Product[];
  column2: Product[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
  horizontalProducts: Product[];
  premiumPicks: Product[];
  fastestSellingProduct: Product | null;
  handleRefresh: () => Promise<void>;
  handlePageChange: (page: number) => void;
  generatePageNumbers: () => (number | string)[];
  isLoading: boolean;
  isRefreshing: boolean;
}

export const useProductGrid = ({
  products,
  isLoading: externalLoading,
  onRefresh,
  refreshTrigger = false,
}: UseProductGridProps): UseProductGridReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Initialize with empty array
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  const prevProductsRef = useRef<Product[]>([]);
  const isInitialMount = useRef(true);
  const isUpdatingRef = useRef(false);

  // ✅ ONLY update when product IDs actually change
  useEffect(() => {
    if (isUpdatingRef.current) return;

    // ✅ Get current product IDs
    const currentIds = products
      .map(p => p.productId || p.fullProduct?._id)
      .filter(Boolean);
    const prevIds = prevProductsRef.current
      .map(p => p.productId || p.fullProduct?._id)
      .filter(Boolean);

    // ✅ Compare IDs, NOT entire objects
    const hasChanged =
      currentIds.length !== prevIds.length ||
      currentIds.some((id, index) => id !== prevIds[index]);

    if (hasChanged && currentIds.length > 0) {
      console.log('🔄 Products changed (by ID), updating localProducts');
      isUpdatingRef.current = true;
      setLocalProducts(products);
      setCurrentPage(1);
      prevProductsRef.current = products;
      isUpdatingRef.current = false;
    } else if (products.length === 0 && prevProductsRef.current.length > 0) {
      // ✅ Handle empty products case
      console.log('🔄 Products became empty');
      setLocalProducts([]);
      prevProductsRef.current = [];
    }
  }, [products]);

  // ✅ Handle refresh trigger from parent
  useEffect(() => {
    if (refreshTrigger && !isInitialMount.current) {
      handleRefresh();
    }
    isInitialMount.current = false;
  }, [refreshTrigger]);

  // ✅ Memoize paginated data
  const itemsPerPage = 20;
  const paginatedData = useMemo(() => {
    return getPaginatedProducts(localProducts, currentPage, itemsPerPage);
  }, [localProducts, currentPage]);

  const { currentProducts, startIndex, endIndex, totalPages } = paginatedData;

  // ✅ Memoize columns with stable keys
  const { column1, column2 } = useMemo(() => {
    const result = splitIntoColumns(currentProducts);
    return {
      column1: result.column1.map(p => ({
        ...p,
        _stableKey:
          p.productId || p.fullProduct?._id || Math.random().toString(),
      })),
      column2: result.column2.map(p => ({
        ...p,
        _stableKey:
          p.productId || p.fullProduct?._id || Math.random().toString(),
      })),
    };
  }, [currentProducts]);

  // ✅ Memoize section data
  const horizontalProducts = useMemo(() => {
    return getRandomProducts(localProducts, 10);
  }, [localProducts]);

  const premiumPicks = useMemo(() => {
    return getRandomProducts(localProducts, 4);
  }, [localProducts]);

  const fastestSellingProduct = useMemo(() => {
    if (localProducts.length === 0) return null;
    return ProductGridService.getFastestSellingProduct(localProducts);
  }, [localProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  }, [onRefresh]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const getPageNumbers = useCallback(() => {
    return generatePageNumbers(currentPage, totalPages);
  }, [currentPage, totalPages]);

  return {
    currentPage,
    refreshing,
    localProducts,
    currentProducts,
    column1,
    column2,
    totalPages,
    startIndex,
    endIndex,
    horizontalProducts,
    premiumPicks,
    fastestSellingProduct,
    handleRefresh,
    handlePageChange,
    generatePageNumbers: getPageNumbers,
    isLoading: externalLoading,
    isRefreshing: refreshing,
  };
};
