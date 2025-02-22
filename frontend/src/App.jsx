import { SettingsProvider } from './contexts/SettingsContext';
import TopBar from './components/TopBar';
import Viewer from './pages/Viewer';

function App() {
  return (
    <SettingsProvider>
      <div className="app" style={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <TopBar />
        <Viewer />
      </div>
    </SettingsProvider>
  );
}

export default App; 
