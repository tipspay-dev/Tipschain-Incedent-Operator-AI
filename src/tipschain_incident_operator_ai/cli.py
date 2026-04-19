from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from .engine import (
    build_llm_messages,
    build_raw_alert_messages,
    build_raw_alert_context,
    build_user_context,
    normalize_raw_source,
)
from .live import DEFAULT_OPENAI_MODEL, request_live_assessment
from .models import (
    EscalationDecision,
    EvidenceRegister,
    ImpactAssessment,
    ImmediateAction,
    IncidentReportInput,
)
from .reporting import render_incident_report


def _load_report_input(path: Path) -> IncidentReportInput:
    payload = json.loads(path.read_text(encoding="utf-8"))

    impact = ImpactAssessment(**payload["impact_assessment"])
    actions = [ImmediateAction(**item) for item in payload["immediate_actions"]]
    evidence = EvidenceRegister(**payload["evidence_register"])
    escalation = EscalationDecision(**payload["escalation_decision"])

    report_fields = dict(payload)
    report_fields["impact_assessment"] = impact
    report_fields["immediate_actions"] = actions
    report_fields["evidence_register"] = evidence
    report_fields["escalation_decision"] = escalation

    return IncidentReportInput(**report_fields)


def _load_raw_file(path: Path) -> tuple[str, str]:
    raw_payload = path.read_text(encoding="utf-8")
    normalized_payload, detected_label = normalize_raw_source(raw_payload)
    source_label = f"{detected_label} from {path.name}"
    return normalized_payload, source_label


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="tipschain-incident-operator-ai",
        description="Render or generate Tipschain incident reports from structured JSON or raw alert intake.",
    )
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument(
        "--input",
        type=Path,
        help="Path to a structured incident JSON file that matches the local report schema.",
    )
    source_group.add_argument(
        "--alert-file",
        type=Path,
        help="Path to a raw alert text file or arbitrary JSON incident payload for live assessment.",
    )
    source_group.add_argument(
        "--alert-text",
        help="Inline raw alert text for live assessment.",
    )
    parser.add_argument(
        "--prompt-only",
        action="store_true",
        help="Print the system and user messages instead of rendering or calling the model endpoint.",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Call the OpenAI Responses API and return a live incident assessment.",
    )
    parser.add_argument(
        "--model",
        default=os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL),
        help="OpenAI model to use for live assessments. Defaults to gpt-5.4.",
    )
    parser.add_argument(
        "--reasoning-effort",
        choices=["none", "low", "medium", "high", "xhigh"],
        help="Optional reasoning effort for compatible models.",
    )
    parser.add_argument(
        "--store",
        action="store_true",
        help="Allow OpenAI to store the response. Disabled by default for incident data sensitivity.",
    )
    parser.add_argument(
        "--base-url",
        type=str,
        help="Optional alternate OpenAI-compatible base URL. Falls back to OPENAI_BASE_URL if set.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    try:
        if args.input:
            report = _load_report_input(args.input)
            if args.prompt_only:
                messages = build_llm_messages(report)
                print(json.dumps(messages, indent=2))
                return
            if args.live:
                result = request_live_assessment(
                    user_input=build_user_context(report),
                    model=args.model,
                    reasoning_effort=args.reasoning_effort,
                    store=args.store,
                    base_url=args.base_url,
                )
                if result.response_id:
                    print(f"[response_id={result.response_id} model={result.model}]", file=sys.stderr)
                print(result.output_text)
                return
            print(render_incident_report(report))
            return

        if args.alert_file:
            raw_payload, source_label = _load_raw_file(args.alert_file)
        else:
            raw_payload, detected_label = normalize_raw_source(args.alert_text)
            source_label = f"{detected_label} from inline input"

        if args.prompt_only:
            messages = build_raw_alert_messages(raw_payload, source_label=source_label)
            print(json.dumps(messages, indent=2))
            return

        if not args.live:
            parser.error("Raw alert intake requires --live or --prompt-only.")

        result = request_live_assessment(
            user_input=build_raw_alert_context(raw_payload, source_label=source_label),
            model=args.model,
            reasoning_effort=args.reasoning_effort,
            store=args.store,
            base_url=args.base_url,
        )
        if result.response_id:
            print(f"[response_id={result.response_id} model={result.model}]", file=sys.stderr)
        print(result.output_text)
    except RuntimeError as exc:
        parser.exit(status=1, message=f"error: {exc}\n")
