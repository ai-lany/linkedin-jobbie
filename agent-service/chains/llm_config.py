"""
LLM configuration and initialization for agent tools
"""
import logging
import os
from langchain_ollama import ChatOllama
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)


def get_llm(temperature: float = 0.3, model: str = None):
    """
    Get configured LLM instance

    Args:
        temperature: Temperature for generation (0-1)
        model: Optional model override

    Returns:
        Configured ChatOllama instance
    """
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model_name = model or os.getenv("OLLAMA_MODEL", "llama3.2:3b")

    logger.info("Initializing LLM: model=%s, temperature=%s", model_name, temperature)

    return ChatOllama(
        model=model_name,
        base_url=ollama_base_url,
        temperature=temperature,
    )


def get_llm_chain(temperature: float = 0.3, model: str = None):
    """
    Get LLM with output parser chain

    Returns:
        LLM | StrOutputParser chain
    """
    llm = get_llm(temperature=temperature, model=model)
    parser = StrOutputParser()
    return llm | parser
