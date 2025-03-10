import os, json
import uvicorn
from fastapi import FastAPI, UploadFile, File, Query, Form, APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import openai
import pymupdf4llm
import pymupdf
from pydantic import BaseModel
from typing import List
import logging
import traceback
import sys
import platform

logger = logging.getLogger(__name__)

# Create two separate applications
app = FastAPI()  # Main app

# Create a separate router for API endpoints
api_router = APIRouter(prefix="/api")

def config_to_client(provider_name: str, config: dict):
    api_key = config["api_key"]["value"]
    base_url = config["base_url"]["value"]
    if provider_name == "anthropic":
        return openai.OpenAI(api_key=api_key,
                             base_url=base_url,
                             default_headers={"anthropic-version": "2023-06-01",
                                              "x-api-key": api_key})
    else:
        return openai.OpenAI(api_key=api_key, base_url=base_url)

# Add CORS middleware to both
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Determine if we're running in a PyInstaller bundle
def is_bundled():
    return getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')

# Get the directory where frontend files are located
def get_frontend_dir():
    # First, check if the frontend directory is specified in an environment variable
    if "DEEPREAD_FRONTEND_DIR" in os.environ:
        return os.environ["DEEPREAD_FRONTEND_DIR"]
    
    # If running in a PyInstaller bundle
    if is_bundled():
        # When bundled with PyInstaller, frontend files are in 'frontend' directory next to the executable
        if platform.system() == "Windows":
            base_dir = os.path.dirname(sys.executable)
        else:
            base_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
        frontend_dir = os.path.join(base_dir, "frontend")
        return frontend_dir if os.path.exists(frontend_dir) else None
    
    # In development mode, look for frontend/dist in the repo root
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dir = os.path.join(root_dir, "frontend", "dist")
    return frontend_dir if os.path.exists(frontend_dir) else None

@api_router.get("")
async def api_root():
    return {"message": "API is running"}

@api_router.post("/to_markdown")
async def convert_pdf_to_markdown(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        return JSONResponse(
            status_code=400,
            content={"message": "Only PDF files are allowed"}
        )

    pdf_content = await file.read()
    markdown_text = pymupdf4llm.to_markdown(pymupdf.Document(stream=pdf_content))

    return {"content": markdown_text}

class ChatMessageModel(BaseModel):
    role: str
    content: str
    name: str | None = None

class ProviderConfig(BaseModel):
    provider_name: str
    config: dict
    model_name: str | None = None

class ChatRequest(BaseModel):
    messages: List[ChatMessageModel]
    llm_config: ProviderConfig

@api_router.post("/chat")
async def chat(request: ChatRequest):
    openai_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    config = request.llm_config.config
    client = config_to_client(request.llm_config.provider_name, config)

    async def generate():
        try:
            stream = client.chat.completions.create(
                model=request.llm_config.model_name,
                messages=openai_messages,
                stream=True,
            )

            # Track total completion tokens for cost calculation
            completion_tokens = 0

            # Stream the response chunks
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    # Rough estimate of tokens (characters / 4)
                    completion_tokens += len(content) // 4
                    yield f"data: {json.dumps({'content': content})}\n\n"

            # Calculate input tokens (rough estimate)
            input_tokens = sum(len(msg.content) // 4 for msg in request.messages)

            # Calculate cost based on the model and provider (simplified)
            cost = calculate_cost(
                request.llm_config.provider_name,
                request.llm_config.model_name,
                input_tokens,
                completion_tokens
            )

            # Send a completion signal with usage data
            yield f"data: {json.dumps({'done': True, 'usage': {'input_tokens': input_tokens, 'completion_tokens': completion_tokens, 'cost': cost}})}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            logger.error(traceback.format_exc())
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

def calculate_cost(provider_name, model_name, input_tokens, completion_tokens):
    """Calculate the cost based on provider, model and token counts.
    These are approximate costs and should be updated with current pricing."""

    # Default rates (per 1000 tokens)
    # https://www.helicone.ai/llm-cost
    rates = {
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
    }

    # Get the model rates or use some defaults
    provider_rates = rates.get(provider_name.lower(), {})

    # Check for exact model match
    if model_name in provider_rates:
        model_rates = provider_rates[model_name]
    else:
        # Try to find a model with a similar name
        for model_key in provider_rates:
            if model_key in model_name:
                model_rates = provider_rates[model_key]
                break
        else:
            # Default rates if no match is found
            model_rates = {"input": 0.001, "output": 0.002}

    # Calculate the cost
    input_cost = (input_tokens / 1000) * model_rates["input"]
    output_cost = (completion_tokens / 1000) * model_rates["output"]
    total_cost = input_cost + output_cost

    return round(total_cost, 6)  # Round to 6 decimal places

@api_router.post("/models")
async def get_available_models(provider_config: ProviderConfig):
    # Create client using the OpenAI library with the provided configuration
    # This works for OpenAI and compatible providers (Anthropic, Mistral, etc.)
    try:
        client = config_to_client(provider_config.provider_name, provider_config.config)

        # Get models from the provider
        models_response = client.models.list()

        # Extract model IDs
        model_ids = [model.id for model in models_response.data]

        return {"models": model_ids}
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Failed to fetch models: {str(e)}"}
        )

# Add logging middleware to debug the request flow
@app.middleware("http")
async def log_requests(request: Request, call_next):
    path = request.url.path
    method = request.method
    logger.info(f"Request: {method} {path}")
    response = await call_next(request)
    logger.info(f"Response: {method} {path} - Status: {response.status_code}")
    return response

# Include the API router with the correct prefix
app.include_router(api_router)

# Create a redirect for docs
@app.get("/api/docs", include_in_schema=False)
async def custom_swagger_ui_redirect():
    return RedirectResponse(url="/docs")

# Mount static files only in production mode (when bundled)
frontend_dir = get_frontend_dir()
if frontend_dir and os.path.exists(frontend_dir):
    logger.info(f"Mounting static files from {frontend_dir}")
    # Create a custom middleware to handle static files while preserving API routes
    @app.middleware("http")
    async def serve_static_or_api(request: Request, call_next):
        # Always let API requests and docs requests pass through
        print(f"API request: {request.url.path}")
        if request.url.path.startswith("/api") or request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
            print("INTO API request")
            return await call_next(request)

        # For non-API paths, try to serve static files
        path = request.url.path
        if path == "/" or path == "":
            path = "/index.html"

        # Remove leading slash for file path
        file_path = os.path.join(frontend_dir, path.lstrip("/"))

        # If the file exists, serve it
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        # For SPA routing, serve index.html for non-existent files
        return FileResponse(os.path.join(frontend_dir, "index.html"))
else:
    logger.info("No frontend directory found, serving API only")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8345))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
