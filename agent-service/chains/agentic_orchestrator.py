"""
Agentic orchestrator for job application processing

This orchestrator uses a ReAct-style agent that can dynamically decide:
- Which tools to use (resume, cover letter, questions)
- In what order to use them
- How to use outputs from one tool as input to another
"""
import json
from typing import Any, Dict, List, Optional

from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage

from chains.llm_config import get_llm
from chains.resume_tool import tailor_resume
from chains.cover_letter_tool import generate_cover_letter
from chains.question_answering_tool import answer_application_questions
from chains.common import to_dict, profile_to_dict


# Agent system prompt
AGENT_SYSTEM_PROMPT = """You are an expert job application assistant that helps candidates apply to jobs.

You have access to three specialized tools:
1. tailor_resume - Customizes the candidate's resume for a specific job
2. generate_cover_letter - Creates a personalized cover letter
3. answer_application_questions - Answers job application questions

Your task is to process a job application by using these tools intelligently.

Guidelines:
- ALWAYS tailor the resume first - this provides context for other tasks
- Generate a cover letter after the resume (you can reference the tailored resume)
- Only answer questions if they were provided
- Use the output from previous tools to inform later ones
- Be efficient - don't use a tool if it's not needed

Think step-by-step about what the application needs and use the appropriate tools.

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}"""


def run_agentic_orchestrator(
    job_obj: Any,
    profile_obj: Any,
    questions: Optional[List[Dict[str, Any]]] = None,
    model: str = None,
) -> Dict[str, Any]:
    """
    Runs agentic orchestrator for job application processing

    The agent will intelligently decide which tools to use and in what order,
    potentially using outputs from one tool as context for another.

    Args:
        job_obj: Job object with title, company, description, etc.
        profile_obj: Profile object with name, email, resume_text, etc.
        questions: Optional list of application questions
        model: Optional model name override

    Returns:
        {
            "refined_resume": str,
            "cover_letter": str,
            "answers": [{"question": "...", "answer": "..."}],
            "success": bool,
            "message": str,
            "agent_reasoning": str  # Agent's thought process
        }
    """
    results = {
        "success": False,
        "refined_resume": "",
        "cover_letter": "",
        "answers": [],
        "message": "",
        "agent_reasoning": ""
    }

    try:
        print("[AGENTIC_ORCHESTRATOR] Starting agentic application processing...")

        # Convert objects to JSON for tools
        job_dict = to_dict(job_obj)
        profile_dict = profile_to_dict(profile_obj)

        job_json = json.dumps(job_dict)
        profile_json = json.dumps(profile_dict)

        # Prepare the agent input
        has_questions = questions and len(questions) > 0
        questions_json = json.dumps(questions) if has_questions else "[]"

        # Build the task description for the agent
        task_description = f"""
Process a job application for the following:

Job Title: {job_dict.get('title', 'Unknown')}
Company: {job_dict.get('company', 'Unknown')}
Candidate: {profile_dict.get('name', 'Unknown')}

Job Information (JSON): {job_json}
Profile Information (JSON): {profile_json}
Questions (JSON): {questions_json}

Tasks to complete:
1. Tailor the resume for this job (REQUIRED)
2. Generate a cover letter (REQUIRED)
{"3. Answer the application questions (REQUIRED)" if has_questions else "3. Skip questions (none provided)"}

For each tool:
- tailor_resume expects: job_info (JSON string), profile_info (JSON string)
- generate_cover_letter expects: job_info (JSON string), profile_info (JSON string), tailored_resume (optional string)
- answer_application_questions expects: job_info (JSON string), profile_info (JSON string), questions (JSON string)

Return a final summary of what was generated.
"""

        # Create the agent using LangGraph
        llm = get_llm(temperature=0.1, model=model)  # Low temp for logical reasoning

        tools = [tailor_resume, generate_cover_letter]
        if has_questions:
            tools.append(answer_application_questions)

        # Create react agent graph
        agent_executor = create_react_agent(llm, tools)

        print(f"[AGENTIC_ORCHESTRATOR] Running agent with {len(tools)} tools...")
        print(f"[AGENTIC_ORCHESTRATOR] Task: {job_dict.get('title')} at {job_dict.get('company')}")

        # Execute the agent with LangGraph API
        result = agent_executor.invoke({
            "messages": [HumanMessage(content=task_description)]
        })

        # Extract results from agent's messages
        messages = result.get("messages", [])
        agent_output = messages[-1].content if messages else ""

        # Log agent's reasoning and tool calls
        print(f"\n[AGENT TRACE] ===== Agent Execution Trace =====")
        for i, msg in enumerate(messages):
            msg_type = type(msg).__name__
            print(f"[AGENT TRACE] Step {i+1}: {msg_type}")

            # Log AI messages (agent's thoughts)
            if msg_type == "AIMessage":
                if hasattr(msg, 'content') and msg.content:
                    print(f"[AGENT TRACE]   Thought: {msg.content[:200]}...")
                if hasattr(msg, 'tool_calls') and msg.tool_calls:
                    for tc in msg.tool_calls:
                        print(f"[AGENT TRACE]   Tool Call: {tc.get('name', 'unknown')}")

            # Log tool responses
            elif msg_type == "ToolMessage":
                print(f"[AGENT TRACE]   Tool Response: {len(msg.content)} chars")

        print(f"[AGENT TRACE] ===== End Trace =====\n")

        # Extract intermediate steps from messages
        intermediate_steps = []
        for msg in messages:
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tool_call in msg.tool_calls:
                    # Find the corresponding tool response
                    for response_msg in messages:
                        if hasattr(response_msg, 'tool_call_id') and response_msg.tool_call_id == tool_call['id']:
                            intermediate_steps.append((tool_call, response_msg.content))
                            break

        print(f"[AGENTIC_ORCHESTRATOR] Agent completed with {len(messages)} messages")

        # Parse tool outputs from messages
        for msg in messages:
            # Check if this is a tool response message
            if hasattr(msg, 'tool_call_id') and hasattr(msg, 'content'):
                # Find the corresponding tool call to get the tool name
                for call_msg in messages:
                    if hasattr(call_msg, 'tool_calls'):
                        for tool_call in call_msg.tool_calls:
                            if tool_call.get('id') == msg.tool_call_id:
                                tool_name = tool_call.get('name')
                                observation = msg.content

                                if tool_name == "tailor_resume":
                                    results["refined_resume"] = observation
                                    print(f"[AGENTIC_ORCHESTRATOR] Captured resume: {len(observation)} chars")

                                elif tool_name == "generate_cover_letter":
                                    results["cover_letter"] = observation
                                    print(f"[AGENTIC_ORCHESTRATOR] Captured cover letter: {len(observation)} chars")

                                elif tool_name == "answer_application_questions":
                                    try:
                                        results["answers"] = json.loads(observation)
                                        print(f"[AGENTIC_ORCHESTRATOR] Captured {len(results['answers'])} answers")
                                    except json.JSONDecodeError:
                                        print(f"[AGENTIC_ORCHESTRATOR] Warning: Could not parse answers JSON")
                                        results["answers"] = []

        # Store agent reasoning
        results["agent_reasoning"] = agent_output
        results["success"] = True
        results["message"] = "Application processed successfully by agent"

        print("[AGENTIC_ORCHESTRATOR] Agent processing completed successfully")

    except Exception as exc:
        print(f"[AGENTIC_ORCHESTRATOR] Error: {exc}")
        results["message"] = f"Agentic orchestration failed: {str(exc)}"
        results["success"] = False

    return results
