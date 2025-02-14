import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
# Create Haystack pipeline for PDF processing and summarization
from haystack import Pipeline
from haystack.components.converters import PyPDFToDocument
from haystack.components.preprocessors import DocumentCleaner
from haystack.components.builders import PromptBuilder
from haystack_integrations.components.generators.ollama import OllamaGenerator


converter = PyPDFToDocument()
cleaner = DocumentCleaner()

# Configure summarization prompt
template = """
Please provide a concise summary of the following document:

{% for document in documents %}
{{ document.content }}
{% endfor %}
"""
prompt_builder = PromptBuilder(template=template)

# Initialize Ollama generator (using mistral model)
generator = OllamaGenerator(model="qwen2.5", url="http://localhost:11434")

# Create and configure pipeline
indexing_pipeline = Pipeline()
indexing_pipeline.add_component("converter", converter)
indexing_pipeline.add_component("cleaner", cleaner)
indexing_pipeline.add_component("prompt_builder", prompt_builder)
indexing_pipeline.add_component("generator", generator)

# Connect components
indexing_pipeline.connect("converter", "cleaner")
indexing_pipeline.connect("cleaner", "prompt_builder.documents")
indexing_pipeline.connect("prompt_builder", "generator")


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Add your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/chat")
async def chat(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        return JSONResponse(
                status_code=400,
                content={"message": "Only PDF files are allowed"}
                )

    try:
        # Read the uploaded PDF file
        pdf_content = await file.read()

        # Save PDF temporarily to process with Haystack
        temp_pdf_path = f"temp_{file.filename}"
        with open(temp_pdf_path, "wb") as f:
            f.write(pdf_content)

        # Initialize pipeline components

        # Run pipeline
        result = indexing_pipeline.run({"converter": {"sources": [temp_pdf_path]}})
        summary = result["generator"]["replies"][0]

        # Cleanup temporary file
        import os
        os.remove(temp_pdf_path)
        print("summary: ", summary)

        return {"message": summary,
                "role": "bot",
                }

    except Exception as e:
        return JSONResponse(
                status_code=500,
                content={"message": f"An error occurred: {str(e)}"}
                )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
