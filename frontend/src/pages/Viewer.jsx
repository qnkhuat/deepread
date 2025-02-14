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
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selection, setSelection] = useState({
    text: '',
    position: { x: 0, y: 0 },
    visible: false
  });

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Update the drop zone render when no PDF
  if (!pdfUrl && !location.state?.pdfUrl) {
    return (
      <div 
        style={styles.dropZone}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div style={styles.dropZoneContent}>
          <p>Drop a PDF file here or</p>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setPdfUrl(url);
              }
            }}
            style={styles.fileInput}
          />
          <button 
            onClick={() => document.querySelector('input[type="file"]').click()}
            style={styles.uploadButton}
          >
            Choose File
          </button>
        </div>
      </div>
    );
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
      <div 
        style={styles.documentContainer} 
        onMouseUp={handleTextSelection}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
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
          file={pdfUrl || location.state.pdfUrl}
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
  dropZone: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #ccc',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
  },
  dropZoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default Viewer; 
