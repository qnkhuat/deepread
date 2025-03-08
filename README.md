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

## Docker Support

DeepRead can be run as a containerized web application using Docker.

### Building the Docker Image

```bash
docker build -t deepread .
```

### Running with Docker Compose

The easiest way to run DeepRead is with Docker Compose:

```bash
docker-compose up -d
```

This will:
- Build the Docker image if it doesn't exist
- Start the container in detached mode
- Expose the backend API on port 8345
- Expose the frontend on port 5000

You can then access the application at http://localhost:5000

### Running the Docker Image Directly

```bash
docker run -p 5000:5000 -p 8345:8345 deepread
```

### Environment Variables

- `BACKEND_PORT`: Port for the FastAPI backend (default: 8345)
- `FRONTEND_PORT`: Port for the frontend web server (default: 5000)

### Persistence

The Docker setup includes a volume for persisting any application data.
