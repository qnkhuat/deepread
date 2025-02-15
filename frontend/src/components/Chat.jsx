import ReactMarkdown from 'react-markdown';

function Chat({ messages, inputMessage, setInputMessage, handleSendMessage }) {
  return (
    <div style={styles.chatSidebar}>
      <div style={styles.chatMessages}>
        {messages.filter(message => !message.hide).map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              ...(message.role === 'user' ? styles.userMessage : styles.botMessage)
            }}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ))}
      </div>
      <form style={styles.inputForm} onSubmit={handleSendMessage}>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={styles.input}
          placeholder="Ask a question..."
          rows="1"
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />
        <button type="submit" style={styles.sendButton}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  chatSidebar: {
    flex: '0 0 25%',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #ccc',
    backgroundColor: '#f5f5f5',
  },
  chatMessages: {
    flex: 1,
    overflow: 'auto',
    padding: '1rem',
  },
  message: {
    margin: '0.5rem 0',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    maxWidth: '80%',
    overflow: 'auto',
  },
  userMessage: {
    backgroundColor: '#007bff',
    color: 'white',
    marginLeft: 'auto',
  },
  botMessage: {
    backgroundColor: '#e9ecef',
    color: 'black',
    marginRight: 'auto',
  },
  inputForm: {
    display: 'flex',
    padding: '1rem',
    borderTop: '1px solid #ccc',
  },
  input: {
    flex: 1,
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginRight: '0.5rem',
    resize: 'none',
    minHeight: '38px',
    maxHeight: '150px',
    overflow: 'auto',
  },
  sendButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Chat; 
