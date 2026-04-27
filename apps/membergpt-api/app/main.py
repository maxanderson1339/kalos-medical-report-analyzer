import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers.health import router as health_router
from app.routers.chat import router as chat_router
from app.routers.parse import router as parse_router

load_dotenv()

app = FastAPI(title="MemberGPT API")

# allow requests from the dashboard
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(chat_router, prefix="/chat", tags=["chat"])
app.include_router(parse_router, prefix="/parse", tags=["parse"])
