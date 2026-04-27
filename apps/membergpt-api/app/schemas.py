from pydantic import BaseModel

class ChatRequest(BaseModel):
    question: str

class ParseRequest(BaseModel):
    memberId: str
    filePath: str
    uploadId: str