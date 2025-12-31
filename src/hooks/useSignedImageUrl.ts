import { useState, useEffect } from 'react';
import { getSignedUrl, extractFilePath } from '@/utils/storageUtils';

/**
 * Hook to resolve a storage URL to a signed URL for private buckets
 * Returns the original URL if it's already a signed URL or from a public bucket
 */
export function useSignedImageUrl(
  bucket: 'avatars' | 'opponent-avatars',
  imageUrl: string | null | undefined
): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setSignedUrl(null);
      return;
    }

    // Check if it's already a signed URL (contains token parameter)
    if (imageUrl.includes('token=')) {
      setSignedUrl(imageUrl);
      return;
    }

    // Check if it's a data URL (local preview)
    if (imageUrl.startsWith('data:')) {
      setSignedUrl(imageUrl);
      return;
    }

    // Extract file path and get signed URL
    const filePath = extractFilePath(bucket, imageUrl);
    if (!filePath) {
      // If we can't extract path, use original URL (might be external)
      setSignedUrl(imageUrl);
      return;
    }

    let isMounted = true;

    getSignedUrl(bucket, filePath).then((url) => {
      if (isMounted) {
        setSignedUrl(url || imageUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [bucket, imageUrl]);

  return signedUrl;
}

/**
 * Batch resolve multiple image URLs to signed URLs
 * Useful for lists of opponents or profiles
 */
export async function resolveSignedUrls(
  bucket: 'avatars' | 'opponent-avatars',
  imageUrls: (string | null | undefined)[]
): Promise<(string | null)[]> {
  const results = await Promise.all(
    imageUrls.map(async (url) => {
      if (!url) return null;
      
      // Already signed or data URL
      if (url.includes('token=') || url.startsWith('data:')) {
        return url;
      }

      const filePath = extractFilePath(bucket, url);
      if (!filePath) return url;

      const signedUrl = await getSignedUrl(bucket, filePath);
      return signedUrl || url;
    })
  );

  return results;
}
