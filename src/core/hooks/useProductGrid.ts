// hooks/useProductGrid.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../utils/home/productGridUtils';
import { ProductGridService } from '../services/home/productGridService';
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
  // State
  currentPage: number;
  refreshing: boolean;
  localProducts: Product[];
  currentProducts: Product[];
  column1: Product[];
  column2: Product[];
  totalPages: number;
  startIndex: number;
  endIndex: number;

  // Section Data
  horizontalProducts: Product[];
  premiumPicks: Product[];
  fastestSellingProduct: Product | null;

  // Handlers
  handleRefresh: () => Promise<void>;
  handlePageChange: (page: number) => void;
  generatePageNumbers: () => (number | string)[];

  // Loading states
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
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  // Update local products when parent products change
  useEffect(() => {
    setLocalProducts(products);
    setCurrentPage(1);
  }, [products]);

  // Handle refresh trigger from parent
  useEffect(() => {
    if (refreshTrigger) {
      handleRefresh();
    }
  }, [refreshTrigger]);

  // Pagination
  const itemsPerPage = 20;
  const paginatedData = getPaginatedProducts(
    localProducts,
    currentPage,
    itemsPerPage,
  );
  const { currentProducts, startIndex, endIndex, totalPages } = paginatedData;

  // Split into columns for grid layout
  const { column1, column2 } = splitIntoColumns(currentProducts);

  // Section data
  const horizontalProducts = useMemo(
    () => getRandomProducts(localProducts, 10),
    [localProducts],
  );
  const premiumPicks = useMemo(
    () => getRandomProducts(localProducts, 4),
    [localProducts],
  );
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
    // State
    currentPage,
    refreshing,
    localProducts,
    currentProducts,
    column1,
    column2,
    totalPages,
    startIndex,
    endIndex,

    // Section Data
    horizontalProducts,
    premiumPicks,
    fastestSellingProduct,

    // Handlers
    handleRefresh,
    handlePageChange,
    generatePageNumbers: getPageNumbers,

    // Loading states
    isLoading: externalLoading,
    isRefreshing: refreshing,
  };
};
