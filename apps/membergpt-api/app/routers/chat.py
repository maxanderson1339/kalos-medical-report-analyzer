from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas import ChatRequest
from app.services.query_service import answer_from_sql
from app.services.gemini_service import format_with_gemini

router = APIRouter()


@router.post("")
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    raw_answer = answer_from_sql(db, payload.question)

    # try to make the answer nicer with Gemini, fall back to raw if it fails
    final_answer = raw_answer
    try:
        final_answer = format_with_gemini(payload.question, raw_answer)
    except Exception:
        pass

    return {
        "answer": final_answer,
        "raw": raw_answer,
    }
