import { useSettings } from '../contexts/SettingsContext';
import { Container, Modal, TextField, IconButton, Select, MenuItem, ListSubheader, Box, Typography, Button, Menu } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';

function TopBar() {
  const { settings, updateSetting } = useSettings();
  const [configOpen, setConfigOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);

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
            <img src="/icon/png/64x64.png" alt="DeepRead Logo" style={{ height: '32px', width: 'auto' }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={handleClick}
            variant="outlined"
          >
            {settings.current_model[0]} - {settings.current_model[1]}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            {Object.entries(settings.providers).map(([providerName, providerInfo]) => (
              <div key={providerName}>
                <ListSubheader>{providerName}</ListSubheader>
                {providerInfo.models.map(modelName => (
                  <MenuItem 
                    key={modelName}
                    onClick={() => handleModelSelect(providerName, modelName)}
                  >
                    {modelName}
                  </MenuItem>
                ))}
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
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={() => setConfigOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save</Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
}

export default TopBar; 
