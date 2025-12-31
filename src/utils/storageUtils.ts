import { supabase } from '@/integrations/supabase/client';

/**
 * Storage utility functions for handling private bucket access
 * Uses signed URLs for private buckets (avatars, opponent-avatars)
 * Uses public URLs for public buckets (tutorial_images)
 */

// Signed URL expiry time (1 hour in seconds)
const SIGNED_URL_EXPIRY = 3600;

// Cache for signed URLs to avoid regenerating too frequently
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Get a signed URL for a file in a private bucket
 * Uses caching to avoid excessive API calls
 */
export async function getSignedUrl(
  bucket: 'avatars' | 'opponent-avatars',
  filePath: string
): Promise<string | null> {
  if (!filePath) return null;
  
  const cacheKey = `${bucket}:${filePath}`;
  const cached = signedUrlCache.get(cacheKey);
  
  // Return cached URL if still valid (with 5 minute buffer)
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.url;
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);
    
    if (error) {
      console.error(`Error creating signed URL for ${bucket}/${filePath}:`, error);
      return null;
    }
    
    // Cache the signed URL
    signedUrlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt: Date.now() + SIGNED_URL_EXPIRY * 1000,
    });
    
    return data.signedUrl;
  } catch (err) {
    console.error(`Failed to get signed URL for ${bucket}/${filePath}:`, err);
    return null;
  }
}

/**
 * Extract the file path from a storage URL
 * Works with both public URLs and signed URLs
 */
export function extractFilePath(
  bucket: 'avatars' | 'opponent-avatars' | 'tutorial_images',
  url: string | null | undefined
): string | null {
  if (!url) return null;
  
  try {
    // Handle both formats:
    // - Public: https://xxx.supabase.co/storage/v1/object/public/bucket/path
    // - Signed: https://xxx.supabase.co/storage/v1/object/sign/bucket/path?token=xxx
    const bucketPattern = new RegExp(`/storage/v1/object/(?:public|sign)/${bucket}/(.+?)(?:\\?|$)`);
    const match = url.match(bucketPattern);
    
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Upload a file to a storage bucket and return the file path
 * For private buckets, returns just the path (use getSignedUrl to get viewable URL)
 * For public buckets, returns the public URL
 */
export async function uploadToStorage(
  bucket: 'avatars' | 'opponent-avatars' | 'tutorial_images',
  filePath: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string }
): Promise<{ path: string; publicUrl?: string } | null> {
  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: options?.upsert ?? false,
        contentType: options?.contentType,
      });
    
    if (uploadError) {
      console.error(`Upload error for ${bucket}/${filePath}:`, uploadError);
      throw uploadError;
    }
    
    // For public buckets, return the public URL
    if (bucket === 'tutorial_images') {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return { path: filePath, publicUrl: data.publicUrl };
    }
    
    // For private buckets, return just the path
    return { path: filePath };
  } catch (err) {
    console.error(`Failed to upload to ${bucket}/${filePath}:`, err);
    throw err;
  }
}

/**
 * Clear the signed URL cache (useful when user logs out or for testing)
 */
export function clearSignedUrlCache(): void {
  signedUrlCache.clear();
}
