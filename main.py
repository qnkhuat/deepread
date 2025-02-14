from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import shutil
import os

app = FastAPI()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def read_root():
    return FileResponse("index.html")

@app.get("/main.js")
async def serve_js():
    return FileResponse("main.js")

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        return {"error": "File must be a PDF"}

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save the uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return the path to the saved file
    return f"/uploads/{file.filename}"

# Mount the uploads directory after the upload endpoint
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
