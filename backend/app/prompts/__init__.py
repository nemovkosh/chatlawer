from __future__ import annotations

from importlib.resources import files


def load_legal_assistant_prompt() -> str:
    prompt_path = files(__name__) / "legal_assistant_prompt.txt"
    return prompt_path.read_text(encoding="utf-8")


__all__ = ["load_legal_assistant_prompt"]

