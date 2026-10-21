import React from 'react';

export interface ProductAlbumGalleryProps {
  product: {
    title: string;
    images?: string[];
    image?: string;
  };
  thumbnailSize?: number | string;
  className?: string;
  onSelectImage?: (imgUrl: string, index: number) => void;
}

/**
 * Reusable Product Album Gallery component.
 * Displays a horizontally scrollable strip of product thumbnails if multiple images exist,
 * with lazy loading, async decoding, and fallback to the main single image.
 */
export const ProductAlbumGallery: React.FC<ProductAlbumGalleryProps> = ({
  product,
  thumbnailSize = 80,
  className = '',
  onSelectImage
}) => {
  const sizeStyle = typeof thumbnailSize === 'number' ? `${thumbnailSize}px` : thumbnailSize;

  if (product.images && product.images.length > 0) {
    return (
      <div 
        className={`product-gallery ${className}`} 
        style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}
      >
        {product.images.map((imgUrl, index) => (
          <img 
            key={index} 
            src={imgUrl} 
            alt={`${product.title} - صورة ألبوم ${index + 1} | متجر ROZA BEAUTY DZ الجزائر`} 
            width={typeof thumbnailSize === 'number' ? thumbnailSize : 80}
            height={typeof thumbnailSize === 'number' ? thumbnailSize : 80}
            className="gallery-thumbnail hover:scale-105 transition-transform cursor-pointer shrink-0"
            style={{ width: sizeStyle, height: sizeStyle, objectFit: 'cover', borderRadius: '4px' }}
            loading="eager"
            decoding="async"
            onClick={() => onSelectImage?.(imgUrl, index)}
          />
        ))}
      </div>
    );
  }

  return (
    <img 
      src={product.image || ''} 
      alt={`${product.title} - الصورة الرسمية | متجر ROZA BEAUTY DZ الجزائر`} 
      width={typeof thumbnailSize === 'number' ? thumbnailSize : 80}
      height={typeof thumbnailSize === 'number' ? thumbnailSize : 80}
      loading="eager" 
      decoding="async"
      style={{ width: sizeStyle, height: sizeStyle, objectFit: 'cover', borderRadius: '4px' }}
      className={`gallery-thumbnail ${className}`}
    />
  );
};

export default ProductAlbumGallery;
