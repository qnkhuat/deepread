import { useSettings } from '../contexts/SettingsContext';
import { Container, Modal, TextField, IconButton, Switch, MenuItem, List, ListItem, ListItemText, ListSubheader, Box, Typography, Button, Menu, InputAdornment, FormControlLabel, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useState, useEffect } from 'react';
import * as api from '@/api';
import * as providerUtils from '../utils/providerUtils';

function TopBar() {
  const { settings, updateSetting } = useSettings();
  const [configOpen, setConfigOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState({});
  const [providerErrors, setProviderErrors] = useState({});
  const [providerSuccess, setProviderSuccess] = useState({});
  const [expandedProviders, setExpandedProviders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModels, setFilteredModels] = useState({});
  const [faqOpen, setFaqOpen] = useState(false);

  // Fetch models only for configured providers that don't have models cached
  const fetchModelsForProviders = async () => {
    setIsLoading(true);
    try {
      for (const [providerName, providerInfo] of Object.entries(settings.providers)) {
        if (providerUtils.isProviderConfigured(providerInfo, providerName) && 
            providerUtils.isProviderEnabled(providerInfo) &&
            !providerUtils.hasModels(providerInfo)) {
          try {
            const models = await api.getModels(providerName, providerInfo);
            if (Array.isArray(models)) {
              updateSetting(['providers', providerName, 'models'], models);
              // Clear any previous error
              setProviderErrors(prev => ({
                ...prev,
                [providerName]: null
              }));
            } 
          } catch (error) {
            console.error(`Error fetching models for ${providerName}:`, error);
            setProviderErrors(prev => ({
              ...prev,
              [providerName]: 'Failed to fetch models'
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show config modal if no provider is enabled or select first available model
  useEffect(() => {
    if (!providerUtils.isAnyProviderEnabled(settings.providers)) {
      handleOpenConfig();
    } else {
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
    const firstModel = providerUtils.findFirstAvailableModel(settings.providers);
    if (firstModel) {
      updateSetting('current_model', firstModel);
    }
  };

  const handleOpenConfig = () => {
    // Create a deep copy of the current settings
    setTempSettings(JSON.parse(JSON.stringify(settings.providers)));
    setConfigOpen(true);
  };

  // Handle saving provider configuration
  const handleSaveProviderConfig = async (providerName) => {
    const providerInfo = tempSettings[providerName];
    
    // Set loading state and clear previous messages
    setProviderLoading(prev => ({ ...prev, [providerName]: true }));
    setProviderErrors(prev => ({ ...prev, [providerName]: null }));
    setProviderSuccess(prev => ({ ...prev, [providerName]: null }));
    
    try {
      // Save the configuration first
      updateSetting(['providers', providerName, 'api_key'], providerInfo.api_key);
      updateSetting(['providers', providerName, 'base_url'], providerInfo.base_url);
      
      // Test connection and fetch models - result is the models array directly
      const models = await api.getModels(providerName, providerInfo);
      
      // Check if models is a valid array
      if (!Array.isArray(models)) {
        throw new Error('Invalid response: Models is not an array');
      }
      
      // Update models in settings
      updateSetting(['providers', providerName, 'models'], models);
      updateSetting(['providers', providerName, 'enabled'], true);
      
      // Update temp settings
      setTempSettings(prev => ({
        ...prev,
        [providerName]: {
          ...prev[providerName],
          enabled: true
        }
      }));
      
      // Set success message
      setProviderSuccess(prev => ({
        ...prev,
        [providerName]: `Successfully connected to ${providerName} and found ${models.length} models`
      }));
    } catch (error) {
      console.error(`Error saving provider ${providerName} config:`, error);
      setProviderErrors(prev => ({
        ...prev,
        [providerName]: error.message || 'Unexpected error occurred'
      }));
    } finally {
      setProviderLoading(prev => ({ ...prev, [providerName]: false }));
    }
  };

  // Handle disabling a provider
  const handleDisableProvider = (providerName) => {
    // Disable the provider
    updateSetting(['providers', providerName, 'enabled'], false);
    
    // Update temp settings to reflect the disabled state
    setTempSettings(prev => ({
      ...prev,
      [providerName]: {
        ...prev[providerName],
        enabled: false
      }
    }));
    
    // Clear any errors and success messages when disabling
    setProviderErrors(prev => ({
      ...prev,
      [providerName]: null
    }));
    
    setProviderSuccess(prev => ({
      ...prev,
      [providerName]: null
    }));
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

  const handleModelSelect = (providerName, modelName) => {
    if (!providerUtils.isProviderConfigured(settings.providers[providerName], providerName)) {
      setTempSettings(JSON.parse(JSON.stringify(settings.providers)));
      setConfigOpen(true);
    } else {
      updateSetting('current_model', [providerName, modelName]);
    }
    handleClose();
  };

  // We don't need the global save button anymore, but keep the refresh models functionality
  const handleRefreshModels = async () => {
    setIsLoading(true);
    
    try {
      // Clear cached models for all configured and enabled providers
      Object.keys(settings.providers).forEach(providerName => {
        const provider = settings.providers[providerName];
        if (providerUtils.isProviderConfigured(provider, providerName) && 
            providerUtils.isProviderEnabled(provider)) {
          updateSetting(['providers', providerName, 'models'], []);
        }
      });
      
      // Fetch models again
      await fetchModelsForProviders();
    } finally {
      setIsLoading(false);
    }
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
      filtered[providerName] = providerUtils.filterModels(providerInfo, searchTerm);
    });
    
    setFilteredModels(filtered);
  }, [settings.providers, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDarkModeToggle = () => {
    updateSetting('darkMode', !settings.darkMode);
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
              />            ) : (
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
            variant={providerUtils.isAnyProviderEnabled(settings.providers) ? "outlined" : "contained"}
            color={providerUtils.isAnyProviderEnabled(settings.providers) ? "primary" : "warning"}
            startIcon={!providerUtils.isAnyProviderEnabled(settings.providers) ? <SettingsIcon /> : null}
          >
            {providerUtils.isAnyProviderEnabled(settings.providers) 
              ? (settings.current_model ? `${settings.current_model[0]} - ${settings.current_model[1]}` : 'Select a model')
              : 'Configure Provider First'}
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
              
              const isEnabled = providerUtils.isProviderEnabled(providerInfo);
              const isConfigured = providerUtils.isProviderConfigured(providerInfo, providerName);
              
              return (
                <div key={providerName}>
                  <ListSubheader 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: isEnabled ? 'primary.main' : 'text.disabled',
                    }}
                    onClick={(e) => toggleProviderExpanded(providerName, e)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {providerName}
                      {(isConfigured && isEnabled) ? 
                        <CheckCircleIcon fontSize="small" color="success" /> : 
                        <CancelIcon fontSize="small" color="disabled" />
                      }
                    </Box>
                    {expandedProviders[providerName] ? 
                      <ExpandLessIcon fontSize="small" /> : 
                      <ExpandMoreIcon fontSize="small" />
                    }
                  </ListSubheader>
                  
                  {expandedProviders[providerName] && (
                    <>
                      {isEnabled && searchTerm ? (
                        // Show filtered models when searching
                        filteredModels[providerName]?.map(modelName => (
                          <MenuItem 
                            key={modelName}
                            onClick={() => handleModelSelect(providerName, modelName)}
                          >
                            {modelName}
                          </MenuItem>
                        ))
                      ) : isEnabled && (
                        // Show all models when not searching
                        providerUtils.getModels(providerInfo).map(modelName => (
                          <MenuItem 
                            key={modelName}
                            onClick={() => handleModelSelect(providerName, modelName)}
                          >
                            {modelName}
                          </MenuItem>
                        ))
                      )}
                      
                      {isEnabled && !providerUtils.hasModels(providerInfo) && (
                        <MenuItem disabled>
                          {isConfigured 
                            ? (providerErrors[providerName] 
                               ? providerErrors[providerName]
                               : 'Loading models...') 
                            : 'Configure provider first'}
                        </MenuItem>
                      )}
                      
                      {!isEnabled && (
                        <MenuItem 
                          onClick={() => {
                            handleOpenConfig();
                            handleClose();
                          }}
                          sx={{ 
                            color: 'primary.main',
                            fontWeight: 'medium'
                          }}
                        >
                          Configure {providerName}
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
            onClick={handleDarkModeToggle}
            size="small"
            color="inherit"
            title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {settings.darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          
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
        onClose={() => {
          // Only allow closing if at least one provider is enabled
          if (providerUtils.isAnyProviderEnabled(settings.providers)) {
            setConfigOpen(false);
          }
        }}
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
          minWidth: 400,
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <h2>Provider Configuration</h2>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={handleDarkModeToggle}
                    name="darkMode"
                    color="primary"
                  />
                }
                label={settings.darkMode ? "Dark Mode" : "Light Mode"}
              />
              <IconButton 
                onClick={() => setFaqOpen(true)}
                size="small"
                color="primary"
                title="Frequently Asked Questions"
              >
                <HelpOutlineIcon />
              </IconButton>
            </Box>
          </Box>
          {!providerUtils.isAnyProviderEnabled(settings.providers) && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
              <Typography variant="h6">Welcome to DeepRead!</Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                To get started, please configure at least one AI provider below.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Quick setup guide:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li>For OpenAI: Enter your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>OpenAI dashboard</a></li>
                <li>For Anthropic: Enter your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>Anthropic console</a></li>
                <li>For Ollama: Enter the base URL (e.g., http://localhost:11434) where Ollama is running</li>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Click "Test & Enable" after entering your credentials to connect.
              </Typography>
            </Box>
          )}
          {Object.entries(settings.providers).map(([providerName, providerInfo]) => (
            <Box key={providerName} sx={{ mb: 3, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{mt: 2, mb: 1}}>{providerName}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tempSettings[providerName]?.enabled ? (
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CheckCircleIcon fontSize="small" />
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CancelIcon fontSize="small" />
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {providerErrors[providerName] && (
                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                  Error: {providerErrors[providerName]}
                </Typography>
              )}
              
              {providerSuccess[providerName] && (
                <Typography color="success.main" variant="body2" sx={{ mb: 2 }}>
                  {providerSuccess[providerName]}
                </Typography>
              )}
              
              <TextField
                key={`${providerName}-api_key`}
                label="API Key"
                value={tempSettings[providerName]?.api_key || ''}
                onChange={(e) => {
                  setTempSettings(prev => ({
                    ...prev,
                    [providerName]: {
                      ...prev[providerName],
                      api_key: e.target.value
                    }
                  }));
                }}
                required={providerName !== 'ollama'}
                type="password"
                fullWidth
                margin="normal"
                size="small"
              />
              
              <TextField
                key={`${providerName}-base_url`}
                label="Base URL"
                value={tempSettings[providerName]?.base_url || ''}
                onChange={(e) => {
                  setTempSettings(prev => ({
                    ...prev,
                    [providerName]: {
                      ...prev[providerName],
                      base_url: e.target.value
                    }
                  }));
                }}
                required={providerName === 'ollama'}
                type="text"
                fullWidth
                margin="normal"
                size="small"
              />
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                {tempSettings[providerName]?.enabled ? (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDisableProvider(providerName)}
                    disabled={providerLoading[providerName]}
                  >
                    Disable
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleSaveProviderConfig(providerName)}
                    disabled={providerLoading[providerName]}
                  >
                    {providerLoading[providerName] ? 'Testing connection...' : 'Test & Enable'}
                  </Button>
                )}
              </Box>
            </Box>
          ))}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              onClick={() => setConfigOpen(false)}
              disabled={!providerUtils.isAnyProviderEnabled(settings.providers)}
            >
              {providerUtils.isAnyProviderEnabled(settings.providers) 
                ? 'Close' 
                : 'Please enable at least one provider'}
            </Button>
          </Box>
        </Box>
      </Modal>
      
      {/* FAQ Modal */}
      <Modal
        open={faqOpen}
        onClose={() => setFaqOpen(false)}
        aria-labelledby="faq-modal"
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
          width: '600px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
            Frequently Asked Questions
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="bold">
                Is it safe to enter my API keys?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Yes, your API keys are completely safe. DeepRead is a static application that runs entirely on your device.
              </Typography>
              <Typography variant="body1" paragraph>
                Your API keys are:
              </Typography>
              <Typography component="ul" sx={{ pl: 2 }}>
                <li>Stored locally on your device only</li>
                <li>DeepRead has no backend servers at all</li>
                <li>Only used to communicate directly with your chosen AI provider (OpenAI, Anthropic, etc.)</li>
                <li>Transmitted securely using HTTPS to the provider's API</li>
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                DeepRead is a completely client-side application with no backend server. Your data and API keys never leave your device except when making direct API calls to your chosen AI provider.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="bold">
                Where are my API keys stored?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                Your API keys are stored locally in your browser's localStorage (for the web version) or in your system's application data (for the desktop version). They never leave your device except when making direct API calls to your chosen provider.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="bold">
                Do you track my API usage or conversations?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                No. DeepRead does not track, store, or have access to your conversations or API usage. All interactions with AI models happen directly between your device and the AI provider. We have no way to access or monitor these communications.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight="bold">
                Is DeepRead open source?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Yes! DeepRead is an open-source project. You can view the source code, contribute, or report issues on GitHub:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
                <Button 
                  variant="outlined" 
                  component="a" 
                  href="https://github.com/qnkhuat/deepread" 
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>}
                >
                  github.com/qnkhuat/deepread
                </Button>
              </Box>
              <Typography variant="body1">
                We welcome feedback, feature requests, and contributions from the community!
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              onClick={() => setFaqOpen(false)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
}

export default TopBar; 
