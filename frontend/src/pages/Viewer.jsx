import {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Document, Page, pdfjs} from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import ReactMarkdown from 'react-markdown';
import Chat from '../components/Chat';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function systemPrompt(paperContent) {
  return {
    content: `
You are provided with the full content of a research paper uploaded by the user in PDF format.
The content of the paper is as follows:
    ${paperContent}

Today's date is ${new Date()}.

Your tasks are as follows:
1. **Understanding the Paper:** Carefully read and interpret the provided paper content.
2. **Responding to the User Instruction:**
   - **If the instruction requests a summary:** Generate a clear and concise summary of the paper. Highlight key points, methodology, findings, and conclusions. If possible, reference sections or page numbers (e.g., [page:3]) to support your summary.
   - **If the instruction is a question about the paper:** Answer the question using only the information provided in the paper. Make sure your answer is accurate and, when relevant, include citations from the paper’s sections or pages.
   - **If the instruction requests both summary and questions:** Address each part separately in a well-organized manner.
3. **Formatting Guidelines:**
   - Structure your response in clear paragraphs. Use bullet points if listing key aspects.
   - Keep the language professional, precise, and in the same language as the user’s instruction.
   - Avoid including external information not present in the paper.

Ensure that your final answer is detailed, insightful, and directly based on the provided paper content.
  `,
    role: "system",
    hide: true
  }
}

const BACKEND_URL = 'http://localhost:8000';

function Viewer() {
  const [numPages, setNumPages] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selection, setSelection] = useState({
    text: '',
    position: {x: 0, y: 0},
    visible: false
  });
  const [pdfContent, setPdfContent] = useState('');
  const [selectedModel, setSelectedModel] = useState('qwen2.5');

  const handleFileUpload = async (file) => {
    if (file?.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      // Send file to backend
      const formData = new FormData();
      formData.append('file', file);

      try {
        // Get a summarization of the document
        const fileResponse = await fetch(`${BACKEND_URL}/to_markdown`, {
          method: 'POST',
          body: formData,
        });
        const fileData = await fileResponse.json();
        setPdfContent(fileData.content);
        messages.push(systemPrompt(fileData.content));
        messages.push({content: `Please summarize the paper.`, role: 'user', hide: true});

        // Request summary from chat endpoint
        const response = await fetch(`${BACKEND_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            messages: JSON.stringify(messages),
            model_name: selectedModel
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to get chat response');
        }

        const data = await response.json();

        // Add the summary to chat messages
        setMessages([
          ...messages,
          {content: data.content, role: 'assistant'}
        ]);
      } catch (error) {
        console.error('Error processing file:', error);
        setMessages([
          ...messages,
          {content: 'Error processing the document. Please try again.', role: 'assistant'},
        ]);
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    await handleFileUpload(file);
  };

  // Update the file input onChange handler
  const handleFileInputChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  async function onDocumentLoadSuccess(document) {
    setNumPages(document.numPages);

    // Extract text from all pages
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newUserMessage = {content: inputMessage, role: 'user'};
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInputMessage('');

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          messages: JSON.stringify(newMessages),
          model_name: selectedModel
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get chat response');
      }

      const data = await response.json();
      setMessages(prevMessages => [...prevMessages, {content: data.content, role: 'assistant'}]);
    } catch (error) {
      console.error('Error getting chat response:', error);
      setMessages(prevMessages => [...prevMessages, {
        content: 'Sorry, there was an error processing your message. Please try again.',
        role: 'assistant'
      }]);
    }
  };

  const handleTextSelection = () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({
        text: selectedText,
        position: {x: rect.left, y: rect.top - 40}, // Position button above selection
        visible: true
      });
    } else {
      setSelection(prev => ({...prev, visible: false}));
    }
  };

  const handleAddToChat = () => {
    setInputMessage(selection.text);
    setSelection(prev => ({...prev, visible: false}));
    window.getSelection().removeAllRanges();
  };

  const renderTopBar = () => (
    <div style={styles.topBar}>
      <div style={styles.topBarLeft}>
        {/* Add other left-aligned items here */}
      </div>
      <div style={styles.topBarRight}>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={styles.modelSelect}
        >
          <option value="qwen2.5">Qwen 2.5</option>
          <option value="gpt-4o-mini">GPT-4o-mini</option>
          <option value="grok-2-1212">Grok 2 12 12</option>
        </select>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!pdfUrl) {
      return (
        <div
          style={styles.dropZone}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div style={styles.dropZoneContent}>
            <p>Drop a PDF file here or</p>
            <input type="file"
              accept="application/pdf"
              onChange={handleFileInputChange}
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

    return (
      <div style={styles.mainContent}>
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
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                scale={2}
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="pdf-page"
              />
            ))}
          </Document>
        </div>
        <Chat
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
        />
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {renderTopBar()}
      {renderContent()}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  documentContainer: {
    flex: '1 1 70%',
    height: '100%',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    gap: '20px',
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
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px dashed #ccc',
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
  topBar: {
    height: '50px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
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
  mainContent: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    overflow: 'hidden',
  },
};

// Add this CSS somewhere in your stylesheet or create a new one
const pageStyles = `
  .pdf-page {
    border: 1px solid #ccc;
    box-shadow: 0 0 10px rgba(0,0,0,.2);
    margin-bottom: 20px;
  }
`;

// Add a style tag to the component
const styleTag = document.createElement('style');
styleTag.textContent = pageStyles;
document.head.appendChild(styleTag);

export default Viewer;
