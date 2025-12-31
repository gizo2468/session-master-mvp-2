import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  pickImage, 
  ImagePickerSource, 
  ImagePickerResult, 
  ImagePickerError,
  isNativePlatform 
} from '@/utils/nativeImagePicker';

interface UseNativeImagePickerReturn {
  pickImage: (source?: ImagePickerSource) => Promise<ImagePickerResult | null>;
  isLoading: boolean;
  error: ImagePickerError | null;
  isNative: boolean;
}

/**
 * React hook for picking images using native camera/gallery on mobile
 * or file input on web
 */
export function useNativeImagePicker(): UseNativeImagePickerReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ImagePickerError | null>(null);
  
  const isNative = isNativePlatform();
  
  const handlePickImage = useCallback(async (
    source: ImagePickerSource = 'prompt'
  ): Promise<ImagePickerResult | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await pickImage(source);
      setIsLoading(false);
      return result;
    } catch (err) {
      const pickerError = err as ImagePickerError;
      setError(pickerError);
      setIsLoading(false);
      
      // Handle different error types
      if (pickerError.code === 'PERMISSION_DENIED') {
        toast.error('Permission Denied', {
          description: 'Camera or photo access was denied. Please enable it in your device Settings.',
          duration: 5000,
          action: isNative ? {
            label: 'OK',
            onClick: () => {},
          } : undefined,
        });
      } else if (pickerError.code === 'CANCELLED') {
        // User cancelled - no toast needed
        console.log('Image selection cancelled');
      } else {
        toast.error('Error', {
          description: pickerError.message || 'Failed to select image',
        });
      }
      
      return null;
    }
  }, [isNative]);
  
  return {
    pickImage: handlePickImage,
    isLoading,
    error,
    isNative,
  };
}
