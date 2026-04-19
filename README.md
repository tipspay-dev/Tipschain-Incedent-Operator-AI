# Tipschain-Incedent-Operator-AI

Tipschain-Incedent-Operator-AI is a focused blockchain security incident response assistant for Tipschain.

It provides:
- a strict system prompt for incident commander behavior
- a structured incident data model
- a markdown report generator that follows the required response format
- an LLM message builder for API or chatbot integration
- a live OpenAI Responses API integration for raw alerts and JSON incidents
- a CLI for turning incident JSON into a ready-to-use incident report

## Quick Start

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .
python -m tipschain_incident_operator_ai --input examples/sample_incident.json
python -m tipschain_incident_operator_ai --input examples/sample_incident.json --prompt-only
```

If you do not want to install the package yet, you can run it directly:

```bash
$env:PYTHONPATH="src"
python -m tipschain_incident_operator_ai --input examples/sample_incident.json
```

## Live Model Wiring

This repo can now call the OpenAI Responses API directly for live incident assessments.

Set your API key first:

```powershell
$env:OPENAI_API_KEY="your-key-here"
```

Generate a live assessment from a structured JSON incident:

```powershell
python -m tipschain_incident_operator_ai --input examples/sample_incident.json --live
```

Generate a live assessment from a raw alert text file:

```powershell
python -m tipschain_incident_operator_ai --alert-file examples/sample_alert.txt --live
```

Generate a live assessment from inline alert text:

```powershell
python -m tipschain_incident_operator_ai --alert-text "Unexpected admin role grant detected on treasury contract" --live
```

Optional model controls:

```powershell
python -m tipschain_incident_operator_ai --alert-file examples/sample_alert.txt --live --model gpt-5.4 --reasoning-effort medium
```

Notes:
- `gpt-5.4` is the default live model.
- API-side storage is disabled by default. Pass `--store` only if you explicitly want the request stored.
- You can set `OPENAI_BASE_URL` or pass `--base-url` for OpenAI-compatible gateways.

## Input Shape

The CLI accepts:
- a structured local report JSON file, such as [examples/sample_incident.json](/C:/Users/gunel/Documents/Codex/2026-04-19-https-github-com-tipspay-dev-tipschain/examples/sample_incident.json)
- a raw alert text file, such as [examples/sample_alert.txt](/C:/Users/gunel/Documents/Codex/2026-04-19-https-github-com-tipspay-dev-tipschain/examples/sample_alert.txt)
- arbitrary JSON incident intake for `--live` or `--prompt-only`

## Project Layout

- `src/tipschain_incident_operator_ai/prompt.py`
- `src/tipschain_incident_operator_ai/models.py`
- `src/tipschain_incident_operator_ai/engine.py`
- `src/tipschain_incident_operator_ai/live.py`
- `src/tipschain_incident_operator_ai/reporting.py`
- `src/tipschain_incident_operator_ai/cli.py`

## Notes

- The generated report never upgrades assumptions into facts.
- Severity is explicitly constrained to `SEV-0` through `SEV-4`.
- UTC timestamps are preserved in the report timeline.
- Recommended actions are labeled to support containment, recovery, communication, and evidence preservation decisions.
- Live mode requires `OPENAI_API_KEY`.
