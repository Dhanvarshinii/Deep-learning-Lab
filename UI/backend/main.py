from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.ensemble import predict as ensemble_predict
from services.qwen import predict as qwen_predict
from services.scispacy import predict as scispacy_predict

app = FastAPI()

# Allow requests from the React frontend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    """Request body for the prediction endpoint."""
    
    model: str
    text: str


class Entity(BaseModel):
    """Standard entity structure returned by all supported models."""
    
    meaning_group: str
    selected_text: str
    model: str
    original_label: str
    start: int
    end: int
    score: Optional[float] = None

# Maps frontend model names to their corresponding prediction functions.
MODEL_HANDLERS = {
    "Ensemble Transformer": ensemble_predict,
    "scispaCy + Regex": scispacy_predict,
    "Qwen 2.5 (LLM)": qwen_predict,
}

# Optional model-specific input limits.
MODEL_LIMITS = {
    "Ensemble Transformer": 1500,
}


@app.get("/")
def root():
    """Health check endpoint."""

    return {"message": "Clinical NER Backend Running"}


@app.post("/predict")
def predict(request: PredictRequest):
    """
    Runs the selected clinical NER model and returns the extracted entities.

    The requested model is validated, any model-specific constraints are
    applied, and the corresponding backend service is executed.

    Args:
        request: Prediction request containing the selected model
            and clinical text.

    Returns:
        A JSON response containing the model name, input text,
        and extracted entities.
    """

    # Validate model-specific input limits.
    limit = MODEL_LIMITS.get(request.model)

    if limit and len(request.text) > limit:
        return {
            "error": (
                f"{request.model} supports up to "
                f"{limit} characters. "
                f"Received {len(request.text)}."
            ),
            "entities": [],
        }

    # Select the appropriate prediction service.
    handler = MODEL_HANDLERS.get(request.model)

    if not handler:
        return {
            "error": f"Unsupported model: {request.model}",
            "entities": [],
        }

    entities = handler(request.text)

    return {
        "model": request.model,
        "text": request.text,
        "entities": entities,
    }