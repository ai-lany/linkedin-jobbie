import logging
from typing import Any, Dict, List, Optional

from chains.resume_chain import run_resume_chain
from chains.cover_letter_chain import run_cover_letter_chain
from chains.question_answering_chain import run_question_answering_chain

logger = logging.getLogger(__name__)


def run_orchestrator_chain(
    job_obj: Any,
    profile_obj: Any,
    questions: Optional[List[Dict[str, Any]]] = None,
    model: str = None,
) -> Dict[str, Any]:
    """
    Orchestrates full application process:
    1. Refines resume for job
    2. Generates cover letter
    3. Answers questions if present

    Args:
        job_obj: Job object with title, company, description, etc.
        profile_obj: Profile object with name, email, resume_text, etc.
        questions: Optional list of question dicts with 'question', 'type', and 'options'
        model: Optional model name override

    Returns:
        {
            "refined_resume": str,
            "cover_letter": str,
            "answers": [{"question": "...", "answer": "..."}],
            "success": bool,
            "message": str
        }
    """
    results = {
        "success": False,
        "refined_resume": "",
        "cover_letter": "",
        "answers": [],
        "message": ""
    }

    try:
        # Step 1: Refine resume (always)
        logger.info("Step 1/3: Refining resume...")
        refined_resume = run_resume_chain(job_obj, profile_obj, model=model)
        results["refined_resume"] = refined_resume

        # Step 2: Generate cover letter (always)
        logger.info("Step 2/3: Generating cover letter...")
        cover_letter = run_cover_letter_chain(job_obj, profile_obj, model=model)
        results["cover_letter"] = cover_letter

        # Step 3: Answer questions (conditional)
        if questions and len(questions) > 0:
            logger.info("Step 3/3: Answering %s questions...", len(questions))
            answers = run_question_answering_chain(job_obj, profile_obj, questions, model=model)
            results["answers"] = answers
        else:
            logger.info("Step 3/3: Skipped (no questions)")

        results["success"] = True
        results["message"] = "Application completed successfully"

    except Exception:
        logger.exception("Orchestration failed")
        results["message"] = "Orchestration failed"

    return results
