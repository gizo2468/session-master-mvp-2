
import React, { ReactNode } from 'react';
import { useSwipeBack } from '@/hooks/useSwipeBack';

interface PageContainerProps {
  children: ReactNode;
  disableSwipeBack?: boolean;
  swipeBackFallbackPath?: string;
  swipeBackScreenName?: string;
}

export default function PageContainer({
  children,
  disableSwipeBack = false,
  swipeBackFallbackPath = '/',
  swipeBackScreenName = 'PageContainer',
}: PageContainerProps) {
  const swipeRef = useSwipeBack({
    disabled: disableSwipeBack,
    fallbackPath: swipeBackFallbackPath,
    screenName: swipeBackScreenName,
  });

  return (
    <div ref={swipeRef} className="min-h-screen">
      <div className="container mx-auto max-w-md px-4 pb-8 content-safe">
        {children}
      </div>
    </div>
  );
}
