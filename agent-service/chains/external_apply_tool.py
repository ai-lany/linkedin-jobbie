"""
External application portal automation tool.
"""
import json
import os
import tempfile
import urllib.request
from typing import Any, Dict, List

from langchain_core.tools import tool
from playwright.sync_api import sync_playwright


def _normalize_resume_url(resume_url: str) -> str:
    if not resume_url:
        return ""
    if resume_url.startswith("http://") or resume_url.startswith("https://"):
        return resume_url
    base_url = os.getenv("BACKEND_BASE_URL", "http://localhost:5001")
    return f"{base_url}{resume_url}"


def _download_resume(resume_url: str) -> str:
    if not resume_url:
        return ""
    normalized_url = _normalize_resume_url(resume_url)
    suffix = os.path.splitext(normalized_url)[-1] or ".bin"
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_file.close()
    urllib.request.urlretrieve(normalized_url, temp_file.name)
    return temp_file.name


@tool
def inspect_external_application(portal_url: str) -> str:
    """
    Inspect an external job application portal and return its form requirements.

    Args:
        portal_url: URL of the external application portal with jobId query param.

    Returns:
        JSON string describing required fields and questions.
    """
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(portal_url, wait_until="networkidle")
            page.wait_for_selector("#application-form", timeout=15000)

            cover_letter_required = page.locator("#coverLetter[required]").count() > 0
            resume_required = page.locator("#resume[required]").count() > 0

            questions: List[Dict[str, str]] = []
            question_nodes = page.locator("#questions-container .question-group")
            for idx in range(question_nodes.count()):
                label = question_nodes.nth(idx).locator("label")
                textarea = question_nodes.nth(idx).locator("textarea")
                label_text = label.inner_text().strip() if label.count() > 0 else ""
                selector = textarea.first.evaluate("el => '#' + el.id") if textarea.count() > 0 else ""
                if selector:
                    questions.append({
                        "question": label_text,
                        "selector": selector
                    })

            browser.close()

        return json.dumps({
            "success": True,
            "requires_cover_letter": cover_letter_required,
            "requires_resume": resume_required,
            "questions": questions
        })
    except Exception as exc:
        return json.dumps({"success": False, "message": f"Inspection failed: {exc}", "questions": []})


@tool
def submit_external_application(
    portal_url: str,
    profile_info: str,
    cover_letter: str = "",
    answers_json: str = "[]",
    resume_url: str = "",
) -> str:
    """
    Fill out and submit an external job application portal using browser automation.

    Args:
        portal_url: URL of the external application portal with jobId query param.
        profile_info: JSON string containing candidate profile (name, email).
        cover_letter: Optional cover letter text to fill in.
        answers_json: JSON string of question/answer pairs.
        resume_url: URL or path to resume file hosted by the backend.

    Returns:
        JSON string with success status and message.
    """
    temp_resume_path = ""
    try:
        profile = json.loads(profile_info)
        answers: List[Dict[str, Any]] = json.loads(answers_json) if answers_json else []
    except json.JSONDecodeError as exc:
        return json.dumps({"success": False, "message": f"Invalid JSON input: {exc}"})

    answers_by_question = {
        answer.get("question", ""): answer.get("answer", "")
        for answer in answers
        if isinstance(answer, dict)
    }

    try:
        if resume_url:
            temp_resume_path = _download_resume(resume_url)

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(portal_url, wait_until="networkidle")
            page.wait_for_selector("#application-form", timeout=15000)

            page.fill("#fullName", profile.get("name", "Applicant"))
            page.fill("#email", profile.get("email", ""))

            if cover_letter:
                page.fill("#coverLetter", cover_letter)

            if temp_resume_path:
                page.set_input_files("#resume", temp_resume_path)

            question_nodes = page.locator("#questions-container .question-group")
            for idx in range(question_nodes.count()):
                label = question_nodes.nth(idx).locator("label")
                textarea = question_nodes.nth(idx).locator("textarea")
                label_text = label.inner_text().strip() if label.count() > 0 else ""
                if textarea.count() > 0:
                    answer_value = answers_by_question.get(label_text, "")
                    if not answer_value and idx < len(answers):
                        answer_value = answers[idx].get("answer", "")
                    if answer_value:
                        textarea.first.fill(answer_value)

            page.click("button.submit-btn")
            page.wait_for_selector("#success", timeout=20000)
            browser.close()

        return json.dumps({
            "success": True,
            "message": "External application submitted successfully"
        })
    except Exception as exc:
        return json.dumps({"success": False, "message": f"External apply failed: {exc}"})
    finally:
        if temp_resume_path:
            try:
                os.remove(temp_resume_path)
            except OSError:
                pass
