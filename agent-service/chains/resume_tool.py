"""
Resume tailoring tool for agentic application processing
"""
import json
import logging
from typing import Dict, Any
from langchain_core.tools import tool
from jinja2 import Template

from chains.llm_config import get_llm_chain

logger = logging.getLogger(__name__)


DEFAULT_TEMPLATE = """
You are an expert resume writer helping a candidate tailor their resume for a specific job.

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
Create a tailored resume summary that:
1. Highlights the candidate's most relevant experience for this specific role
2. Uses keywords from the job description naturally
3. Shows clear value proposition for the employer
4. Is concise (3-5 sentences)
5. Includes a bullet list of top 3-5 skill alignments

Return ONLY the tailored content, no preamble or explanation.
Format as:
### Tailored Summary
[Your summary here]

### Key Skills
• [Skill alignment 1]
• [Skill alignment 2]
• [Skill alignment 3]
""".strip()


@tool
def tailor_resume(job_info: str, profile_info: str) -> str:
    """
    Tailors a candidate's resume for a specific job posting.

    Use this tool when you need to customize a resume to highlight relevant experience
    and skills for a particular job opportunity. The tool analyzes the job requirements
    and emphasizes the most relevant parts of the candidate's background.

    Args:
        job_info: JSON string containing job details (title, company, description, etc.)
        profile_info: JSON string containing candidate profile (name, email, resume_text, etc.)

    Returns:
        Tailored resume content with summary and key skills
    """
    try:
        logger.info("Parsing resume input...")
        job = json.loads(job_info)
        profile = json.loads(profile_info)

        logger.info("Tailoring resume for: %s at %s", job.get('title', 'Unknown'), job.get('company', 'Unknown'))

        # Render prompt template
        template = Template(DEFAULT_TEMPLATE)
        prompt = template.render(job=job, profile=profile)

        # Get LLM chain and invoke
        llm_chain = get_llm_chain(temperature=0.1)  # Low temp for factual resume

        logger.info("Invoking LLM (prompt length: %s chars)...", len(prompt))
        result = llm_chain.invoke(prompt)

        logger.info("Generated resume content (%s chars)", len(result))
        return result

    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON input: {e}"
        logger.error("Resume input error: %s", error_msg)
        return f"Error: {error_msg}. Please provide valid JSON strings."
    except Exception as e:
        error_msg = f"Failed to tailor resume: {str(e)}"
        logger.exception("Resume generation failed: %s", error_msg)
        return f"Error: {error_msg}"


# For backward compatibility with non-agentic code
def run_resume_chain(job_obj: Any, profile_obj: Any, template_str: str = None, model: str = None) -> str:
    """
    Legacy function for backward compatibility
    Converts objects to JSON and calls the tool
    """
    from chains.common import to_dict, profile_to_dict

    job_dict = to_dict(job_obj)
    profile_dict = profile_to_dict(profile_obj)

    job_json = json.dumps(job_dict)
    profile_json = json.dumps(profile_dict)

    return tailor_resume.invoke({"job_info": job_json, "profile_info": profile_json})
