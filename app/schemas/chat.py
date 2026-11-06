from pydantic import BaseModel, Field
from typing import Optional


class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=5000
    )

    session_id: Optional[str] = None

    language: str = "English"


class ChatResponse(BaseModel):
    session_id: str
    reply: str