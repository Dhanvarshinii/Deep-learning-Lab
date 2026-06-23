from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    model: str
    text: str


class Entity(BaseModel):
    meaning_group: str
    selected_text: str
    model: str
    original_label: str
    start: int
    end: int
    score: Optional[float] = None


@app.get("/")
def root():
    return {"message": "Clinical NER Backend Running"}


@app.post("/predict")
def predict(request: PredictRequest):

    MODEL_LIMITS = {
        "Ensemble Transformer": 1500,
    }

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
        
    result = subprocess.run(
        [
            "python",
            "../../models/pre_fine_tuned_models/ensemble_pretrained_ner.py",
            "--text",
            request.text,
        ],
        capture_output=True,
        text=True,
    )

    output = result.stdout

    entities = []

    lines = output.splitlines()

    for line in lines:

        if not re.match(r"^\d+\s+\|", line):
            continue

        parts = [p.strip() for p in line.split("|")]

        if len(parts) < 8:
            continue

        entities.append(
            {
                "meaning_group": parts[1],
                "selected_text": parts[2],
                "model": parts[3],
                "original_label": parts[4],
                "start": int(parts[5]),
                "end": int(parts[6]),
                "score": float(parts[7]),
            }
        )

    return {
        "model": request.model,
        "text": request.text,
        "entities": entities,
    }