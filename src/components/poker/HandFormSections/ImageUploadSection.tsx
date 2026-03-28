import React, { useState } from 'react';
import { Camera, Loader2, Pencil, X } from 'lucide-react';
import { useNativeImagePicker } from '@/hooks/useNativeImagePicker';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handlePickImage = async () => {
    if (isNative) {
      const result = await pickImage('prompt');
      if (result && onImageDataUrl) {
        onImageDataUrl(result.dataUrl);
      }
    } else {
      document.getElementById('image-upload')?.click();
    }
  };

  const handleClick = () => {
    if (isLoading) return;
    if (imagePreview) {
      setIsLightboxOpen(true);
    } else {
      handlePickImage();
    }
  };

  const handleEditPhoto = () => {
    setIsLightboxOpen(false);
    setTimeout(() => handlePickImage(), 200);
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

      {/* Lightbox preview */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent
          className="max-w-[100vw] max-h-[100dvh] w-screen h-[100dvh] p-0 border-none bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center gap-0 [&>button]:hidden"
          onClick={() => setIsLightboxOpen(false)}
        >
          <DialogTitle className="sr-only">Hand Image Preview</DialogTitle>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            className="absolute top-4 right-4 z-20 text-white hover:bg-white dark:bg-card/10 min-w-[44px] min-h-[44px]"
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Image */}
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Hand preview"
              className="max-w-[90vw] max-h-[70dvh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Edit button */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Button
              onClick={handleEditPhoto}
              className="bg-primary text-primary-foreground hover:bg-primary/90 backdrop-blur-md px-6"
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageUploadSection;
