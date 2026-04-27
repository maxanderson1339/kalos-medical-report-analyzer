import os
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-flash-latest:generateContent?key={GEMINI_API_KEY or ''}"
)


def format_with_gemini(question: str, raw_answer: str) -> str:
    if not GEMINI_API_KEY:
        return raw_answer

    prompt = f"""
You are a fitness analytics assistant.

User question:
{question}

Database answer:
{raw_answer}

Rewrite the answer in a clear, professional, human-friendly way.
Keep it short (2-3 lines max).
Do NOT add any new information.
"""

    try:
        response = requests.post(
            URL,
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=20,
        )
    except Exception:
        return raw_answer

    if response.status_code != 200:
        return raw_answer

    try:
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return raw_answer
