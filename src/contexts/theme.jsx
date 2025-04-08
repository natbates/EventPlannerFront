import React, { createContext, useContext, useEffect, useState } from "react";
import { useNotification } from "./notification";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Try to load saved theme or default to "light"
    return localStorage.getItem("theme") || "light";
  });

  const {notify} = useNotification();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme); // for Tailwind/custom styles
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
    notify("Theme changed", 2000); // Notify user of theme change
};

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook
export const useTheme = () => useContext(ThemeContext);