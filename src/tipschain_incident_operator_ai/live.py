from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Any, Literal

from .prompt import SYSTEM_PROMPT


DEFAULT_OPENAI_MODEL = "gpt-5.4"
ReasoningEffort = Literal["none", "low", "medium", "high", "xhigh"]
_SECRET_PATTERN = re.compile(r"\b(?:sk|sess)-[A-Za-z0-9_\-]+\b")


@dataclass(slots=True)
class LiveAssessmentResult:
    output_text: str
    response_id: str | None
    model: str
    request_id: str | None


def _redact_secrets(text: str) -> str:
    return _SECRET_PATTERN.sub("<redacted-secret>", text)


def _extract_output_text(response: Any) -> str:
    output_text = getattr(response, "output_text", None)
    if output_text:
        return output_text

    if hasattr(response, "model_dump"):
        payload = response.model_dump()
    elif isinstance(response, dict):
        payload = response
    else:
        payload = None

    if not isinstance(payload, dict):
        raise RuntimeError("OpenAI response did not expose an output_text value.")

    collected: list[str] = []
    for item in payload.get("output", []):
        for content_item in item.get("content", []):
            if content_item.get("type") == "output_text" and content_item.get("text"):
                collected.append(content_item["text"])

    if collected:
        return "\n".join(collected)
    raise RuntimeError("OpenAI response did not include any output text content.")


def _build_client(*, api_key: str | None, base_url: str | None) -> Any:
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError(
            "The openai package is not installed. Install project dependencies with `pip install -e .`."
        ) from exc

    client_args: dict[str, str] = {}
    if api_key:
        client_args["api_key"] = api_key
    if base_url:
        client_args["base_url"] = base_url
    return OpenAI(**client_args)


def request_live_assessment(
    *,
    user_input: str,
    model: str = DEFAULT_OPENAI_MODEL,
    api_key: str | None = None,
    base_url: str | None = None,
    reasoning_effort: ReasoningEffort | None = None,
    store: bool = False,
) -> LiveAssessmentResult:
    resolved_api_key = api_key or os.getenv("OPENAI_API_KEY")
    if not resolved_api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Export the key and retry the live assessment command."
        )

    resolved_base_url = base_url or os.getenv("OPENAI_BASE_URL")
    client = _build_client(api_key=resolved_api_key, base_url=resolved_base_url)

    request_payload: dict[str, Any] = {
        "model": model,
        "instructions": SYSTEM_PROMPT,
        "input": user_input,
        "store": store,
    }
    if reasoning_effort:
        request_payload["reasoning"] = {"effort": reasoning_effort}

    try:
        response = client.responses.create(**request_payload)
    except Exception as exc:
        try:
            from openai import OpenAIError
        except ImportError:
            OpenAIError = Exception
        if isinstance(exc, OpenAIError):
            raise RuntimeError(f"OpenAI API request failed: {_redact_secrets(str(exc))}") from exc
        raise

    return LiveAssessmentResult(
        output_text=_extract_output_text(response),
        response_id=getattr(response, "id", None),
        model=getattr(response, "model", model),
        request_id=getattr(response, "_request_id", None),
    )
