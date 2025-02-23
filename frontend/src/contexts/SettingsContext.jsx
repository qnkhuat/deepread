import { createContext, useContext, useState } from 'react';

const PROVIDER_CONFIG = {
  openai: {
    models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    config: {
      api_key: {
        type: "text",
        label: "API Key", 
        required: true
      },
      base_url: {
        type: "text",
        label: "Base URL",
        required: false, 
        default: "https://api.openai.com/v1"
      }
    }
  },
  anthropic: {
    models: ["claude-3-5-sonnet-20240620"],
    config: {
      api_key: {
        type: "text",
        label: "API Key", 
        required: true
      },
      base_url: {
        type: "text",
        label: "Base URL",
        required: false,
        default: "https://api.anthropic.com/v1"
      }
    }
  },
  ollama: {
    models: ["qwen2.5", "qwen2.5-coder"],
    config: {
      base_url: {
        type: "text",
        label: "Base URL",
        required: true,
        default: "http://localhost:11434"
      }
    }
  }
}

// Define default settings
const DEFAULT_SETTINGS = {
  model: 'qwen2.5',
};

// Helper function to initialize settings from localStorage
const initializeSettings = () => {
  const savedSettings = localStorage.getItem('settings') || "{}";
  return { ...DEFAULT_SETTINGS, providers: PROVIDER_CONFIG, ...JSON.parse(savedSettings)};
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(initializeSettings);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
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
