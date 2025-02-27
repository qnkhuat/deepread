import os, json
import uvicorn
from fastapi import FastAPI, UploadFile, File, Query, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import openai  # Import OpenAI library
import pymupdf4llm
from pydantic import BaseModel
from typing import List
import logging
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

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
    # Prepare messages for OpenAI API
    openai_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    # Call OpenAI API
    response = openai.ChatCompletion.create(
        model=request.llm_config.model_name,
        messages=openai_messages,
        api_key=request.llm_config.config["api_key"]["value"]
    )
    
    # Return the first reply
    return {"content": response.choices[0].message["content"]}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
