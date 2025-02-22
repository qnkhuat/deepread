import { createContext, useContext, useState } from 'react';

// Define default settings
const DEFAULT_SETTINGS = {
  model: 'qwen2.5',
  // Add other settings here, for example:
  // theme: 'light',
  // language: 'en',
  // fontSize: 'medium',
};

// Helper function to initialize settings from localStorage
const initializeSettings = () => {
  const savedSettings = localStorage.getItem('settings');
  console.log('Loading saved settings:', savedSettings); // Debug log
  if (savedSettings) {
    try {
      const parsedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      console.log('Initialized settings:', parsedSettings); // Debug log
      return parsedSettings;
    } catch (e) {
      console.error('Failed to parse settings from localStorage:', e);
    }
  }
  console.log('Using default settings:', DEFAULT_SETTINGS); // Debug log
  return DEFAULT_SETTINGS;
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(initializeSettings);

  const updateSetting = (key, value) => {
    console.log('Updating setting:', key, value); // Debug log
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      console.log('New settings state:', newSettings); // Debug log
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
