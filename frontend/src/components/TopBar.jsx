import { useSettings } from '../contexts/SettingsContext';
import { Container, Modal, TextField, IconButton, Select, MenuItem, ListSubheader, Box, Typography, Button, Menu, InputAdornment } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useEffect } from 'react';
import * as api from '@/api';

function TopBar() {
  const { settings, updateSetting } = useSettings();
  const [configOpen, setConfigOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProviders, setExpandedProviders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModels, setFilteredModels] = useState({});

  // Check if any provider is configured
  const isAnyProviderConfigured = () => {
    return Object.keys(settings.providers).some(providerName => 
      isProviderConfigured(providerName)
    );
  };

  // Fetch models only for configured providers that don't have models cached
  const fetchModelsForProviders = async () => {
    setIsLoading(true);
    try {
      for (const [providerName, providerInfo] of Object.entries(settings.providers)) {
        console.log("HEY", providerName);
        if (isProviderConfigured(providerName) && 
            (!providerInfo.models || providerInfo.models.length === 0)) {
          try {
            console.log("PROVIDER INFO: ", providerInfo, providerName);
            const models = await api.getModels(providerName, providerInfo.config);
            if (models && Array.isArray(models)) {
              updateSetting(['providers', providerName, 'models'], models);
            }
          } catch (error) {
            console.error(`Error fetching models for ${providerName}:`, error);
            updateSetting(['providers', providerName, 'error'], error.message);
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
      console.log("HEY2");
      fetchModelsForProviders().then(() => {
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
    fetchModelsForProviders();
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpen(false);
    setSearchTerm('');
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
   await fetchModelsForProviders();
  };

  // Initialize expanded state for providers
  useEffect(() => {
    const initialExpandedState = {};
    Object.keys(settings.providers).forEach(providerName => {
      initialExpandedState[providerName] = true; // Start expanded by default
    });
    setExpandedProviders(initialExpandedState);
  }, [settings.providers]);

  const toggleProviderExpanded = (providerName, event) => {
    event.stopPropagation(); // Prevent menu from closing
    setExpandedProviders(prev => ({
      ...prev,
      [providerName]: !prev[providerName]
    }));
  };

  // Filter models based on search term
  useEffect(() => {
    const filtered = {};
    
    Object.entries(settings.providers).forEach(([providerName, providerInfo]) => {
      if (providerInfo.models && providerInfo.models.length > 0) {
        filtered[providerName] = providerInfo.models.filter(model => 
          model.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        filtered[providerName] = [];
      }
    });
    
    setFilteredModels(filtered);
  }, [settings.providers, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
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
            PaperProps={{
              style: {
                maxHeight: 400,
                width: '250px',
              },
            }}
          >
            <Box sx={{ p: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
              <TextField
                placeholder="Search models..."
                value={searchTerm}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />
            </Box>
            
            {Object.entries(settings.providers).map(([providerName, providerInfo]) => {
              // Skip providers with no matching models when searching
              if (searchTerm && filteredModels[providerName]?.length === 0) {
                return null;
              }
              
              return (
                <div key={providerName}>
                  <ListSubheader 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => toggleProviderExpanded(providerName, e)}
                  >
                    {providerName}
                    {expandedProviders[providerName] ? 
                      <ExpandLessIcon fontSize="small" /> : 
                      <ExpandMoreIcon fontSize="small" />
                    }
                  </ListSubheader>
                  
                  {expandedProviders[providerName] && (
                    <>
                      {searchTerm ? (
                        // Show filtered models when searching
                        filteredModels[providerName]?.map(modelName => (
                          <MenuItem 
                            key={modelName}
                            onClick={() => handleModelSelect(providerName, modelName)}
                          >
                            {modelName}
                          </MenuItem>
                        ))
                      ) : (
                        // Show all models when not searching
                        (providerInfo.models || []).map(modelName => (
                          <MenuItem 
                            key={modelName}
                            onClick={() => handleModelSelect(providerName, modelName)}
                          >
                            {modelName}
                          </MenuItem>
                        ))
                      )}
                      
                      {(!providerInfo.models || providerInfo.models.length === 0) && (
                        <MenuItem disabled>
                          {isProviderConfigured(providerName) 
                            ? (providerInfo.error 
                               ? `Error: ${providerInfo.error}` 
                               : 'Loading models...') 
                            : 'Configure provider first'}
                        </MenuItem>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            
            {searchTerm && Object.values(filteredModels).every(models => models.length === 0) && (
              <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                No models match your search
              </Box>
            )}
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
                <Button 
                variant="contained" 
                onClick={handleSave}
                disabled={isLoading}
                sx={{ ml: 1 }}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
<Button variant="outlined" onClick={() => setConfigOpen(false)}>Cancel</Button>

            </Box>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
}

export default TopBar; 
