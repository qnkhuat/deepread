import { useSettings } from '../contexts/SettingsContext';
import { Group, Select, Container } from '@mantine/core';

function TopBar() {
  const { settings, updateSetting } = useSettings();
  console.log('Current settings in TopBar:', settings);

  return (
    <Container fluid h="100%">
      <Group justify="space-between" h="100%">
        <Group>
        </Group>
        <Group>
          <Select
            value={settings.model}
            onChange={(value) => updateSetting('model', value)}
            data={[
              { value: 'qwen2.5', label: 'Qwen 2.5' },
              { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
              { value: 'grok-2-1212', label: 'Grok 2 12 12' }
            ]}
          />
        </Group>
      </Group>
    </Container>
  );
}

export default TopBar; 
