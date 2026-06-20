from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

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

    return {
        "model": request.model,
        "text": request.text,
        "entities": [
            {
                "meaning_group": "PERSON_PROVIDER",
                "selected_text": "Dr. Emily Smith",
                "model": "phi_deidentifier",
                "original_label": "HCW",
                "start": 0,
                "end": 15,
                "score": 0.9989,
            },
            {
                "meaning_group": "MEDICATION",
                "selected_text": "ibuprofen",
                "model": "medication_ner",
                "original_label": "Drug",
                "start": 27,
                "end": 36,
                "score": 0.9972,
            },
        ],
    }