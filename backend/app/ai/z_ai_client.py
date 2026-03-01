import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Model used across all calls — z.ai coding plan endpoint
DEFAULT_MODEL = "glm-4.7-flash"
BASE_URL = "https://api.z.ai/api/coding/paas/v4/"

ZAI_API_KEY = os.getenv("ZAI_API_KEY")

# Load the backend explainability prompt
_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "backend_prompt.txt"
_SYSTEM_PROMPT = _PROMPT_PATH.read_text(encoding="utf-8")


def call_z_ai(context: dict, model: str = DEFAULT_MODEL) -> dict:
    """
    Send precomputed clinical context to z.ai (ZaiClient) and get a
    plain-language explanation back.

    The model is constrained by backend_prompt.txt to act as an
    explainability module only — no independent medical reasoning.

    Returns:
        Parsed dict with keys: explanation, risk_summary,
        preventive_guidance, follow_up_questions, safety_note.
        Returns {} on any failure so the endpoint can use its fallback.
    """
    if not ZAI_API_KEY:
        print("[z_ai_client] WARNING: ZAI_API_KEY not set — using fallback explanation.")
        return {}

    try:
        from zai import ZaiClient

        client = ZaiClient(
            api_key=ZAI_API_KEY,
            base_url=BASE_URL,
        )

        user_message = (
            "Here is the precomputed clinical reasoning output. "
            "Produce the explanation JSON exactly as instructed:\n\n"
            + json.dumps(context, indent=2)
        )

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            max_tokens=600,
        )

        raw_text: str = response.choices[0].message.content.strip()

        # Strip markdown fences if the model wraps the JSON
        if "```" in raw_text:
            import re
            match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw_text)
            if match:
                raw_text = match.group(1).strip()

        return json.loads(raw_text)

    except json.JSONDecodeError:
        print("[z_ai_client] WARNING: AI response was not valid JSON — fallback used.")
        return {}
    except Exception as exc:
        print(f"[z_ai_client] WARNING: AI call failed ({type(exc).__name__}: {exc}) — fallback used.")
        return {}



def call_z_ai_chat(messages: list[dict], model: str = DEFAULT_MODEL) -> str:
    """
    General-purpose chat call for the patient chatbot endpoint.
    Always returns a string — never raises.

    Returns:
        Assistant response string, or a user-friendly error message.
    """
    if not ZAI_API_KEY:
        return (
            "I'm unable to respond right now because the AI service is not configured. "
            "Please ask your administrator to set ZAI_API_KEY in the .env file."
        )

    try:
        from zai import ZaiClient

        client = ZaiClient(
            api_key=ZAI_API_KEY,
            base_url=BASE_URL,
        )

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.5,
            max_tokens=800,
        )
        return response.choices[0].message.content.strip()

    except Exception as exc:
        print(f"[z_ai_client] Chat call failed: {type(exc).__name__}: {exc}")
        return (
            "I'm having trouble connecting to the AI service right now. "
            "Please try again shortly."
        )
