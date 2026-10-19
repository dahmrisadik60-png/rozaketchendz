import fassilAlbumData from './fassil_products_album.json';
import fassilData from './fassilProducts.json';
import { BeautyProduct } from '../types';
import { transformToActiveProduct } from '../utils/productClassifier';

export interface RawFassilProduct {
  title: string;
  price: string;
  url: string;
  image?: string;
  images?: string[];
  category?: string;
}

export const FASSIL_RAW_PRODUCTS: RawFassilProduct[] = (
  fassilAlbumData && fassilAlbumData.length > 0 ? fassilAlbumData : fassilData
) as RawFassilProduct[];

export const FASSIL_STORE_PRODUCTS: BeautyProduct[] = FASSIL_RAW_PRODUCTS.map((item, idx) =>
  transformToActiveProduct(item, idx)
);
