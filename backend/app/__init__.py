"""
Legal AI Assistant backend package.

This module exposes the FastAPI application factory for ASGI servers.
"""

from .main import create_app

__all__ = ["create_app"]

