import os, json
import uvicorn
from fastapi import FastAPI, UploadFile, File, Query, Form
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import openai
import pymupdf4llm
import pymupdf
from pydantic import BaseModel
from typing import List
import logging
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

app = FastAPI()

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

# Add CORS middleware
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        )

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/api/to_markdown")
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

@app.post("/api/chat")
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

@app.post("/api/models")
async def get_available_models(provider_config: ProviderConfig):
    # Create client using the OpenAI library with the provided configuration
    # This works for OpenAI and compatible providers (Anthropic, Mistral, etc.)
    try:
        client = config_to_client(provider_config.provider_name, provider_config.config)
        # Fetch models using the OpenAI-compatible API
        models_response = client.models.list()
        models = [model.id for model in models_response.data]
        return {"provider": provider_config.provider_name, "models": models}
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"message": str(e)}
        )

# Add exception handler for uncaught exceptions
@app.middleware("http")
async def log_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Uncaught exception: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"message": "Internal server error"}
        )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8345))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
