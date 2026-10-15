/**
 * Client-side Image Compression Utility
 * Supports all image formats from phone (Android/iOS) and desktop.
 * Compresses images quickly with strict timeout guard so uploads NEVER hang.
 */

export async function compressImageToDataUrl(
  file: File,
  maxWidth = 850,
  quality = 0.82
): Promise<string> {
  // If SVG, read directly as data URL or text
  if (file.type.includes('svg')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    // 4-second safety timeout so it never hangs indefinitely on exotic mobile formats
    const safetyTimer = setTimeout(() => {
      console.warn('Image compression timed out, falling back to raw file reader');
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => resolve(fallbackReader.result as string);
      fallbackReader.onerror = () => resolve('');
      fallbackReader.readAsDataURL(file);
    }, 4000);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(safetyTimer);
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            clearTimeout(safetyTimer);
            return resolve(e.target?.result as string || '');
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try webp first, then fallback to jpeg
          try {
            const webpUrl = canvas.toDataURL('image/webp', quality);
            if (webpUrl && webpUrl.startsWith('data:image/webp')) {
              return resolve(webpUrl);
            }
          } catch {
            // fallback to jpeg
          }

          const jpegUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(jpegUrl);
        } catch (canvasErr) {
          console.warn('Canvas conversion failed, using original reader result:', canvasErr);
          resolve(e.target?.result as string || '');
        }
      };

      img.onerror = () => {
        clearTimeout(safetyTimer);
        console.warn('Image decode failed, returning raw data URL');
        resolve(e.target?.result as string || '');
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      clearTimeout(safetyTimer);
      resolve('');
    };

    reader.readAsDataURL(file);
  });
}

export async function compressImage(
  file: File,
  maxWidth = 850,
  quality = 0.82
): Promise<File> {
  // If not an image or is SVG/GIF, return as is
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  return new Promise((resolve) => {
    // 4-second safety timeout so it never hangs
    const safetyTimer = setTimeout(() => {
      console.warn('compressImage timed out, resolving original file');
      resolve(file);
    }, 4000);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        clearTimeout(safetyTimer);
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return resolve(file);
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }
              const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
              const compressedFile = new File([blob], cleanFileName, {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            'image/webp',
            quality
          );
        } catch {
          resolve(file);
        }
      };

      img.onerror = () => {
        clearTimeout(safetyTimer);
        resolve(file);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      clearTimeout(safetyTimer);
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}
