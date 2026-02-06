import React, { useEffect, useState } from 'react';
import Icon from '@/components/ui/Lucide';
import { getSignedUrl } from '@/utils/storageUtils';

interface GoalImageLinkProps {
  imageUrl: string | null | undefined;
}

/**
 * Component that renders a link to view a goal image.
 * Fetches signed URL for private bucket access.
 */
export default function GoalImageLink({ imageUrl }: GoalImageLinkProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setSignedUrl(null);
      return;
    }

    // Check if it's already a full URL (legacy data) or just a path
    if (imageUrl.startsWith('http')) {
      // Legacy: already a public URL
      setSignedUrl(imageUrl);
      return;
    }

    // New format: it's a file path, need to get signed URL
    let cancelled = false;
    setLoading(true);
    
    getSignedUrl('player-goals-images', imageUrl)
      .then((url) => {
        if (!cancelled) {
          setSignedUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to get signed URL for goal image:', err);
        if (!cancelled) {
          setSignedUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  if (!imageUrl || loading) {
    return null;
  }

  if (!signedUrl) {
    return null;
  }

  return (
    <a 
      href={signedUrl} 
      target="_blank" 
      rel="noopener noreferrer" 
      aria-label="View attached image"
    >
      <Icon name="Image" className="h-4 w-4" />
    </a>
  );
}
