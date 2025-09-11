import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Force light theme always
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    // Remove any theme-related classes
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-high-contrast');
    // Force light theme
    document.documentElement.classList.add('theme-light');
  }, []);

  const toggleTheme = () => {
    // Do nothing - keep light theme
    setIsDarkMode(false);
  };

  const setTheme = (isDark: boolean) => {
    // Always force light mode
    setIsDarkMode(false);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode: false, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
