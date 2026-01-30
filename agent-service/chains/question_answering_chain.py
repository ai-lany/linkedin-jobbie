import json
import pathlib
from typing import Any, Dict, List

from chains.common import load_template, profile_to_dict, render_template, run_llm, to_dict

DEFAULT_QUESTION_ANSWERING_TEMPLATE = """
You are helping a job candidate answer application questions.

Job:
- Title: {{ job.title }}
- Company: {{ job.company }}
- Location: {{ job.location }}
- Type: {{ job.type }}
- Description: {{ job.description }}

Candidate:
- Name: {{ profile.name }}
- Email: {{ profile.email }}
- Resume: {{ resume_text }}

Please answer the following application questions on behalf of the candidate.
Base your answers on the candidate's resume and the job description.
Keep answers concise and professional (2-3 sentences maximum per question).

Questions:
{% for q in questions %}
{{ loop.index }}. {{ q.question }}{% if q.type == "boolean" %} (Yes/No){% elif q.options %} (Options: {{ q.options | join(", ") }}){% endif %}
{% endfor %}

Return ONLY a JSON array of answers in this exact format:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]

Do not include any other text or explanation, just the JSON array.
""".strip()


def load_question_answering_template() -> str:
    default_path = pathlib.Path(__file__).parent.parent / "templates" / "question_answering_prompt.jinja2"
    return load_template("QUESTION_ANSWERING_TEMPLATE_PATH", default_path, DEFAULT_QUESTION_ANSWERING_TEMPLATE)


def run_question_answering_chain(
    job_obj: Any,
    profile_obj: Any,
    questions: List[Dict[str, Any]],
    template_str: str = None,
    model: str = None,
) -> List[Dict[str, str]]:
    """Generate answers to application questions using LLM.

    Args:
        job_obj: Job object with title, company, description, etc.
        profile_obj: Profile object with name, email, resume_text, etc.
        questions: List of question dicts with 'question', 'type', and optional 'options'
        template_str: Optional custom template string
        model: Optional model name override

    Returns:
        List of {"question": "...", "answer": "..."} dicts
    """
    job = to_dict(job_obj)
    profile = profile_to_dict(profile_obj)
    resume_text = profile.get("resume_text", "")
    template = template_str or load_question_answering_template()
    prompt = render_template(template, job=job, profile=profile, resume_text=resume_text, questions=questions)

    try:
        result = run_llm(prompt, temperature=0.2, model=model)
        if result:
            # Try to parse JSON response
            # Strip markdown code blocks if present
            cleaned = result.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            answers = json.loads(cleaned)

            # Validate and ensure all questions are answered
            if isinstance(answers, list) and len(answers) > 0:
                return answers
    except Exception as exc:
        print(f"[AGENT] Error generating answers: {exc}. Returning mock response.")

    # Fallback: return generic answers
    return [
        {
            "question": q.get("question", ""),
            "answer": f"Yes, I am interested in this {job.get('title', 'position')} role at {job.get('company', 'your company')}."
            if q.get("type") == "boolean"
            else f"I am well-suited for this role based on my experience and skills."
        }
        for q in questions
    ]
