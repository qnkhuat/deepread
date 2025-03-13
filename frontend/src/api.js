/**
 * API service for DeepRead application
 * This file centralizes all API calls to LLM providers and PDF processing
 */

import {OpenAI} from 'openai';
import * as pdfjs from 'pdfjs-dist';

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Send a chat request directly to the LLM provider
 * @param {Array} messages - Array of message objects with content and role
 * @param {Object} providerConfig - Configuration for the AI provider
 * @param {Function} onChunk - Callback function for streaming responses
 * @returns {Promise<Object>} - The response content
 */
export const postChat = async (messages, providerConfig, onChunk) => {
  try {
    const {provider_name, model_name, config} = providerConfig;
    const client = configToClient(provider_name, config);

    // Create the request parameters
    const requestParams = {
      model: model_name,
      messages: messages,
      stream: true,
    };

    // Make the streaming request
    const stream = await client.chat.completions.create(requestParams);

    // Track total completion tokens for cost calculation
    let completion_tokens = 0;

    // Process the stream
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices[0].delta.content) {
        const content = chunk.choices[0].delta.content;
        // Rough estimate of tokens (characters / 4)
        completion_tokens += content.length / 4;

        // Pass the content to the callback
        if (onChunk) onChunk({content});
      }
    }

    // Calculate input tokens (rough estimate)
    const input_tokens = messages.reduce((total, msg) => {
      return total + (msg.content ? msg.content.length / 4 : 0);
    }, 0);

    // Calculate cost based on the model and provider
    const cost = calculateCost(
      provider_name,
      model_name,
      input_tokens,
      completion_tokens
    );

    // Send a completion signal with usage data
    if (onChunk) onChunk({
      done: true,
      usage: {
        input_tokens,
        completion_tokens,
        cost
      }
    });

    return {success: true};
  } catch (error) {
    console.error('Error in chat request:', error);
    if (onChunk) onChunk({error: error.message || 'Failed to get chat response'});
    throw error;
  }
};

/**
 * Convert a PDF file to markdown text
 * @param {File} file - The PDF file to process
 * @returns {Promise<Object>} - The processed content
 */
export const postToMarkdown = async (file) => {
  try {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load the PDF document
    const pdf = await pdfjs.getDocument({data: arrayBuffer}).promise;

    // Extract text from all pages
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');

      // Add page number and text
      fullText += `## Page ${i}\n\n${pageText}\n\n`;
    }
    console.log(fullText);

    return {content: fullText};
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF file');
  }
};

/**
 * Fetch available models for a provider
 * @param {string} providerName - Name of the provider
 * @param {Object} config - Provider configuration
 * @returns {Promise<Array>} - List of available models
 */
export const getModels = async (providerName, config) => {
  try {
    const client = configToClient(providerName, config);
    const models = await client.models.list();
    return models.data.map(model => model.id);
  } catch (error) {
    console.error('Error fetching models:', error);
    throw new Error(error.message || 'Failed to fetch models');
  }
};

/**
 * Create a client for the specified provider
 * @param {string} providerName - Name of the provider
 * @param {Object} config - Provider configuration
 * @returns {Object} - The client instance
 */
function configToClient(providerName, config) {
  const {api_key, base_url} = config;

  if (providerName === "anthropic") {
    return new OpenAI({
      apiKey: api_key,
      baseURL: base_url || "https://api.anthropic.com/v1",
      defaultHeaders: {
        "anthropic-version": "2023-06-01",
        "x-api-key": api_key
      },
      dangerouslyAllowBrowser: true
    });
  } else {
    return new OpenAI({
      apiKey: api_key,
      baseURL: base_url,
      dangerouslyAllowBrowser: true
    });
  }
}

/**
 * Calculate the cost based on provider, model and token counts
 * @param {string} provider_name - Name of the provider
 * @param {string} model_name - Name of the model
 * @param {number} input_tokens - Number of input tokens
 * @param {number} completion_tokens - Number of completion tokens
 * @returns {number} - The calculated cost
 */
function calculateCost(provider_name, model_name, input_tokens, completion_tokens) {
  // Default rates (per 1000 tokens)
  const rates = {
    "openai": {
      "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},
      "gpt-3.5-turbo-16k": {"input": 0.0015, "output": 0.002},
      "gpt-4": {"input": 0.03, "output": 0.06},
      "gpt-4-32k": {"input": 0.06, "output": 0.12},
      "gpt-4-turbo": {"input": 0.01, "output": 0.03},
      "gpt-4o": {"input": 0.005, "output": 0.015},
      "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
      "gpt-4o-realtime": {"input": 0.002, "output": 0.01},
      "gpt-4o-mini-realtime": {"input": 0.0006, "output": 0.0024},
      "o1-preview": {"input": 0.015, "output": 0.06},
      "o1": {"input": 0.015, "output": 0.06},
      "o1-mini": {"input": 0.001, "output": 0.004},
      "o3-mini": {"input": 0.001, "output": 0.004},
    },
    "anthropic": {
      "claude-3-opus": {"input": 0.015, "output": 0.075},
      "claude-3-sonnet": {"input": 0.003, "output": 0.015},
      "claude-3-haiku": {"input": 0.00025, "output": 0.00125},
      "claude-3.5-sonnet": {"input": 0.003, "output": 0.015},
      "claude-3.5-haiku": {"input": 0.0008, "output": 0.004},
      "claude-3.7-sonnet": {"input": 0.003, "output": 0.015},
    },
    "deepseek": {
      "deepseek-v3": {"input": 0.0, "output": 0.0},
      "deepseek-r1": {"input": 0.00055, "output": 0.00219},
    },
    "mistral": {
      "mistral-small": {"input": 0.001, "output": 0.003},
      "mistral-medium": {"input": 0.0027, "output": 0.0081},
      "mistral-large": {"input": 0.008, "output": 0.024},
    }
  };

  // Get the model rates or use some defaults
  const provider_rates = rates[provider_name.toLowerCase()] || {};

  // Check for exact model match
  let model_rates;
  if (model_name in provider_rates) {
    model_rates = provider_rates[model_name];
  } else {
    // Try to find a model with a similar name
    for (const model_key in provider_rates) {
      if (model_name.includes(model_key)) {
        model_rates = provider_rates[model_key];
        break;
      }
    }

    // Default rates if no match is found
    if (!model_rates) {
      model_rates = {"input": 0.001, "output": 0.002};
    }
  }

  // Calculate the cost
  const input_cost = (input_tokens / 1000) * model_rates.input;
  const output_cost = (completion_tokens / 1000) * model_rates.output;
  const total_cost = input_cost + output_cost;

  return Math.round(total_cost * 1000000) / 1000000;  // Round to 6 decimal places
}
