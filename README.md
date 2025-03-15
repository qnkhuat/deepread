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

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

Copyright 2025 qn.khuat@gmail.com

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
