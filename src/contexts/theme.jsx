import React, { createContext, useContext, useEffect, useState } from "react";
import { useNotification } from "./notification";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { notify } = useNotification();

  const getDefaultTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;

    const hour = new Date().getHours();
    // Use dark theme from 7PM to 7AM
    return hour >= 19 || hour < 7 ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getDefaultTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme); // for Tailwind/custom styles
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook
export const useTheme = () => useContext(ThemeContext);
