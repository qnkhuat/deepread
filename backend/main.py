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
    config = request.provider_config.config
    client = config_to_client(config)

    async def generate():
        try:
            stream = client.chat.completions.create(
                model=request.llm_config.model_name,
                messages=openai_messages,
                stream=True,
            )

            # Stream the response chunks
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"data: {json.dumps({'content': content})}\n\n"

            # Send a completion signal
            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {str(e)}")
            logger.error(traceback.format_exc())
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

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
