import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import TopBar from './components/TopBar';
import Viewer from './pages/Viewer';
import { useMemo } from 'react';

// Create a theme instance based on dark mode preference
function AppContent() {
  const { settings } = useSettings();
  
  // Create a theme that respects the dark mode preference
  const theme = useMemo(() => createTheme({
    palette: {
      mode: settings.darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: settings.darkMode ? '#121212' : '#fff',
        paper: settings.darkMode ? '#1e1e1e' : '#fff',
      },
    },
  }), [settings.darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <Viewer />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App; 
