import { useRef, useEffect, useCallback } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { AdaptiveTooltip } from '@/components/ui/adaptive-tooltip';
import { CircleHelp } from 'lucide-react';
import { Control } from 'react-hook-form';
import { FormValues, positions, tooltipContent } from '@/utils/handFormHelpers';

interface PositionSectionProps {
  control: Control<FormValues>;
  selectedPositionIndex: number;
  onPositionSelect: (index: number) => void;
}

const ITEM_HEIGHT = 30;
const CONTAINER_HEIGHT = 130;
const TOP_PADDING = 50;

const PositionSection: React.FC<PositionSectionProps> = ({
  control,
  selectedPositionIndex,
  onPositionSelect
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Calculate centered index from scroll position
  const getCenteredIndex = useCallback(() => {
    if (!scrollContainerRef.current) return 0;
    const scrollTop = scrollContainerRef.current.scrollTop;
    const centerOffset = (CONTAINER_HEIGHT / 2) - (ITEM_HEIGHT / 2);
    const index = Math.round((scrollTop - TOP_PADDING + centerOffset) / ITEM_HEIGHT);
    return Math.max(0, Math.min(positions.length - 1, index));
  }, []);

  // Scroll to specific position index
  const scrollToPosition = useCallback((index: number, smooth = true) => {
    if (!scrollContainerRef.current) return;
    const targetScrollTop = (index * ITEM_HEIGHT) + TOP_PADDING - (CONTAINER_HEIGHT / 2) + (ITEM_HEIGHT / 2);
    scrollContainerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Handle scroll end - select centered item
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      const centeredIndex = getCenteredIndex();
      if (centeredIndex !== selectedPositionIndex) {
        onPositionSelect(centeredIndex);
      }
    }, 100);
  }, [getCenteredIndex, selectedPositionIndex, onPositionSelect]);

  // Handle tap - scroll to that position (selection happens on scroll end)
  const handlePositionTap = useCallback((index: number) => {
    scrollToPosition(index);
  }, [scrollToPosition]);

  // Initial scroll positioning on mount
  useEffect(() => {
    if (isInitialMount.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        scrollToPosition(selectedPositionIndex, false);
        isInitialMount.current = false;
      }, 50);
    }
  }, [selectedPositionIndex, scrollToPosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <FormField
      control={control}
      name="position"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-2">
            <FormLabel>Position</FormLabel>
            <AdaptiveTooltip content={tooltipContent.position}>
              <CircleHelp className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
            </AdaptiveTooltip>
          </div>
          
          {/* iOS-style wheel picker */}
          <FormControl>
            <div className="relative flex justify-center w-full h-[130px] overflow-hidden">
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 h-[30px] border-y border-transparent"></div>
              </div>
              
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scrollbar-none"
              >
                {/* Empty spaces at top and bottom to allow centering */}
                <div className="h-[50px]" aria-hidden="true"></div>
                
                {positions.map((position, index) => (
                  <div
                    key={position}
                    className={`h-[30px] flex items-center justify-center cursor-pointer snap-center transition-all duration-200 ${
                      index === selectedPositionIndex 
                        ? 'text-poker-gold font-bold text-lg' 
                        : 'text-gray-600 dark:text-gray-400 dark:text-gray-500 text-base hover:text-gray-800 dark:text-foreground'
                    }`}
                    onClick={() => handlePositionTap(index)}
                  >
                    {position}
                  </div>
                ))}
                
                {/* Empty spaces at top and bottom to allow centering */}
                <div className="h-[50px]" aria-hidden="true"></div>
              </div>
              
              {/* Selection indicator */}
              <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 h-[30px] border-y-2 border-poker-gold/20 pointer-events-none"></div>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default PositionSection;