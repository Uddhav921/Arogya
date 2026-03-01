import json
import os
import re
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

# Model used across all calls — z.ai coding plan endpoint
DEFAULT_MODEL = "glm-4.7-flash"
BASE_URL = "https://api.z.ai/api/coding/paas/v4/"

ZAI_API_KEY = os.getenv("ZAI_API_KEY")

# Load the backend explainability prompt
_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "backend_prompt.txt"
_SYSTEM_PROMPT = _PROMPT_PATH.read_text(encoding="utf-8")

# Timeout for API calls (seconds)
_TIMEOUT = 90


def _post_chat(messages: list[dict], model: str, temperature: float, max_tokens: int) -> dict | None:
    """
    Low-level helper: POST to the z.ai chat/completions endpoint.
    Returns the parsed JSON body, or None on failure.
    """
    url = BASE_URL.rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {ZAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    print(f"[z_ai_client] POST {url}  model={model}  msgs={len(messages)}  temp={temperature}")

    try:
        resp = httpx.post(url, json=payload, headers=headers, timeout=_TIMEOUT)
        print(f"[z_ai_client] HTTP {resp.status_code}  len={len(resp.text)}")

        if resp.status_code != 200:
            print(f"[z_ai_client] ERROR body: {resp.text[:500]}")
            return None

        body = resp.json()
        return body

    except httpx.TimeoutException:
        print("[z_ai_client] ERROR: Request timed out")
        return None
    except Exception as exc:
        print(f"[z_ai_client] ERROR: {type(exc).__name__}: {exc}")
        return None


def _extract_content(body: dict | None) -> str | None:
    """Extract assistant content from a chat/completions response body."""
    if not body:
        return None

    choices = body.get("choices")
    if not choices or not isinstance(choices, list) or len(choices) == 0:
        print(f"[z_ai_client] WARNING: No choices in response. Keys: {list(body.keys())}")
        # Check if there's an error field
        if "error" in body:
            print(f"[z_ai_client] API error: {body['error']}")
        return None

    message = choices[0].get("message", {})
    content = message.get("content")

    if not content or not content.strip():
        print(f"[z_ai_client] WARNING: content is empty/null. Full choice: {json.dumps(choices[0], ensure_ascii=False)[:300]}")
        return None

    return content.strip()


def call_z_ai(context: dict, model: str = DEFAULT_MODEL) -> dict:
    """
    Send precomputed clinical context to z.ai and get a
    plain-language explanation back.

    Returns:
        Parsed dict with keys: explanation, risk_summary,
        preventive_guidance, follow_up_questions, safety_note.
        Returns {} on any failure so the endpoint can use its fallback.
    """
    if not ZAI_API_KEY:
        print("[z_ai_client] WARNING: ZAI_API_KEY not set — using fallback explanation.")
        return {}

    user_message = (
        "Here is the precomputed clinical reasoning output. "
        "Produce the explanation JSON exactly as instructed:\n\n"
        + json.dumps(context, indent=2)
    )

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    body = _post_chat(messages, model=model, temperature=0.1, max_tokens=2048)
    raw_text = _extract_content(body)

    if not raw_text:
        print("[z_ai_client] WARNING: AI response was empty — fallback used.")
        return {}

    try:
        # Strip markdown fences if the model wraps the JSON
        if "```" in raw_text:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw_text)
            if match:
                raw_text = match.group(1).strip()

        return json.loads(raw_text)

    except json.JSONDecodeError:
        print(f"[z_ai_client] WARNING: AI response was not valid JSON — fallback used. Raw: {raw_text[:200]}")
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

    body = _post_chat(messages, model=model, temperature=0.5, max_tokens=4096)
    content = _extract_content(body)

    if content:
        return content

    # If we got a body but no content, log the full response for debugging
    if body:
        print(f"[z_ai_client] Chat: full response body: {json.dumps(body, ensure_ascii=False)[:1000]}")
    else:
        print("[z_ai_client] Chat: No response body returned from _post_chat.")

    return (
        "I received your message but wasn't able to generate a response. "
        "This can happen when the AI service is overloaded. Please try again."
    )
