# DeepRead

DeepRead is a PDF reader application that allows you to chat with your documents using AI. It processes PDFs and lets you interact with them using various LLM providers.

## Features

- Upload and view PDF documents
- Extract text from PDFs
- Chat with AI about the document content
- Support for multiple LLM providers (OpenAI, Anthropic, etc.)
- Cost tracking for API usage

## Frontend-Only Architecture

This application is designed to run entirely in the browser without a backend server. All PDF processing and LLM interactions happen directly in the frontend:

- PDF processing is done using PDF.js
- LLM interactions use the OpenAI JavaScript client library
- All API keys are stored locally in the browser

## Usage

1. Open the application in your browser or desktop app
2. Configure your LLM provider API keys in the settings
3. Upload a PDF document
4. Chat with the AI about the document content

## Supported LLM Providers

- OpenAI
- Anthropic
- DeepSeek
- Ollama (local models)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE.txt) file for details.
