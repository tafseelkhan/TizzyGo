// types/cart.types.ts
export interface VariantField {
  name: string;
  value: string;
  price?: number;
  stock?: number;
  sku?: string;
  image?: string;
}

export interface ProductVariant {
  _id?: string;
  variantId?: string;
  mrp?: number;
  price?: number;
  savedAmount?: number;
  discount?: number;
  finalPrice?: number;
  fields?: VariantField[];
  images?: string[];
  video?: string;
  combinationKey?: string;
  inStock?: boolean;
  quantityAvailable?: number;
  sku?: string;
  isDefault?: boolean;
}

export interface SelectedVariant {
  variantId: string;
  _id?: string;
  mrp?: number;
  price?: number;
  savedAmount?: number;
  discount?: number;
  finalPrice?: number;
  variantImages?: string[];
  variantVideo?: string;
  variantImage?: string;
  variantSku?: string;
  [key: string]: any;
}

export interface CartItemParams {
  productId: string;
  productData?: any;
  quantity?: number;
  selectedVariant?: SelectedVariant | null;
}

export interface CartState {
  isInCart: boolean;
  quantity: number;
  isLoading: boolean;
  isAdding: boolean;
}

export interface AddToCartProps {
  productId: string;
  productData: any;
  initialIsInCart?: boolean;
  initialQuantity?: number;
  productLoading?: boolean;
  productAvailable?: boolean;
  maxQuantity?: number;
  style?: any;
  compact?: boolean;
  variants?: ProductVariant[];
  selectedVariant?: SelectedVariant | null;
  onVariantSelect?: (variant: SelectedVariant | null) => void;
  onAddToCartSuccess?: () => void;
}

export interface CartStatusResponse {
  inCart: boolean;
  quantity: number;
  selectedVariant?: SelectedVariant;
}
