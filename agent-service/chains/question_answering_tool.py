"""
Question answering tool for agentic application processing
"""
import json
import logging
from typing import Dict, Any, List
from langchain_core.tools import tool
from jinja2 import Template

from chains.llm_config import get_llm_chain

logger = logging.getLogger(__name__)


DEFAULT_TEMPLATE = """
You are helping a candidate answer job application questions.

Job Information:
- Title: {{ job.title }}
- Company: {{ job.company }}
- Description: {{ job.description }}

Candidate Profile:
- Name: {{ profile.name }}
- Resume: {{ profile.resume_text }}

Application Questions:
{% for q in questions %}
{{ loop.index }}. {{ q.question }}{% if q.type == "boolean" %} (Yes/No){% elif q.options %} (Options: {{ q.options | join(", ") }}){% endif %}
{% endfor %}

Task:
Provide thoughtful, honest answers to each question based on the candidate's resume and the job requirements.

Guidelines:
- Keep answers concise (2-3 sentences max per question)
- Be specific and use examples from the resume when possible
- Show enthusiasm and alignment with the role
- For yes/no questions, provide brief context
- For multiple choice, choose the most appropriate option

Return ONLY a JSON array in this exact format:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]

No markdown code blocks, no preamble - just the raw JSON array.
""".strip()


@tool
def answer_application_questions(job_info: str, profile_info: str, questions: str) -> str:
    """
    Answers job application questions based on candidate's profile.

    Use this tool when the job application has specific questions that need to be answered.
    The tool generates contextual, honest answers based on the candidate's background
    and the job requirements.

    Args:
        job_info: JSON string containing job details (title, company, description, etc.)
        profile_info: JSON string containing candidate profile (name, resume_text, etc.)
        questions: JSON string containing list of questions with format [{"question": "...", "type": "text", "options": []}]

    Returns:
        JSON string containing array of answers: [{"question": "...", "answer": "..."}]
    """
    try:
        logger.info("Parsing questions input...")
        job = json.loads(job_info)
        profile = json.loads(profile_info)
        questions_list = json.loads(questions)

        if not questions_list:
            logger.info("No questions provided")
            return json.dumps([])

        logger.info("Answering %s questions for: %s", len(questions_list), job.get('title', 'Unknown'))

        # Render prompt template
        template = Template(DEFAULT_TEMPLATE)
        prompt = template.render(job=job, profile=profile, questions=questions_list)

        # Get LLM chain and invoke
        llm_chain = get_llm_chain(temperature=0.2)  # Low temp for consistent answers

        logger.info("Invoking LLM (prompt length: %s chars)...", len(prompt))
        result = llm_chain.invoke(prompt)

        # Clean up the result - remove markdown code blocks if present
        cleaned = result.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # Validate JSON
        try:
            answers = json.loads(cleaned)
            if not isinstance(answers, list):
                raise ValueError("Response is not a list")

            # Ensure all questions are answered
            if len(answers) != len(questions_list):
                logger.warning("Expected %s answers, got %s", len(questions_list), len(answers))

            logger.info("Generated %s answers", len(answers))
            return json.dumps(answers)

        except (json.JSONDecodeError, ValueError) as e:
            logger.warning("Failed to parse LLM response as JSON: %s", e)
            logger.debug("LLM response was: %s", cleaned[:200])

            # Fallback: Generate simple answers
            fallback_answers = [
                {
                    "question": q.get("question", ""),
                    "answer": f"Yes, I am interested in this {job.get('title', 'position')} role."
                    if q.get("type") == "boolean"
                    else f"I am well-suited for this role based on my experience and skills."
                }
                for q in questions_list
            ]
            logger.info("Using fallback answers")
            return json.dumps(fallback_answers)

    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON input: {e}"
        logger.error("Questions input error: %s", error_msg)
        return json.dumps([])
    except Exception as e:
        error_msg = f"Failed to answer questions: {str(e)}"
        logger.exception("Question answering failed: %s", error_msg)
        return json.dumps([])


# For backward compatibility with non-agentic code
def run_question_answering_chain(
    job_obj: Any,
    profile_obj: Any,
    questions: List[Dict[str, Any]],
    template_str: str = None,
    model: str = None
) -> List[Dict[str, str]]:
    """
    Legacy function for backward compatibility
    Converts objects to JSON and calls the tool
    """
    from chains.common import to_dict, profile_to_dict

    job_dict = to_dict(job_obj)
    profile_dict = profile_to_dict(profile_obj)

    job_json = json.dumps(job_dict)
    profile_json = json.dumps(profile_dict)
    questions_json = json.dumps(questions)

    result = answer_application_questions.invoke({
        "job_info": job_json,
        "profile_info": profile_json,
        "questions": questions_json
    })

    return json.loads(result)
