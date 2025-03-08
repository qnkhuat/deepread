# Running DeepRead with Docker

This document describes how to build and run DeepRead using Docker containers.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git repository cloned locally

## Quick Start

1. Build and start both frontend and backend containers:

```bash
docker-compose up -d
```

2. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8345

3. Stop the containers:

```bash
docker-compose down
```

## Development Workflow

The docker-compose.yml configuration includes volume mounts for development:

- For the frontend, code changes will require rebuilding:
```bash
docker-compose build frontend
docker-compose up -d frontend
```

- For the backend, code changes will be reflected immediately due to volume mounting.

## Building for Production

For production deployment, you may want to modify the Dockerfiles to build optimized containers without development dependencies:

1. Remove volume mounts from docker-compose.yml
2. Build with production flag:
```bash
docker-compose -f docker-compose.yml build
```

## Environment Variables

You can create a `.env` file in the backend directory to store configuration:

```
# Backend API keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## Troubleshooting

- If the frontend can't connect to the backend, check that the Nginx proxy is correctly configured
- Check container logs with:
```bash
docker-compose logs backend
docker-compose logs frontend
```

## Notes

- The Electron application functionality is not available in the Docker version, as this is a web-only deployment
- For PDF processing to work correctly, ensure the container has sufficient memory allocated