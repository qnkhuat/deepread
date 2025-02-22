import { useSettings } from '../contexts/SettingsContext';

function TopBar() {
  const { settings, updateSetting } = useSettings();
  console.log('Current settings in TopBar:', settings);

  const styles = {
    topBar: {
      height: '50px',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      flexShrink: 0,
    },
    topBarLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    topBarRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    modelSelect: {
      padding: '8px 16px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
    },
  };

  return (
    <div id="top-bar" style={styles.topBar}>
      <div style={styles.topBarLeft}>
        <span>TopBar</span>
      </div>
      <div style={styles.topBarRight}>
        <select
          value={settings.model}
          onChange={(e) => {
            const value = e.target.value;
            updateSetting('model', value);
          }}
          style={styles.modelSelect}
        >
          <option value="qwen2.5">Qwen 2.5</option>
          <option value="gpt-4o-mini">GPT-4o-mini</option>
          <option value="grok-2-1212">Grok 2 12 12</option>
        </select>
      </div>
    </div>
  );
}

export default TopBar; 
