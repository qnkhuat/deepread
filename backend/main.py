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

def create_chat_generator(model_name):
    if model_name.startswith("gpt") or model_name.startswith("grok"):
        api_base_url = "https://api.x.ai/v1" if model_name.startswith("grok") else None
        api_key = Secret.from_env_var("OPENAI_API_KEY") if model_name.startswith("gpt") else Secret.from_env_var("GROK_API_KEY")
        assert api_key is not None, "OPENAI_API_KEY is not set"
        return OpenAIChatGenerator(
            api_key=api_key,
            api_base_url = api_base_url,
            model=model_name,
        )
    else:
        return OllamaChatGenerator(model=model_name, url="http://localhost:11434")

# Create pipeline instance
CHAT_GENERATORS = {}

def get_chat_generator(model_name):
    if model_name not in CHAT_GENERATORS:
        CHAT_GENERATORS[model_name] = create_chat_generator(model_name)
    return CHAT_GENERATORS[model_name]

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
    try:
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

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"An error occurred: {str(e)}"}
        )

@app.post("/api/chat")
async def chat(
    messages: str = Form(...),
    model_name: str = Form(...)
):
    try:
        chat_messages = [to_chat_message(message) for message in json.loads(messages)]
        response = get_chat_generator(model_name).run(chat_messages)
        return response["replies"][0].to_dict()

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"An error occurred: {str(e)}"}
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
