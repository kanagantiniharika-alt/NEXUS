import os
import json
from typing import Union
from google import genai
from google.genai import types
from backend.config import settings

def get_gemini_client():
    """
    Returns an initialized GenAI client if the GEMINI_API_KEY is configured.
    Otherwise returns None so that routes can fall back gracefully.
    """
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Google GenAI Client: {e}")
        return None

async def query_gemini_structured(contents: Union[str, types.Content, types.Part, list, None], response_schema=None, fallback_response: str = "{}", model_name: str = "gemini-2.5-flash") -> str:
    """
    Queries Gemini model with text or rich content parts and optional structured output schema.
    Returns the raw model text block, clean of markdown ticks.
    """
    client = get_gemini_client()
    if not client:
        return fallback_response

    try:
        config = types.GenerateContentConfig(
            temperature=0.2,
        )
        
        # Configure JSON constraint block if schema is requested
        if response_schema:
            config.response_mime_type = "application/json"
            config.response_schema = response_schema

        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=config
        )
        
        text = response.text.strip()
        # strip markdown artifacts if model returned backslash/triple-backticks in plain text
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return text.strip()
        
    except Exception as e:
        print(f"Gemini service exception: {e}")
        return fallback_response
