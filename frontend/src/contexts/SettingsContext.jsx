import { createContext, useContext, useState } from 'react';


// Define default settings
const DEFAULT_SETTINGS = {
  model: 'qwen2.5',
};

// Helper function to initialize settings from localStorage
const initializeSettings = () => {
  const savedSettings = localStorage.getItem('settings');
  return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings)};
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(initializeSettings);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const value = {
    settings,
    updateSetting,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 
