import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { SettingsProvider } from './contexts/SettingsContext';
import TopBar from './components/TopBar';
import Viewer from './pages/Viewer';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SettingsProvider>
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
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App; 
