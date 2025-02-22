import ReactMarkdown from 'react-markdown';
import { Box, Stack, TextField, Button, Paper } from '@mui/material';

function Chat({ messages, inputMessage, setInputMessage, handleSendMessage }) {
  return (
    <Stack sx={{ height: '100%', spacing: 0 }}>
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
        <Stack spacing={2}>
          {messages.filter(message => !message.hide).map((message, index) => (
            <Paper
              key={index}
              elevation={1}
              sx={{
                p: '10px 16px',
                borderRadius: 2,
                maxWidth: '80%',
                ml: message.role === 'user' ? 'auto' : 0,
                bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                color: message.role === 'user' ? 'primary.contrastText' : 'text.primary'
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Paper>
          ))}
        </Stack>
      </Box>

      <Paper 
        elevation={2} 
        sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
      >
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{ display: 'flex', gap: 1 }}
        >
          <TextField
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question..."
            multiline
            maxRows={4}
            size="small"
            sx={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button type="submit" variant="contained">
            Send
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
}

export default Chat; 
