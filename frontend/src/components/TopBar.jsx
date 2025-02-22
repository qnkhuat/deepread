import { useSettings } from '../contexts/SettingsContext';
import { Container, Modal, TextField, IconButton, Select, MenuItem, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';

const PROVIDER_CONFIG = {
  "openai": {
    "models": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
    "config": {
      "api_key": {"type": "text", "label": "API Key", required: true},
      "base_url": {"type": "text", "label": "Base URL", required: false, default: "https://api.openai.com/v1"}
    }
  },
  "anthropic": {
    "models": ["claude-3-5-sonnet-20240620"],
    "config": {
      "api_key": {"type": "text", "label": "API Key", required: true},
      "base_url": {"type": "text", "label": "Base URL", required: false, default: "https://api.anthropic.com/v1"}
    }
  },
  "ollama": {
    "models": ["qwen2.5", "qwen2.5-coder"],
    "config": {
      "base_url": {"type": "text", "label": "Base URL", required: true, default: "http://localhost:11434"}
    }
  }
}

function TopBar() {
  const { settings, updateSetting } = useSettings();
  const [configOpen, setConfigOpen] = useState(false);

  // Get the provider and its config based on selected model
  const getProviderForModel = (model) => {
    for (const [provider, config] of Object.entries(PROVIDER_CONFIG)) {
      if (config.models.includes(model)) {
        return { provider, config: config.config };
      }
    }
    return null;
  };

  const currentProvider = getProviderForModel(settings.model);

  return (
    <Container maxWidth={false} sx={{ height: '50px', borderBottom: '1px solid #e0e0e0' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        height: '100%', 
        alignItems: 'center' 
      }}>
        <Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Select
            value={settings.model}
            onChange={(e) => updateSetting('model', e.target.value)}
            size="small"
          >
            <MenuItem value="qwen2.5">Qwen 2.5</MenuItem>
            <MenuItem value="gpt-4o-mini">GPT-4o-mini</MenuItem>
            <MenuItem value="grok-2-1212">Grok 2 12 12</MenuItem>
          </Select>
          <IconButton 
            onClick={() => setConfigOpen(true)} 
            size="small"
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      <Modal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        aria-labelledby="provider-config-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
          minWidth: 300,
        }}>
          <h2>Provider Configuration</h2>
          {currentProvider && Object.entries(currentProvider.config).map(([key, config]) => (
            <TextField
              key={key}
              label={config.label}
              placeholder={config.label}
              value={settings[key] || config.default || ''}
              onChange={(e) => updateSetting(key, e.target.value)}
              required={config.required}
              type={config.type === 'password' ? 'password' : 'text'}
              fullWidth
              margin="normal"
              size="small"
            />
          ))}
        </Box>
      </Modal>
    </Container>
  );
}

export default TopBar; 
