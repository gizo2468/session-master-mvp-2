import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export type ImagePickerSource = 'camera' | 'gallery' | 'prompt';

export interface ImagePickerResult {
  dataUrl: string;
  format: string;
}

export interface ImagePickerError {
  code: 'PERMISSION_DENIED' | 'CANCELLED' | 'ERROR';
  message: string;
}

/**
 * Check if we're running in a native Capacitor environment
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const permissions = await Camera.checkPermissions();
    
    if (permissions.camera === 'granted' && permissions.photos === 'granted') {
      return true;
    }
    
    const requested = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
    return requested.camera === 'granted' || requested.photos === 'granted';
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
};

/**
 * Open device settings (for when permission is denied)
 */
export const openDeviceSettings = async (): Promise<void> => {
  try {
    // On iOS, this will prompt the user but may not directly open settings
    // The user will need to manually go to Settings
    if (Capacitor.getPlatform() === 'ios') {
      // Unfortunately, iOS doesn't allow direct navigation to app settings
      // We can only inform the user
      console.log('Please open Settings > SessionMaster to enable camera access');
    }
  } catch (error) {
    console.error('Error opening settings:', error);
  }
};

/**
 * Pick an image using native camera or gallery
 */
export const pickImageNative = async (
  source: 'camera' | 'gallery'
): Promise<ImagePickerResult> => {
  const cameraSource = source === 'camera' ? CameraSource.Camera : CameraSource.Photos;
  
  const photo: Photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: cameraSource,
    correctOrientation: true,
  });
  
  if (!photo.dataUrl) {
    throw { code: 'ERROR', message: 'No image data returned' } as ImagePickerError;
  }
  
  return {
    dataUrl: photo.dataUrl,
    format: photo.format,
  };
};

/**
 * Pick an image using web file input (fallback for web)
 */
export const pickImageWeb = (): Promise<ImagePickerResult> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject({ code: 'CANCELLED', message: 'No file selected' } as ImagePickerError);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const format = file.type.split('/')[1] || 'jpeg';
        resolve({ dataUrl, format });
      };
      reader.onerror = () => {
        reject({ code: 'ERROR', message: 'Failed to read file' } as ImagePickerError);
      };
      reader.readAsDataURL(file);
    };
    
    input.oncancel = () => {
      reject({ code: 'CANCELLED', message: 'User cancelled' } as ImagePickerError);
    };
    
    input.click();
  });
};

/**
 * Main function to pick an image - handles both native and web
 */
export const pickImage = async (
  source: ImagePickerSource
): Promise<ImagePickerResult> => {
  // For web, always use file input
  if (!isNativePlatform()) {
    return pickImageWeb();
  }
  
  // For native, use Capacitor Camera
  try {
    // If source is 'prompt', let the Camera plugin show the native picker
    if (source === 'prompt') {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Select Image Source',
        promptLabelPhoto: 'Choose from Gallery',
        promptLabelPicture: 'Take Photo',
        correctOrientation: true,
      });
      
      if (!photo.dataUrl) {
        throw { code: 'ERROR', message: 'No image data returned' } as ImagePickerError;
      }
      
      return {
        dataUrl: photo.dataUrl,
        format: photo.format,
      };
    }
    
    return await pickImageNative(source);
  } catch (error: any) {
    // Handle permission denied
    if (error?.message?.includes('denied') || error?.message?.includes('permission')) {
      throw {
        code: 'PERMISSION_DENIED',
        message: 'Camera or photo library access was denied. Please enable it in Settings.',
      } as ImagePickerError;
    }
    
    // Handle user cancellation
    if (error?.message?.includes('cancel') || error?.message?.includes('User cancelled')) {
      throw {
        code: 'CANCELLED',
        message: 'Image selection was cancelled',
      } as ImagePickerError;
    }
    
    // Generic error
    throw {
      code: 'ERROR',
      message: error?.message || 'Failed to pick image',
    } as ImagePickerError;
  }
};
