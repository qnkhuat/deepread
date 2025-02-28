import os, json
import uvicorn
from fastapi import FastAPI, UploadFile, File, Query, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import openai  # Import OpenAI library
import pymupdf4llm
import pymupdf
from pydantic import BaseModel
from typing import List
import logging
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

# Set up logging configuration
log_file_path = os.path.expanduser("~/tmp/log.txt")
os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file_path),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI()

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
    logger.debug("Root endpoint called")
    return {"message": "Hello World"}

@app.post("/api/to_markdown")
async def convert_pdf_to_markdown(file: UploadFile = File(...)):
    logger.debug(f"PDF to markdown conversion requested for file: {file.filename}")
    if not file.filename.endswith('.pdf'):
        logger.warning(f"Invalid file format: {file.filename}")
        return JSONResponse(
            status_code=400,
            content={"message": "Only PDF files are allowed"}
        )

# Read and save PDF temporarily
    pdf_content = await file.read()
    markdown_text = pymupdf4llm.to_markdown(pymupdf.Document(stream=pdf_content))
    logger.debug("PDF successfully converted to markdown")

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
    logger.debug(f"Chat request received for model: {request.llm_config.model_name}")
# Prepare messages for OpenAI API
    openai_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

    # Set up the OpenAI client with the API key
    client = openai.OpenAI(api_key=request.llm_config.config["api_key"]["value"],
                            base_url=request.llm_config.config["base_url"]["value"])
    logger.debug(f"OpenAI client initialized with base URL: {request.llm_config.config['base_url']['value']}")

    # Call OpenAI API with the new syntax
    logger.debug("Sending request to OpenAI API")
    response = client.chat.completions.create(
        model=request.llm_config.model_name,
        messages=openai_messages,
    )
    logger.debug("Received response from OpenAI API")

    # Return the first reply (updated to match new response structure)
    return {"content": response.choices[0].message.content}

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
