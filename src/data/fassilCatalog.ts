import fassilData from './fassilProducts.json';
import { BeautyProduct } from '../types';
import { transformToActiveProduct } from '../utils/productClassifier';

export interface RawFassilProduct {
  title: string;
  price: string;
  url: string;
  image: string;
  category?: string;
}

export const FASSIL_RAW_PRODUCTS: RawFassilProduct[] = fassilData as RawFassilProduct[];

export const FASSIL_STORE_PRODUCTS: BeautyProduct[] = FASSIL_RAW_PRODUCTS.map((item, idx) =>
  transformToActiveProduct(item, idx)
);
