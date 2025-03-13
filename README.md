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

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

#### Option 1: Install via npm

```bash
npm install -g deepread
```

After installation, you can run the application:

```bash
deepread
```

#### Option 2: Clone the repository

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/DeepRead.git
   cd DeepRead
   ```

2. Install dependencies:
   ```
   cd frontend
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Running as an Electron App

To run the application as an Electron desktop app:

1. Install dependencies in the root directory:
   ```
   npm install
   ```

2. Run the Electron development version:
   ```
   npm run dev:electron
   ```

### Building for Production

#### Web Version
```
cd frontend
npm run build
```

The built files will be in the `frontend/dist` directory.

#### Desktop App (Electron)
```
npm run build:electron
```

This will create platform-specific installers in the `out/make` directory.

## Usage

1. Open the application in your browser or desktop app
2. Configure your LLM provider API keys in the settings
3. Upload a PDF document
4. Chat with the AI about the document content

## Supported LLM Providers

- OpenAI (GPT-3.5, GPT-4, etc.)
- Anthropic (Claude models)
- Mistral AI
- DeepSeek
- Ollama (local models)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering and text extraction
- [OpenAI](https://openai.com/) for the API client library
- [React](https://reactjs.org/) and [Material-UI](https://mui.com/) for the frontend framework
- [Electron](https://www.electronjs.org/) for the desktop application framework
