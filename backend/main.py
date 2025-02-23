import os, json
import uvicorn
from fastapi import FastAPI, UploadFile, File, Query, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
# Create Haystack pipeline for PDF processing and summarization
from haystack import Pipeline
from haystack.components.converters import PyPDFToDocument
from haystack.components.preprocessors import DocumentCleaner
from haystack.components.builders import PromptBuilder
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack_integrations.components.generators.ollama import OllamaChatGenerator
from haystack.utils import Secret
import pymupdf4llm
from haystack.dataclasses import ChatMessage
from pydantic import BaseModel
from typing import List
import logging
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

def create_chat_generator(provider_name, model_name, config):
    if provider_name.startswith("openai") or provider_name.startswith("anthropic") or provider_name.startswith("grok"):
        api_base_url = config["base_url"]["value"]
        api_key = Secret.from_token(config["api_key"]["value"])
        assert api_key is not None, "OPENAI_API_KEY is not set"
        return OpenAIChatGenerator(
            api_key=api_key,
            api_base_url=api_base_url,
            model=model_name,
        )
    elif provider_name.startswith("ollama"):
        return OllamaChatGenerator(model=model_name, url=config["base_url"]["value"])

app = FastAPI()

# Add CORS middleware
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        )

def to_chat_message(message):
    return ChatMessage.from_dict({"role": message["role"], "content": message["content"], "name": None})

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

    # Read and save PDF temporarily
    pdf_content = await file.read()
    temp_pdf_path = f"temp_{file.filename}"
    with open(temp_pdf_path, "wb") as f:
        f.write(pdf_content)

    # Convert PDF to markdown
    markdown_text = pymupdf4llm.to_markdown(temp_pdf_path)
    # Cleanup temporary file
    os.remove(temp_pdf_path)

    return {"content": markdown_text}


class ChatMessageModel(BaseModel):
    role: str
    content: str
    name: str | None = None

class ModelConfig(BaseModel):
    provider_name: str
    model_name: str
    config: dict

class ChatRequest(BaseModel):
    messages: List[ChatMessageModel]
    llm_config: ModelConfig

@app.post("/api/chat")
async def chat(request: ChatRequest):
    chat_messages = [to_chat_message(msg.dict()) for msg in request.messages]
    chat_generator = create_chat_generator(
        request.llm_config.provider_name,
        request.llm_config.model_name,
        request.llm_config.config
    )
    response = chat_generator.run(chat_messages)
    return response["replies"][0].to_dict()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
