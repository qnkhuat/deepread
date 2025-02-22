import '@mantine/core/styles.css';
import { SettingsProvider } from './contexts/SettingsContext';
import TopBar from './components/TopBar';
import Viewer from './pages/Viewer';
import { MantineProvider, AppShell } from '@mantine/core';

function App() {
  return (
    <MantineProvider>
      <SettingsProvider>
        <AppShell
          header={{ height: 50 }}
          padding="0"
          styles={{
            main: {
              minHeight: '100vh',
              paddingTop: '50px', // Same as header height
              paddingBottom: 0,
            },
          }}
        >
          <AppShell.Header>
            <TopBar />
          </AppShell.Header>
          <AppShell.Main>
            <Viewer />
          </AppShell.Main>
        </AppShell>
      </SettingsProvider>
    </MantineProvider>
  );
}

export default App; 
