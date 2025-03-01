import {useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Document, Page, pdfjs} from 'react-pdf';
import {
  Box,
  Stack,
  Button,
  Typography,
  Paper,
  Container,
  Slider
} from '@mui/material';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import Chat from '../components/Chat';
import {useSettings} from '../contexts/SettingsContext';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const systemPrompt = (paperContent) => {
  return {
    content: `
You are provided with the full content of a research paper uploaded by the user in PDF format content of the paper is as follows:
    ${paperContent}

Today's date is ${new Date()}.

Your tasks are as follows:
1. **Understanding the Paper:** Carefully read and interpret the provided paper content.
2. **Responding to the User Instruction:**
   - **If the instruction requests a summary:** Generate a clear and concise summary of the paper. Highlight key points, methodology, findings, and conclusions. If possible, reference sections or page numbers (e.g., [page:3]) to support your summary.
   - **If the instruction is a question about the paper:** Answer the question using only the information provided in the paper. Make sure your answer is accurate and, when relevant, include citations from the paper's sections or pages.
   - **If the instruction requests both summary and questions:** Address each part separately in a well-organized manner.
3. **Formatting Guidelines:**
   - Structure your response in clear paragraphs. Use bullet points if listing key aspects.
   - Keep the language professional, precise, and in the same language as the user's instruction.
   - Avoid including external information not present in the paper.

Ensure that your final answer is detailed, insightful, and directly based on the provided paper content.
  `,
    role: "system",
    hide: true
  }
}

const backendURL = () => {
  return window.electron
    ? `http://localhost:${window.electron.getBackendPort()}`
    : 'http://localhost:8345';
}

// Add this new function before the Viewer component


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
  const [scale, setScale] = useState(1.5);
  const {settings, updateSetting} = useSettings();
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);

  const sendChatRequest = async (messages) => {
    console.log(settings);
    const response = await fetch(`${backendURL()}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        llm_config: {
          provider_name: settings.current_model[0],
          model_name: settings.current_model[1],
          config: settings.providers[settings.current_model[0]].config
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get chat response');
    }

    return response.json();
  }

  const handleFileUpload = async (file) => {
    if (file?.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      // Send file to backend
      const formData = new FormData();
      formData.append('file', file);

      try {
        // Get a summarization of the document
        const fileResponse = await fetch(`${backendURL()}/api/to_markdown`, {
          method: 'POST',
          body: formData,
        });
        const fileData = await fileResponse.json();
        setPdfContent(fileData.content);
        const initialMessages = [systemPrompt(fileData.content)];
        setSuggestedPrompts([
          'Summarize this document',
          'Extract key findings',
          'Explain the methodology',
          'List the main conclusions'
        ]);

        // Just set the document content without adding a message
        // The suggested prompts will be shown separately in the UI
        setMessages(initialMessages);
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
    // Clear suggested prompts when user sends a message
    setSuggestedPrompts([]);

    try {
      // Use the new function
      const data = await sendChatRequest(newMessages);
      setMessages(prevMessages => [...prevMessages, {content: data.content, role: 'assistant'}]);

      // Optionally set new suggested prompts after getting a response
      if (pdfContent) {
        setSuggestedPrompts([
          'Explain this in simpler terms',
          'Provide more details',
          'What are the limitations?',
          'Summarize the key points'
        ]);
      }
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

  const handleScaleChange = (event, newValue) => {
    setScale(newValue);
  };

  const handleSuggestedPrompt = async (promptText) => {
    try {
      // Clear suggested prompts once one is selected
      setSuggestedPrompts([]);

      const newMessages = [...messages, {
        content: promptText,
        role: 'user'
      }];

      setMessages(newMessages);

      // Use the sendChatRequest function
      const data = await sendChatRequest(newMessages);

      // Add the response to chat messages
      setMessages(prevMessages => [...prevMessages, {
        content: data.content,
        role: 'assistant'
      }]);

      // Optionally set new suggested prompts based on the response
      setSuggestedPrompts([]);
    } catch (error) {
      console.error('Error processing prompt:', error);
      setMessages(prevMessages => [...prevMessages, {
        content: 'Sorry, there was an error processing your request. Please try again.',
        role: 'assistant'
      }]);
      setSuggestedPrompts([]);
    }
  };

  const renderDropZone = () => (
    <Box
      sx={{
        height: 'calc(100vh - 50px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: '3px dashed #ccc',
          cursor: 'pointer',
          bgcolor: 'grey.50',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stack spacing={2} alignItems="center">
          <Typography>Drop a PDF file here or</Typography>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileInputChange}
            style={{display: 'none'}}
          />
          <Button
            variant="contained"
            onClick={() => document.querySelector('input[type="file"]').click()}
          >
            Choose File
          </Button>
        </Stack>
      </Paper>
    </Box>
  );

  const renderContent = () => {
    if (!pdfUrl) {
      return renderDropZone();
    }

    return (
      <Box sx={{
        display: 'flex',
        height: 'calc(100vh - 50px)',
        gap: '1px',
        bgcolor: 'grey.100'
      }}>
        {/* PDF Viewer Column */}
        <Box sx={{
          flex: '1 1 70%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Add PDF controls */}
          <Box sx={{
            p: 1,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'white',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Typography variant="body2" sx={{mr: 2}}>Zoom:</Typography>
            <Slider
              value={scale}
              onChange={handleScaleChange}
              min={0.5}
              max={3}
              step={0.1}
              sx={{width: 200}}
            />
          </Box>

          <Paper
            onMouseUp={handleTextSelection}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            sx={{
              height: '100%',
              overflow: 'auto',
              p: 2,
              position: 'relative',
              flexGrow: 1
            }}
          >
            {selection.visible && (
              <Button
                variant="contained"
                size="small"
                onClick={handleAddToChat}
                sx={{
                  position: 'fixed',
                  left: `${selection.position.x}px`,
                  top: `${selection.position.y}px`,
                  zIndex: 1000,
                }}
              >
                Add to chat
              </Button>
            )}
            <Stack spacing={2} alignItems="center" sx={{minWidth: 'fit-content'}}>
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page
                    scale={scale}
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="pdf-page"
                  />
                ))}
              </Document>
            </Stack>
          </Paper>
        </Box>

        {/* Chat Column */}
        <Box sx={{
          flex: '1 1 30%',
          height: '100%',
          overflow: 'hidden'
        }}>
          <Paper
            elevation={1}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Chat
              messages={messages}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              handleSendMessage={handleSendMessage}
              suggestedPrompts={suggestedPrompts}
              handleSuggestedPrompt={handleSuggestedPrompt}
            />
          </Paper>
        </Box>
      </Box>
    );
  };

  return (
    renderContent()
  );
}

// Keep only the PDF page styles
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
