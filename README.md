# DeepRead

A desktop application for reading and analyzing PDFs with LLM support.

## Overview

DeepRead is an Electron application with a Python backend that allows users to:
- Read and analyze PDF documents
- Chat with LLMs about the content
- Extract and process text from PDFs

## Development

For local development, you can run:

```bash
# Start the frontend and backend for web development
npm run dev:web

# Start with Electron support
npm run dev:electron
```

## Building the Application

### Development Mode

During development, the frontend and backend run as separate processes:

1. Start the backend:
```bash
cd backend
python main.py
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

### Production Build

To build a standalone executable that includes both the frontend and backend:

```bash
# Run the build script from the root directory
python build.py
```

This will:
1. Build the React frontend
2. Package the frontend with the backend using PyInstaller
3. Create a standalone executable in the `backend/dist` directory

The build script ensures that the frontend is always built before the backend, and the backend build will fail if the frontend build is not found.

You can then run the application with:

```bash
# On macOS/Linux
./backend/dist/backend

# On Windows
backend\dist\backend.exe
```
