import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIAnalyzerState, AIHandAnalysisResult } from '@/types/poker';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_WIDTH = 1920;

// Client-side image optimization
const optimizeImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Resize if needed
      if (width > MAX_IMAGE_WIDTH) {
        height = Math.round((height * MAX_IMAGE_WIDTH) / width);
        width = MAX_IMAGE_WIDTH;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const useAIHandAnalyzer = () => {
  const [state, setState] = useState<AIAnalyzerState>({
    status: 'idle',
    image: null,
    imageSize: 0,
    analysis: null,
    error: null,
    manualOverrides: {}
  });

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      image: null,
      imageSize: 0,
      analysis: null,
      error: null,
      manualOverrides: {}
    });
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size must be under 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    setState(prev => ({ ...prev, status: 'uploading' }));

    try {
      const optimizedBase64 = await optimizeImage(file);
      const optimizedSize = (optimizedBase64.length * 3) / 4;
      
      setState(prev => ({
        ...prev,
        status: 'idle',
        image: optimizedBase64,
        imageSize: optimizedSize
      }));
      
      if (optimizedSize < file.size * 0.5) {
        toast.success(`Image optimized (${Math.round(optimizedSize / 1024)}KB)`);
      }
    } catch (error) {
      console.error('Image optimization error:', error);
      toast.error('Failed to process image');
      setState(prev => ({ ...prev, status: 'idle' }));
    }
  }, []);

  const analyzeHand = useCallback(async () => {
    if (!state.image) {
      toast.error('Please upload an image first');
      return;
    }

    setState(prev => ({ ...prev, status: 'analyzing', error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('analyze-poker-hand', {
        body: {
          image: state.image,
          heroOverride: state.manualOverrides.heroPosition,
          dealerOverride: state.manualOverrides.dealerPosition
        }
      });

      if (error) {
        console.error('Full error object:', {
          message: error.message,
          context: error.context,
          details: error.details,
          status: error.status
        });

        // Extract error code/message from response body if available
        const rawBody = (error as any)?.context?.body as unknown;
        let parsedBody: any = null;
        if (typeof rawBody === 'string') {
          try { parsedBody = JSON.parse(rawBody); } catch {}
        } else if (rawBody && typeof rawBody === 'object') {
          parsedBody = rawBody;
        }
        if (parsedBody?.code || parsedBody?.error) {
          throw { code: parsedBody.code, message: parsedBody.error || error.message };
        }
        // Fallback to original error
        throw error;
      }

      const result = data as AIHandAnalysisResult;

      // Add comprehensive debugging
      console.log('AI Analysis Result:', {
        heroCards: result.hero.cards,
        heroCardsType: typeof result.hero.cards,
        heroCardsIsArray: Array.isArray(result.hero.cards),
        heroPosition: result.hero.position,
        boardFlop: result.board.flop,
        boardFlopType: typeof result.board.flop,
        fullResult: result
      });

      // Check for unsupported game types
      if (result.gameContext.gameType !== 'NLH') {
        setState(prev => ({
          ...prev,
          status: 'unsupportedFormat',
          error: `Currently, only No-Limit Hold'em hands can be analyzed. Support for ${result.gameContext.gameType} and other formats coming soon!`
        }));
        return;
      }

      // Check if dealer button selection needed
      if (result.dealerButton.requiresManualSelection) {
        setState(prev => ({
          ...prev,
          status: 'needsDealerSelection',
          analysis: result
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        status: 'success',
        analysis: result
      }));

      toast.success(`Hand analyzed in ${(result.metadata.processingTimeMs / 1000).toFixed(1)}s`);

    } catch (err: any) {
      console.error('Analysis error:', err);
      
      let errorMessage = 'Analysis failed. Please try again.';
      
      // Use the structured error message if available
      if (err.message && typeof err.message === 'string') {
        errorMessage = err.message;
      }
      
      // Special handling for specific error codes
      if (err.code === 'UNAUTHORIZED' || err.message?.includes('401')) {
        errorMessage = 'Authentication required. Please log in to use AI hand analysis.';
      } else if (err.code === 'RATE_LIMIT' || err.message?.includes('429')) {
        errorMessage = 'AI rate limit exceeded. Please try again in a moment.';
      } else if (err.code === 'CREDITS_DEPLETED' || err.message?.includes('402')) {
        errorMessage = 'AI credits depleted. Please add credits to continue using AI analysis.';
      } else if (err.code === 'TIMEOUT' || err.message?.includes('408')) {
        errorMessage = 'Analysis timed out. Please try with a clearer image.';
      } else if (err.code === 'CONFIG_ERROR') {
        errorMessage = 'AI service not configured properly. Please contact support.';
      }

      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
      
      toast.error(errorMessage);
    }
  }, [state.image, state.manualOverrides]);

  const setManualOverride = useCallback((type: 'heroPosition' | 'dealerPosition', value: string) => {
    setState(prev => ({
      ...prev,
      manualOverrides: {
        ...prev.manualOverrides,
        [type]: value
      }
    }));
  }, []);

  return {
    state,
    handleImageUpload,
    analyzeHand,
    setManualOverride,
    reset
  };
};
