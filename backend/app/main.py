from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import cases, chats, documents, messages


def create_app() -> FastAPI:
    settings = get_settings()

    logging.basicConfig(level=getattr(logging, settings.log_level))

    app = FastAPI(
        title="Legal AI Assistant API",
        version="0.1.0",
        description="Backend services for the Legal AI Assistant platform.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(cases.router)
    app.include_router(documents.router)
    app.include_router(chats.router)
    app.include_router(messages.router)

    @app.get("/healthz")
    def healthz() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

