import React, { createContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export { ThemeContext };

// theme: 'dark' | 'light' | 'system'
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Read saved preference; allowed values: 'dark','light','system'
    try {
      const saved = localStorage.getItem('wallet-theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    } catch (err) {
      void err;
    }
    // Default to system
    return 'system';
  });

  // Compute whether dark mode should be applied based on theme and system preference
  const getEffectiveDark = () => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    // system
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  useEffect(() => {
    const apply = () => {
      // Compute effective dark inline to satisfy hook dependencies
      let isDark;
      if (theme === 'dark') isDark = true;
      else if (theme === 'light') isDark = false;
      else isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      try { localStorage.setItem('wallet-theme', theme); } catch (err) { void err; }
    };

    apply();

    // If theme is 'system', listen to system changes so UI updates automatically
    let mql;
    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply();
      if (typeof mql.addEventListener === 'function') mql.addEventListener('change', handler);
      else if (typeof mql.addListener === 'function') mql.addListener(handler);
      return () => {
        if (mql) {
          if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', handler);
          else if (typeof mql.removeListener === 'function') mql.removeListener(handler);
        }
      };
    }
    return undefined;
  }, [theme]);

  const toggleTheme = () => {
    // Toggle between light and dark; if currently 'system', derive effective and flip
    const prev = theme;
    let newMode;
    if (prev === 'dark') newMode = 'light';
    else if (prev === 'light') newMode = 'dark';
    else {
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      newMode = systemDark ? 'light' : 'dark';
    }
    setThemeMode(newMode);
  };

  const setThemeMode = (mode) => {
    if (mode === 'dark' || mode === 'light' || mode === 'system') {
      try { localStorage.setItem('wallet-theme-updatedAt', new Date().toISOString()); } catch (err) { void err; }
      setTheme(mode);
    }
  };

  const value = {
    isDark: getEffectiveDark(),
    toggleTheme,
    setTheme: setThemeMode,
    theme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};