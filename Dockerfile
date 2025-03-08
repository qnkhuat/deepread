# Use Node.js to build the frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy frontend source files
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Use Python to build the backend
FROM python:3.12-slim AS backend-builder
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source files
COPY backend/ ./backend/

# Final stage
FROM python:3.12-slim
WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend from backend-builder
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=backend-builder /app/backend/ ./backend/

# Copy frontend build from frontend-builder
COPY --from=frontend-builder /app/frontend/dist/ ./frontend/dist/

# Copy static files
COPY frontend/public/ ./frontend/public/

# Create a simple web server to serve the frontend
RUN npm install -g serve

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose ports
EXPOSE 8345 5000

# Set environment variables
ENV BACKEND_PORT=8345
ENV FRONTEND_PORT=5000

ENTRYPOINT ["docker-entrypoint.sh"]