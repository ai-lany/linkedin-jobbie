import os
import pathlib
from typing import Any, Dict

from jinja2 import Template

try:
    from langchain_ollama import ChatOllama
    from langchain_core.output_parsers import StrOutputParser
except ImportError:
    ChatOllama = None  # type: ignore
    StrOutputParser = None  # type: ignore


cwd = "/home/coder"

DEFAULT_TEMPLATE = """
You are an assistant refining a candidate's resume for a specific role.

Job:
- Title: {{ job.title }}
- Company: {{ job.company }}
- Location: {{ job.location }}
- Type: {{ job.type }}
- Experience: {{ job.experience }}
- Description: {{ job.description }}

Candidate:
- Name: {{ profile.name }}
- Email: {{ profile.email }}
- Headline: {{ profile.headline }}
- Summary: {{ profile.summary }}
- Skills: {{ profile.skills | join(", ") }}

Return:
1) A concise tailored summary (3-5 sentences) highlighting fit for the role.
2) A bullet list of top skill alignments (max 5).
Keep it plain text.
""".strip()


def to_dict(obj: Any) -> Dict[str, Any]:
  # Proto messages have .__dict__ with _pb; using attribute access is fine here
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
  }


def load_template() -> str:
    # Allow override via env; default to templates/resume_prompt.j2 next to this file
    env_path = os.getenv("PROMPT_TEMPLATE_PATH")
    if env_path:
        path = pathlib.Path(env_path)
    else:
        path = pathlib.Path(__file__).parent / "templates" / "resume_prompt.jinja2"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return DEFAULT_TEMPLATE


def render_prompt(job: Dict[str, Any], profile: Dict[str, Any], template_str: str = None) -> str:
  tmpl = template_str or load_template()
  template = Template(tmpl)
  return template.render(job=job, profile=profile)


def run_resume_chain(job_obj: Any, profile_obj: Any, template_str: str = None, model: str = None) -> str:
    """Run the resume refinement chain with Ollama."""
    job = to_dict(job_obj)
    profile = profile_to_dict(profile_obj)
    prompt = render_prompt(job, profile, template_str)

    # Get Ollama configuration from environment
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model_name = model or os.getenv("OLLAMA_MODEL", "llama3.2")

    if ChatOllama:
        try:
            print(f"[AGENT] Initializing Ollama: model={model_name}, base_url={ollama_base_url}")

            # Initialize Ollama LLM
            llm = ChatOllama(
                model=model_name,
                base_url=ollama_base_url,
                temperature=0,
            )

            print(f"[AGENT] Calling Ollama LLM (prompt length: {len(prompt)} chars)...")

            # Invoke LLM with prompt
            if StrOutputParser:
                parser = StrOutputParser()
                response = llm.invoke(prompt)
                result = parser.invoke(response)
            else:
                response = llm.invoke(prompt)
                result = str(response.content)

            print(f"[AGENT] LLM response received (length: {len(result)} chars)")
            return result

        except Exception as e:
            # Graceful fallback if Ollama unavailable
            print(f"[AGENT] Ollama error: {e}. Returning mock response.")
            return f"[mock-refined]\n{prompt}\n\n(Ollama unavailable)"

    # fallback: return prompt so downstream still has something
    return f"[mock-refined]\n{prompt}"
