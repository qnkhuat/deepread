import { useSettings } from '../contexts/SettingsContext';
import { Container, Modal, TextField, IconButton, Select, MenuItem, Box, Typography, Button } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';

function TopBar() {
  const { settings, updateSetting } = useSettings();
  const [configOpen, setConfigOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState({});

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
                  value={tempSettings[providerName]?.config[key]?.value || config.default || ''}
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
