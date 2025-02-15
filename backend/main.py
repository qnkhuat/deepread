import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
# Create Haystack pipeline for PDF processing and summarization
from haystack import Pipeline
from haystack.components.converters import PyPDFToDocument
from haystack.components.preprocessors import DocumentCleaner
from haystack.components.builders import PromptBuilder
from haystack.components.generators import OpenAIGenerator
from haystack_integrations.components.generators.ollama import OllamaGenerator
from haystack.utils import Secret

TEMPLATES = {"summarize_paper": """
You are an AI assistant that summarizes academic papers concisely. Given a research paper, generate a structured summary that includes:
Objective: What is the paper about?
Key Findings: The most important results and conclusions.
Methods: A brief mention of the approach or methodology.
Significance: Why the findings matter.

Keep the summary clear, precise. Avoid unnecessary details and focus on the core insights.

{% for document in documents %}
{{ document.content }}
{% endfor %}
"""}

class LLM:
    def __init__(self, model_name="gpt-4"):
        self.model_name = model_name
        self.pipeline = self._create_pipeline()
    
    def _create_generator(self):
        if self.model_name.startswith("gpt"):
            assert Secret.from_env_var("OPENAI_API_KEY") is not None, "OPENAI_API_KEY is not set"
            return OpenAIGenerator(
                api_key=Secret.from_env_var("OPENAI_API_KEY"),
                model=self.model_name,
            )
        else:
            return OllamaGenerator(model=self.model_name, url="http://localhost:11434")
    
    def _create_pipeline(self):
        # Initialize components
        converter = PyPDFToDocument()
        cleaner = DocumentCleaner()
        prompt_builder = PromptBuilder(template=TEMPLATES["summarize_paper"])
        generator = self._create_generator()
        
        # Create pipeline
        pipeline = Pipeline()
        pipeline.add_component("converter", converter)
        pipeline.add_component("cleaner", cleaner)
        pipeline.add_component("prompt_builder", prompt_builder)
        pipeline.add_component("generator", generator)
        
        # Connect components
        pipeline.connect("converter", "cleaner")
        pipeline.connect("cleaner", "prompt_builder.documents")
        pipeline.connect("prompt_builder", "generator")
        
        return pipeline
    
    def run(self, file_path):
        return self.pipeline.run({"converter": {"sources": [file_path]}})

# Create pipeline instance
LLMS = {}

def get_llm(model_name):
    if model_name not in LLMS:
        LLMS[model_name] = LLM(model_name=model_name)
        return LLMS[model_name]
    else:
        return LLMS[model_name]

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

@app.post("/chat")
async def chat(file: UploadFile = File(...), model_name: str = Query(default="gpt-4o")):
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

        # Run pipeline
        result = get_llm(model_name).run(temp_pdf_path)
        summary = result["generator"]["replies"][0]

        # Cleanup temporary file
        os.remove(temp_pdf_path)

        return {"message": summary,
                "role": "bot"}

    except Exception as e:
        return JSONResponse(
                status_code=500,
                content={"message": f"An error occurred: {str(e)}"}
                )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
