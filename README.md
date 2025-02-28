# DeepRead

A desktop application for reading and analyzing PDFs with LLM support.

## Overview

DeepRead is an Electron application with a Python backend that allows users to:
- Read and analyze PDF documents
- Chat with LLMs about the content
- Extract and process text from PDFs

## Architecture

- **Frontend**: React application served by Electron
- **Backend**: Python Flask API packaged as an executable
- **Desktop Wrapper**: Electron application that manages both components

## Development Setup

### Prerequisites

- Node.js (v16+)
- Python 3.8+
- npm or yarn

### macOS Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/DeepRead.git
   cd DeepRead
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   cd ..
   ```

3. Set up the Python backend:
   ```
   cd backend
   ./setup_mac.sh
   cd ..
   ```

4. Install the main app dependencies:
   ```
   npm install
   ```

5. Start the development environment:
   ```
   npm run dev:electron
   ```

### Windows/Linux Setup

Follow similar steps as macOS, but instead of using `setup_mac.sh`, manually:

1. Create a Python virtual environment:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

2. Run the development environment:
   ```
   npm run dev:electron
   ```

## Building for Production

To build the application for production:

```
npm run build
```

This will:
1. Build the React frontend
2. Package the Python backend into an executable
3. Bundle everything into an Electron application

The packaged application will be in the `dist` directory.

## Configuration

- Backend configuration is managed through environment variables in a `.env` file in the `backend` directory.
- Frontend configuration is managed through the Electron app.

## License

[MIT License](LICENSE)
