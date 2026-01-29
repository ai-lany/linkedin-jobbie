import pathlib
from typing import Any

from chains.common import load_template, profile_to_dict, render_template, run_llm, to_dict

DEFAULT_COVER_LETTER_TEMPLATE = """
Write a concise, professional cover letter tailored to the job.

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
- Resume: {{ resume_text }}

Constraints:
- 3 short paragraphs maximum
- Highlight 2-3 relevant strengths from the resume
- Close with a confident call to action
""".strip()


def load_cover_letter_template() -> str:
    default_path = pathlib.Path(__file__).parent.parent / "templates" / "cover_letter_prompt.jinja2"
    return load_template("COVER_LETTER_TEMPLATE_PATH", default_path, DEFAULT_COVER_LETTER_TEMPLATE)


def run_cover_letter_chain(
    job_obj: Any,
    profile_obj: Any,
    template_str: str = None,
    model: str = None,
) -> str:
    job = to_dict(job_obj)
    profile = profile_to_dict(profile_obj)
    resume_text = profile.get("resume_text", "")
    template = template_str or load_cover_letter_template()
    prompt = render_template(template, job=job, profile=profile, resume_text=resume_text)

    try:
        result = run_llm(prompt, temperature=0.3, model=model)
        if result is not None:
            return result
    except Exception as exc:
        print(f"[AGENT] Ollama error: {exc}. Returning mock response.")
        return f"[mock-cover-letter]\n{prompt}\n\n(Ollama unavailable)"

    return f"[mock-cover-letter]\n{prompt}"
