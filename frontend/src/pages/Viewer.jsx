import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();;

function Viewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selection, setSelection] = useState({
    text: '',
    position: { x: 0, y: 0 },
    visible: false
  });

  // If no PDF URL is provided, redirect to upload page
  if (!location.state?.pdfUrl) {
    navigate('/');
    return null;
  }

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    setMessages([...messages, { text: inputMessage, sender: 'user' }]);
    setInputMessage('');
    // TODO: Add LLM integration here
  };

  const handleTextSelection = () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelection({
        text: selectedText,
        position: { x: rect.left, y: rect.top - 40 }, // Position button above selection
        visible: true
      });
    } else {
      setSelection(prev => ({ ...prev, visible: false }));
    }
  };

  const handleAddToChat = () => {
    setMessages([...messages, { text: selection.text, sender: 'user' }]);
    setSelection(prev => ({ ...prev, visible: false }));
    window.getSelection().removeAllRanges();
  };

  return (
    <div style={styles.container}>
      <div style={styles.documentContainer} onMouseUp={handleTextSelection}>
        {selection.visible && (
          <button
            onClick={handleAddToChat}
            style={{
              ...styles.addToChatButton,
              position: 'fixed',
              left: `${selection.position.x}px`,
              top: `${selection.position.y}px`,
            }}
          >
            Add to chat
          </button>
        )}
        <Document
          file={location.state.pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page 
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          ))}
        </Document>
      </div>
      <div style={styles.chatSidebar}>
        <div style={styles.chatMessages}>
          {messages.map((message, index) => (
            <div 
              key={index} 
              style={{
                ...styles.message,
                ...(message.sender === 'user' ? styles.userMessage : styles.botMessage)
              }}
            >
              {message.text}
            </div>
          ))}
        </div>
        <form style={styles.inputForm} onSubmit={handleSendMessage}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            style={styles.input}
            placeholder="Ask a question..."
          />
          <button type="submit" style={styles.sendButton}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100vh',
  },
  documentContainer: {
    flex: '1 1 70%',
    maxHeight: '100vh',
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  },
  chatSidebar: {
    flex: '0 0 30%',
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
  },
  sendButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  addToChatButton: {
    padding: '4px 8px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    zIndex: 1000,
    fontSize: '14px',
  },
};

export default Viewer; 
