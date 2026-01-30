"""
Cover letter generation tool for agentic application processing
"""
import json
from typing import Dict, Any
from langchain_core.tools import tool
from jinja2 import Template

from chains.llm_config import get_llm_chain


DEFAULT_TEMPLATE = """
You are an expert cover letter writer helping a candidate apply for a job.

Job Information:
- Title: {{ job.title }}
- Company: {{ job.company }}
- Location: {{ job.location }}
- Type: {{ job.type }}
- Description: {{ job.description }}

Candidate Profile:
- Name: {{ profile.name }}
- Email: {{ profile.email }}
- Resume: {{ profile.resume_text }}

Task:
Write a professional, compelling cover letter that:
1. Shows genuine interest in the company and role
2. Highlights 2-3 relevant achievements from the resume
3. Connects the candidate's experience to the job requirements
4. Demonstrates knowledge of the company/industry
5. Closes with a confident call to action

Format:
- Keep it concise (3 short paragraphs max)
- Use professional but warm tone
- Be specific, not generic
- Start with "Dear Hiring Manager,"
- Sign off with "Sincerely, {{ profile.name }}"

Return ONLY the cover letter, no preamble or explanation.
""".strip()


@tool
def generate_cover_letter(job_info: str, profile_info: str, tailored_resume: str = "") -> str:
    """
    Generates a personalized cover letter for a job application.

    Use this tool when you need to create a compelling cover letter that connects
    the candidate's background to the job requirements. The tool creates a
    professional letter that highlights relevant experience and shows genuine interest.

    Args:
        job_info: JSON string containing job details (title, company, description, etc.)
        profile_info: JSON string containing candidate profile (name, email, resume_text, etc.)
        tailored_resume: Optional tailored resume content to reference key points

    Returns:
        Complete cover letter text
    """
    try:
        print("[COVER_LETTER_TOOL] Parsing input...")
        job = json.loads(job_info)
        profile = json.loads(profile_info)

        print(f"[COVER_LETTER_TOOL] Generating cover letter for: {job.get('title', 'Unknown')} at {job.get('company', 'Unknown')}")

        # Render prompt template
        template = Template(DEFAULT_TEMPLATE)
        prompt = template.render(job=job, profile=profile)

        # Add context from tailored resume if provided
        if tailored_resume:
            prompt += f"\n\nKey points from tailored resume:\n{tailored_resume[:500]}"

        # Get LLM chain and invoke
        llm_chain = get_llm_chain(temperature=0.3)  # Slightly creative for writing

        print(f"[COVER_LETTER_TOOL] Invoking LLM (prompt length: {len(prompt)} chars)...")
        result = llm_chain.invoke(prompt)

        print(f"[COVER_LETTER_TOOL] Generated cover letter ({len(result)} chars)")
        return result

    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON input: {e}"
        print(f"[COVER_LETTER_TOOL] Error: {error_msg}")
        return f"Error: {error_msg}. Please provide valid JSON strings."
    except Exception as e:
        error_msg = f"Failed to generate cover letter: {str(e)}"
        print(f"[COVER_LETTER_TOOL] Error: {error_msg}")
        return f"Error: {error_msg}"


# For backward compatibility with non-agentic code
def run_cover_letter_chain(job_obj: Any, profile_obj: Any, template_str: str = None, model: str = None) -> str:
    """
    Legacy function for backward compatibility
    Converts objects to JSON and calls the tool
    """
    from chains.common import to_dict, profile_to_dict

    job_dict = to_dict(job_obj)
    profile_dict = profile_to_dict(profile_obj)

    job_json = json.dumps(job_dict)
    profile_json = json.dumps(profile_dict)

    return generate_cover_letter.invoke({
        "job_info": job_json,
        "profile_info": profile_json,
        "tailored_resume": ""
    })
