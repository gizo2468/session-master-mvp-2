import React, { createContext, useContext, useState, useEffect } from 'react';

interface NightModeContextType {
  nightMode: boolean;
  toggleNightMode: () => void;
}

const NightModeContext = createContext<NightModeContextType>({
  nightMode: false,
  toggleNightMode: () => {},
});

export const useNightMode = () => useContext(NightModeContext);

export const NightModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nightMode, setNightMode] = useState(() => {
    try {
      return localStorage.getItem('night-mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (nightMode) {
      root.classList.add('night-mode');
    } else {
      root.classList.remove('night-mode');
    }
    try {
      localStorage.setItem('night-mode', String(nightMode));
    } catch {}
  }, [nightMode]);

  const toggleNightMode = () => setNightMode(prev => !prev);

  return (
    <NightModeContext.Provider value={{ nightMode, toggleNightMode }}>
      {children}
    </NightModeContext.Provider>
  );
};
