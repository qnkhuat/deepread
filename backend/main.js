require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const fs = require('fs');
const pdf = require('pdf-parse');
const fileUpload = require('express-fileupload');

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  useTempFiles: false // Changed to false to handle files in memory
}));

// Helper function to create OpenAI client with custom configuration
function createChatClient(providerName, modelName, config) {
  if (providerName.startsWith('openai')) {
    return new OpenAI({
      apiKey: config.api_key.value,
      baseURL: config.base_url.value,
    });
  }
  // Note: Other providers like Anthropic and Ollama would need their own client implementations
  throw new Error(`Provider ${providerName} not supported in this version`);
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, llm_config } = req.body;
    const { provider_name, model_name, config } = llm_config;

    const client = createChatClient(provider_name, model_name, config);

    // Convert messages to OpenAI format
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name && { name: msg.name })
    }));

    const completion = await client.chat.completions.create({
      model: model_name,
      messages: formattedMessages
    });

    // Match Python API response format
    const response = {
      replies: [{
        role: completion.choices[0].message.role,
        content: completion.choices[0].message.content
      }]
    };

    return res.json(response.replies[0]);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PDF processing endpoint
app.post('/api/to_markdown', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    
    // Ensure we're working with a PDF file
    if (!file.mimetype || !file.mimetype.includes('pdf')) {
      return res.status(400).json({ error: 'Uploaded file must be a PDF' });
    }

    try {
      const data = await pdf(file.data);
      return res.json({ content: data.text });
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return res.status(400).json({ error: 'Could not parse PDF file. Please ensure it is a valid PDF.' });
    }
  } catch (error) {
    console.error('PDF processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
