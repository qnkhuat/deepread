import ReactMarkdown from 'react-markdown';
import { Paper, Stack, Textarea, Button, ScrollArea } from '@mantine/core';

function Chat({ messages, inputMessage, setInputMessage, handleSendMessage }) {
  return (
    <Stack h="100%" spacing={0}>
      <ScrollArea flex={1} p="md">
        <Stack gap="md">
          {messages.filter(message => !message.hide).map((message, index) => (
            <Paper
              key={index}
              style={{
                marginTop: 0,
                marginBottom: 0,
                padding: '10px 16px',
                borderRadius: '8px',
                maxWidth: '80%',
                marginLeft: message.role === 'user' ? 'auto' : 0,
                backgroundColor: message.role === 'user' ? '#007bff' : 'white',
                color: message.role === 'user' ? 'white' : 'inherit'
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Paper>
          ))}
        </Stack>
      </ScrollArea>

      <Paper p="md" withBorder>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question..."
            autosize
            minRows={1}
            maxRows={4}
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button type="submit">Send</Button>
        </form>
      </Paper>
    </Stack>
  );
}

export default Chat; 
