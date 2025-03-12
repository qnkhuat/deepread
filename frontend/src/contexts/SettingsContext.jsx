import {createContext, useContext, useState} from 'react';

const PROVIDER_CONFIG = {
  openai: {
    enabled: false,
    models: [],
    api_key: "",
    base_url: "https://api.openai.com/v1"
  },
  anthropic: {
    enabled: false,
    models: [],
    api_key: "",
    base_url: "https://api.anthropic.com/v1"
  },
  ollama: {
    enabled: false,
    models: [],
    api_key: "ollama",
    base_url: "http://localhost:11434/v1"
  },
  deepseek: {
    enabled: false,
    models: [],
    api_key: "",
    base_url: "https://api.deepseek.com"
  }
}

// Define default settings
const DEFAULT_SETTINGS = {
  current_model: null,
  providers: PROVIDER_CONFIG
};

// Helper function to initialize settings from localStorage
const initializeSettings = () => {
  const savedSettings = localStorage.getItem('settings') || "{}";
  return {...DEFAULT_SETTINGS, ...JSON.parse(savedSettings)};
};

const SettingsContext = createContext(null);

export function SettingsProvider({children}) {
  const [settings, setSettings] = useState(initializeSettings);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const newSettings = {...prev};
      if (Array.isArray(key)) {
        let current = newSettings;
        for (let i = 0; i < key.length - 1; i++) {
          if (!current[key[i]]) {
            current[key[i]] = {};
          }
          current = current[key[i]];
        }
        current[key[key.length - 1]] = value;
      } else {
        newSettings[key] = value;
      }
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
