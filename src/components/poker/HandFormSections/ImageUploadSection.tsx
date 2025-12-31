import React from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useNativeImagePicker } from '@/hooks/useNativeImagePicker';

interface ImageUploadSectionProps {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageDataUrl?: (dataUrl: string) => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  imagePreview,
  onImageChange,
  onImageDataUrl
}) => {
  const { pickImage, isLoading, isNative } = useNativeImagePicker();

  const handleClick = async () => {
    if (isNative) {
      // Use native picker on mobile
      const result = await pickImage('prompt');
      if (result && onImageDataUrl) {
        onImageDataUrl(result.dataUrl);
      }
    } else {
      // Fallback to file input on web
      document.getElementById('image-upload')?.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div 
        className="relative w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all duration-200 cursor-pointer group bg-muted/20 hover:bg-muted/40 flex items-center justify-center"
        onClick={handleClick}
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
        ) : imagePreview ? (
          <>
            <img 
              src={imagePreview} 
              alt="Hand preview" 
              className="w-full h-full rounded-full object-cover"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </>
        ) : (
          <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
        )}
      </div>
      <span className="text-sm text-muted-foreground">
        {isLoading ? "Opening..." : imagePreview ? "Change Image" : "Add Hand Image"}
      </span>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={onImageChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploadSection;