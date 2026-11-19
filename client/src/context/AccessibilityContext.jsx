import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('medremind_fontsize') || 'large'; // Default large for elderly users
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('medremind_highcontrast') === 'true';
  });

  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('medremind_voice') !== 'false';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('medremind_theme') || 'light';
  });

  // Apply changes to HTML root tag
  useEffect(() => {
    const root = document.documentElement;

    // Font size classes
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-extra-large');
    root.classList.add(`font-size-${fontSize}`);
    localStorage.setItem('medremind_fontsize', fontSize);

    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('medremind_highcontrast', String(highContrast));

    // Dark theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('medremind_theme', theme);

    localStorage.setItem('medremind_voice', String(voiceEnabled));
  }, [fontSize, highContrast, theme, voiceEnabled]);

  const updatePreferences = async (newPrefs) => {
    if (newPrefs.fontSize) setFontSize(newPrefs.fontSize);
    if (newPrefs.highContrast !== undefined) setHighContrast(newPrefs.highContrast);
    if (newPrefs.voiceAssistance !== undefined) setVoiceEnabled(newPrefs.voiceAssistance);
    if (newPrefs.theme) setTheme(newPrefs.theme);

    try {
      await api.put('/settings/preferences', newPrefs);
    } catch (err) {
      // Offline or unauthenticated preference saving
      console.warn('Could not sync preferences with server:', err.message);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        voiceEnabled,
        setVoiceEnabled,
        theme,
        setTheme,
        updatePreferences
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
