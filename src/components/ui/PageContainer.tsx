
import React, { ReactNode } from 'react';
import { useSwipeBack } from '@/hooks/useSwipeBack';

interface PageContainerProps {
  children: ReactNode;
  disableSwipeBack?: boolean;
}

export default function PageContainer({ children, disableSwipeBack = false }: PageContainerProps) {
  const swipeRef = useSwipeBack(disableSwipeBack);

  return (
    <div ref={swipeRef} className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-md px-4 py-8">
        {children}
      </div>
    </div>
  );
}
