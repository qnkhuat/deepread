import { useSettings } from '../contexts/SettingsContext';
import { Container, Modal, TextField, IconButton, Select, MenuItem, ListSubheader, Box, Typography, Button, Menu } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState, useEffect } from 'react';

const backendURL = () => {
  return window.electron
    ? `http://localhost:${window.electron.getBackendPort()}`
    : 'http://localhost:8345';
}

function TopBar() {
  const { settings, updateSetting } = useSettings();
  const [configOpen, setConfigOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if any provider is configured
  const isAnyProviderConfigured = () => {
    return Object.keys(settings.providers).some(providerName => 
      isProviderConfigured(providerName)
    );
  };

  // Fetch models only for configured providers that don't have models cached
  const fetchModels = async () => {
    setIsLoading(true);
    try {
      for (const [providerName, providerInfo] of Object.entries(settings.providers)) {
        // Check if provider is configured and doesn't have models cached
        if (isProviderConfigured(providerName) && 
            (!providerInfo.models || providerInfo.models.length === 0)) {
          const response = await fetch(`${backendURL()}/api/models`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider_name: providerName,
              config: providerInfo.config
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.models && Array.isArray(data.models)) {
              updateSetting(['providers', providerName, 'models'], data.models);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show config modal if no provider is configured or select first available model
  useEffect(() => {
    if (!isAnyProviderConfigured()) {
      handleOpenConfig();
    } else {
      fetchModels().then(() => {
        // After fetching models, select the first available model if none is selected
        if (!settings.current_model) {
          selectFirstAvailableModel();
        }
      });
    }
  }, []);

  // Function to select the first available model
  const selectFirstAvailableModel = () => {
    for (const [providerName, providerInfo] of Object.entries(settings.providers)) {
      if (isProviderConfigured(providerName) && 
          providerInfo.models && 
          providerInfo.models.length > 0) {
        updateSetting('current_model', [providerName, providerInfo.models[0]]);
        return;
      }
    }
  };

  const handleOpenConfig = () => {
    setTempSettings(JSON.parse(JSON.stringify(settings.providers)));
    setConfigOpen(true);
  };

  const handleSave = () => {
    Object.entries(tempSettings).forEach(([providerName, providerInfo]) => {
      Object.entries(providerInfo.config).forEach(([key, config]) => {
        if (config.value !== undefined) {
          updateSetting(['providers', providerName, 'config', key, 'value'], config.value);
        }
      });
    });
    setConfigOpen(false);
    // Fetch models after saving new configurations
    fetchModels();
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpen(false);
  };

  const isProviderConfigured = (providerName) => {
    const provider = settings.providers[providerName];
    return Object.entries(provider.config).every(([_, config]) => {
      return !config.required || (config.value !== undefined && config.value !== '');
    });
  };

  const handleModelSelect = (providerName, modelName) => {
    if (!isProviderConfigured(providerName)) {
      setTempSettings(JSON.parse(JSON.stringify(settings.providers)));
      setConfigOpen(true);
    } else {
      updateSetting('current_model', [providerName, modelName]);
    }
    handleClose();
  };

  // Add a button to refresh models in the settings modal
  const handleRefreshModels = async () => {
    // Clear cached models
    Object.keys(settings.providers).forEach(providerName => {
      if (isProviderConfigured(providerName)) {
        updateSetting(['providers', providerName, 'models'], []);
      }
    });
    
    // Fetch models again
    await fetchModels();
  };

  return (
    <Container maxWidth={false} sx={{ height: '50px', borderBottom: '1px solid #e0e0e0' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        height: '100%', 
        alignItems: 'center' 
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {window.electron ? (
              <img 
                src={window.electron.getAssetPath ? window.electron.getAssetPath('icon/png/64x64.png') : './icon/png/64x64.png'} 
                alt="DeepRead Logo" 
                style={{ height: '32px', width: 'auto' }} 
              />
            ) : (
              <img 
                src="/icon/png/64x64.png" 
                alt="DeepRead Logo" 
                style={{ height: '32px', width: 'auto' }} 
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={handleClick}
            variant="outlined"
          >
            {settings.current_model ? `${settings.current_model[0]} - ${settings.current_model[1]}` : 'Select a model'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            {Object.entries(settings.providers).map(([providerName, providerInfo]) => (
              <div key={providerName}>
                <ListSubheader>{providerName}</ListSubheader>
                {(providerInfo.models || []).map(modelName => (
                  <MenuItem 
                    key={modelName}
                    onClick={() => handleModelSelect(providerName, modelName)}
                  >
                    {modelName}
                  </MenuItem>
                ))}
                {(!providerInfo.models || providerInfo.models.length === 0) && (
                  <MenuItem disabled>
                    {isProviderConfigured(providerName) ? 'Loading models...' : 'Configure provider first'}
                  </MenuItem>
                )}
              </div>
            ))}
          </Menu>
          <IconButton 
            onClick={handleOpenConfig}
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
          {Object.entries(settings.providers).map(([providerName, providerInfo]) => (
            <Box key={providerName}>
              <Typography variant="h6" sx={{mt: 2, mb: 1}}>{providerName}</Typography>
              {Object.entries(providerInfo.config).map(([key, config]) => (
                <TextField
                  key={`${providerName}-${key}`}
                  label={config.label}
                  value={tempSettings[providerName]?.config[key]?.value || ''}
                  onChange={(e) => {
                    setTempSettings(prev => ({
                      ...prev,
                      [providerName]: {
                        ...prev[providerName],
                        config: {
                          ...prev[providerName].config,
                          [key]: {
                            ...prev[providerName].config[key],
                            value: e.target.value
                          }
                        }
                      }
                    }));
                  }}
                  required={config.required}
                  type={config.type === 'password' ? 'password' : 'text'}
                  fullWidth
                  margin="normal"
                  size="small"
                />
              ))}
            </Box>
          ))}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={handleRefreshModels}
              disabled={isLoading}
            >
              Refresh Models
            </Button>
            <Box>
              <Button variant="outlined" onClick={() => setConfigOpen(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleSave}
                disabled={isLoading}
                sx={{ ml: 1 }}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
}

export default TopBar; 
