from pydantic import BaseModel

class PredictRequest(BaseModel):
    model: str
    text: str