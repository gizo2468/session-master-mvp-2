import { ReactNode, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 overflow-y-auto overscroll-none bg-gray-50 pt-safe pb-safe"
    >
      {children}
    </div>
  );
}
