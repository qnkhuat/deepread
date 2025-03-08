/**
 * API service for DeepRead application
 * This file centralizes all API calls to the backend
 */

// Helper function to get the backend URL
const getBackendURL = () => {
  return window.electron
    ? `http://localhost:${window.electron.getBackendPort()}`
    : 'http://localhost:8345';
};

/**
 * Send a chat request to the backend
 * @param {Array} messages - Array of message objects with content and role
 * @param {Object} providerConfig - Configuration for the AI provider
 * @param {Function} onChunk - Callback function for streaming responses
 * @returns {Promise<Object>} - The response content
 */
export const postChat = async (messages, providerConfig, onChunk) => {
  const response = await fetch(`${getBackendURL()}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: messages,
      llm_config: providerConfig
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get chat response');
  }

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));

          if (data.error) {
            throw new Error(data.error);
          }
          
          // Pass the entire data object to onChunk callback
          if (onChunk) onChunk(data);

          if (data.done) {
            break;
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      }
    }
  }

  return { success: true };
};

/**
 * Upload a PDF file to convert to markdown
 * @param {File} file - The PDF file to upload
 * @returns {Promise<Object>} - The processed content
 */
export const postToMarkdown = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getBackendURL()}/api/to_markdown`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to process PDF file');
  }

  return await response.json();
};

/**
 * Fetch available models for a provider
 * @param {string} providerName - Name of the provider
 * @param {Object} config - Provider configuration
 * @returns {Promise<Array>} - List of available models
 */
export const getModels = async (providerName, config) => {
  const response = await fetch(`${getBackendURL()}/api/models`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider_name: providerName,
      config: config
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch models');
  }

  const data = await response.json();
  return data.models || [];
}; 
