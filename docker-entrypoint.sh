#!/bin/bash
set -e

# Start backend in background
echo "Starting FastAPI backend on port $BACKEND_PORT..."
cd /app/backend
python -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT &

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
max_retries=30
count=0
while [ $count -lt $max_retries ]; do
  if curl -s "http://localhost:$BACKEND_PORT" > /dev/null; then
    echo "Backend is ready!"
    break
  fi
  count=$((count + 1))
  echo "Attempt $count/$max_retries: Backend not ready yet, retrying..."
  sleep 1
done

if [ $count -eq $max_retries ]; then
  echo "Backend failed to start within the allowed time"
  exit 1
fi

# Start frontend
echo "Starting frontend on port $FRONTEND_PORT..."
cd /app
serve -s frontend/dist -l $FRONTEND_PORT