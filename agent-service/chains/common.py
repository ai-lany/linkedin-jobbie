import logging
import os
import pathlib
from typing import Any, Dict, Optional

from jinja2 import Template

try:
    from langchain_ollama import ChatOllama
    from langchain_core.output_parsers import StrOutputParser
except ImportError:
    ChatOllama = None  # type: ignore
    StrOutputParser = None  # type: ignore

logger = logging.getLogger(__name__)


def to_dict(obj: Any) -> Dict[str, Any]:
    return {
        "id": getattr(obj, "id", ""),
        "title": getattr(obj, "title", ""),
        "company": getattr(obj, "company", ""),
        "location": getattr(obj, "location", ""),
        "salary": getattr(obj, "salary", ""),
        "type": getattr(obj, "type", ""),
        "experience": getattr(obj, "experience", ""),
        "description": getattr(obj, "description", ""),
        "easy_apply": getattr(obj, "easy_apply", False),
        "external_apply_url": getattr(obj, "external_apply_url", ""),
        "logo": getattr(obj, "logo", ""),
        "postedDate": getattr(obj, "postedDate", ""),
        "benefits": list(getattr(obj, "benefits", [])),
        "requirements": list(getattr(obj, "requirements", [])),
    }


def profile_to_dict(profile: Any) -> Dict[str, Any]:
    return {
        "name": getattr(profile, "name", ""),
        "email": getattr(profile, "email", ""),
        "headline": getattr(profile, "headline", ""),
        "summary": getattr(profile, "summary", ""),
        "skills": list(getattr(profile, "skills", [])),
        "resume_text": getattr(profile, "resume_text", ""),
        "resume_url": getattr(profile, "resume_url", ""),
    }


def load_template(env_var: str, default_path: pathlib.Path, fallback_template: str) -> str:
    env_path = os.getenv(env_var)
    path = pathlib.Path(env_path) if env_path else default_path
    if path.exists():
        return path.read_text(encoding="utf-8")
    return fallback_template


def render_template(template_str: str, **kwargs: Any) -> str:
    template = Template(template_str)
    return template.render(**kwargs)


def run_llm(prompt: str, temperature: float, model: Optional[str]) -> Optional[str]:
    if not ChatOllama:
        return None

    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model_name = model or os.getenv("OLLAMA_MODEL", "llama3.2")

    logger.info("Initializing Ollama: model=%s, base_url=%s", model_name, ollama_base_url)
    llm = ChatOllama(
        model=model_name,
        base_url=ollama_base_url,
        temperature=temperature,
    )

    logger.info("Calling Ollama LLM (prompt length: %s chars)...", len(prompt))
    if StrOutputParser:
        parser = StrOutputParser()
        response = llm.invoke(prompt)
        return parser.invoke(response)

    response = llm.invoke(prompt)
    return str(response.content)
