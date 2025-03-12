import ReactMarkdown from 'react-markdown';
import {Box, Stack, TextField, Button, Paper, CircularProgress, Typography} from '@mui/material';
import {useEffect, useRef, useState} from 'react';
import * as providerUtils from '@/utils/providerUtils';
import EditIcon from '@mui/icons-material/Edit';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  messagesContainer: {
    flexGrow: 1,
    overflow: 'auto',
    p: 2
  },
  message: {
    base: {
      p: '10px 16px',
      borderRadius: 2,
      maxWidth: '80%',
      pt: 0,
      pb: 0,
      position: 'relative',
      '&:hover .edit-button': {
        opacity: 1,
        visibility: 'visible',
      }
    },
    user: {
      ml: 'auto',
      mr: 0,
      alignSelf: 'flex-end',
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
    },
    assistant: {
      ml: 0,
      mr: 'auto',
      alignSelf: 'flex-start',
      bgcolor: 'background.paper',
      color: 'text.primary',
      boxShadow: 'none',
    },
    assistant_latest: {
      height: 'calc(100vh - 250px)',
    }
  },
  editButton: {
    container: {
      position: 'absolute',
      top: '50%',
      left: -40,
      transform: 'translateY(-50%)',
      opacity: 0,
      visibility: 'hidden',
      transition: 'opacity 0.2s, visibility 0.2s',
    },
    button: {
      minWidth: 'auto',
      p: 0.5,
      minHeight: '24px',
      lineHeight: 1
    }
  },
  editForm: {
    p: 1
  },
  editTextField: {
    width: '100%'
  },
  editActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    mt: 1
  },
  cancelButton: {
    mr: 1
  },
  loader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    py: 1
  },
  suggestedPromptsContainer: {
    p: 2,
    borderTop: '1px solid #e0e0e0'
  },
  suggestedPromptsTitle: {
    mb: 1
  },
  suggestedPromptsList: {
    flexWrap: 'wrap',
    gap: 1
  },
  inputContainer: {
    p: 2,
    borderTop: 1,
    borderColor: 'divider'
  },
  form: {
    display: 'flex',
    gap: 1
  },
  input: {
    flex: 1
  },
  costDisplay: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    textAlign: 'left',
    mt: 1
  }
};

function Chat({messages, inputMessage, setInputMessage, handleSendMessage, suggestedPrompts = [], handleSuggestedPrompt, onEditMessage, sessionCost = 0}) {
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastUserMessageRef = useRef(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [shouldScrollToLastUserMessage, setShouldScrollToLastUserMessage] = useState(false);

  const isTyping = messages.some(message =>
    message.role === 'assistant' && message.isStreaming
  );

  useEffect(() => {
    if (shouldScrollToLastUserMessage && lastUserMessageRef.current) {
      lastUserMessageRef.current.scrollIntoView({behavior: 'smooth'});
      setShouldScrollToLastUserMessage(false);
    }
  }, [shouldScrollToLastUserMessage]);

  const wrappedHandleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    handleSendMessage(e);
    setShouldScrollToLastUserMessage(true);
  };

  const handleEditMessage = (index) => {
    setEditingIndex(index);
    setEditedMessage(messages[index].content);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedMessage('');
  };

  const saveEdit = (index) => {
    if (editedMessage.trim() !== '' && editedMessage !== messages[index].content) {
      onEditMessage(index, editedMessage);
    }
    setEditingIndex(null);
    setEditedMessage('');
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.messagesContainer} ref={messagesContainerRef}>
        <Stack spacing={2}>
          {messages.map((message, index) => {
            if (message.hide) return null;

            // Determine if this is the last user message
            const isLastUserMessage = message.role === 'user' &&
              messages.slice(index + 1).every(m => m.role !== 'user' || m.hide);

            const messageStyle = {
              ...styles.message.base,
              ...(message.role === 'user' ? styles.message.user : styles.message.assistant),
              ...(index == messages.length - 1 && message.role === 'assistant' ? styles.message.assistant_latest : {})
            };

            return (
              <Paper
                key={index}
                elevation={1}
                ref={isLastUserMessage ? lastUserMessageRef : null}
                sx={messageStyle}
              >
                {message.role === 'user' && (
                  <Box
                    className="edit-button"
                    sx={styles.editButton.container}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      sx={styles.editButton.button}
                      onClick={() => handleEditMessage(index)}
                    >
                      <EditIcon fontSize="small" />
                    </Button>
                  </Box>
                )}
                {editingIndex === index ? (
                  <Box sx={styles.editForm}>
                    <TextField
                      fullWidth
                      multiline
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      size="small"
                      autoFocus
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        }
                      }}
                    />
                    <Box sx={styles.editActions}>
                      <Button size="small" onClick={cancelEdit} sx={styles.cancelButton}>
                        Cancel
                      </Button>
                      <Button size="small" variant="contained" onClick={() => saveEdit(index)}>
                        Save
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    {message.content && <ReactMarkdown>{message.content}</ReactMarkdown>}
                    {!message.content && message.role === 'assistant' && (
                      <Box sx={styles.loader}>
                        <CircularProgress size={16} />
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            );
          })}
          <div ref={messageEndRef} />
        </Stack>
      </Box>

      {suggestedPrompts.length > 0 && (
        <Box sx={styles.suggestedPromptsContainer}>
          <Stack direction="row" sx={styles.suggestedPromptsList}>
            {suggestedPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outlined"
                size="small"
                onClick={() => handleSuggestedPrompt(prompt)}
                sx={{ml: 0}}
              >
                {prompt}
              </Button>
            ))}
          </Stack>
        </Box>
      )}

      <Paper
        elevation={2}
        sx={styles.inputContainer}
      >
        <Box
          component="form"
          onSubmit={wrappedHandleSendMessage}
          sx={styles.form}
        >
          <TextField
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question..."
            multiline
            maxRows={4}
            size="small"
            sx={styles.input}
            disabled={isTyping}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                wrappedHandleSendMessage(e);
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isTyping}
          >
            Send
          </Button>
        </Box>
        <Typography sx={styles.costDisplay}>
          Session cost: ${sessionCost > 0 ? sessionCost.toFixed(6) : '0.000000'}
        </Typography>
      </Paper>
    </Box>
  );
}

export default Chat;
