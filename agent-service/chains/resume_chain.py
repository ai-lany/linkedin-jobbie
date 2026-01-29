import pathlib
from typing import Any

from chains.common import load_template, profile_to_dict, render_template, run_llm, to_dict

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


def load_resume_template() -> str:
    default_path = pathlib.Path(__file__).parent.parent / "templates" / "resume_prompt.jinja2"
    return load_template("PROMPT_TEMPLATE_PATH", default_path, DEFAULT_TEMPLATE)


def run_resume_chain(
    job_obj: Any,
    profile_obj: Any,
    template_str: str = None,
    model: str = None,
) -> str:
    job = to_dict(job_obj)
    profile = profile_to_dict(profile_obj)
    template = template_str or load_resume_template()
    prompt = render_template(template, job=job, profile=profile)

    try:
        result = run_llm(prompt, temperature=0, model=model)
        if result is not None:
            return result
    except Exception as exc:
        print(f"[AGENT] Ollama error: {exc}. Returning mock response.")
        return f"[mock-refined]\n{prompt}\n\n(Ollama unavailable)"

    return f"[mock-refined]\n{prompt}"
