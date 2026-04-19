from __future__ import annotations

from .models import IncidentReportInput


def _render_bullets(items: list[str], fallback: str = "None recorded.") -> str:
    if not items:
        return f"- {fallback}"
    return "\n".join(f"- {item}" for item in items)


def render_incident_report(report: IncidentReportInput) -> str:
    action_lines = []
    for action in report.immediate_actions:
        labels = ", ".join(action.labels)
        action_lines.append(f"- {action.description} [{labels}]")
        action_lines.append(f"  Why: {action.rationale}")

    evidence = report.evidence_register
    escalation = report.escalation_decision
    escalate_text = "Yes" if escalation.escalate else "No"

    sections = [
        "# Incident Report",
        "",
        "## 1. Executive Summary",
        f"- Incident title: {report.incident_title}",
        f"- Severity: {report.severity}",
        f"- Confidence level: {report.confidence_level}",
        f"- Current status: {report.current_status}",
        f"- Affected systems/assets: {report.affected_systems_assets}",
        f"- Potential business impact: {report.potential_business_impact}",
        "",
        "## 2. What Happened",
        f"- Short plain-English summary: {report.summary}",
        f"- Earliest known timestamp: {report.earliest_known_timestamp_utc}",
        f"- Detection source: {report.detection_source}",
        "- Current observed indicators:",
        _render_bullets(report.current_observed_indicators),
        "",
        "## 3. Confirmed Facts",
        _render_bullets(report.confirmed_facts, "No confirmed facts supplied yet."),
        "",
        "## 4. Working Hypotheses",
        _render_bullets(report.working_hypotheses, "No working hypotheses recorded yet."),
        "",
        "## 5. Impact Assessment",
        f"- Funds at risk: {report.impact_assessment.funds_at_risk}",
        f"- Systems affected: {report.impact_assessment.systems_affected}",
        f"- Users affected: {report.impact_assessment.users_affected}",
        f"- Operational risk: {report.impact_assessment.operational_risk}",
        f"- Reputational risk: {report.impact_assessment.reputational_risk}",
        f"- Regulatory/compliance risk: {report.impact_assessment.regulatory_compliance_risk}",
        "",
        "## 6. Immediate Actions",
        "\n".join(action_lines) if action_lines else "- No immediate actions recorded.",
        "",
        "## 7. Investigation Plan",
        "- Logs to check:",
        _render_bullets(report.investigation_logs_to_check),
        "- On-chain data to inspect:",
        _render_bullets(report.investigation_onchain_data),
        "- Wallets/contracts/transactions to review:",
        _render_bullets(report.investigation_wallets_contracts_transactions),
        "- Access changes to verify:",
        _render_bullets(report.investigation_access_changes),
        "- Teams to involve:",
        _render_bullets(report.teams_to_involve),
        "",
        "## 8. Evidence Register",
        "- Transaction hashes:",
        _render_bullets(evidence.transaction_hashes),
        "- Wallet addresses:",
        _render_bullets(evidence.wallet_addresses),
        "- Contracts:",
        _render_bullets(evidence.contracts),
        "- Block numbers:",
        _render_bullets(evidence.block_numbers),
        "- Log sources:",
        _render_bullets(evidence.log_sources),
        "- Screenshots:",
        _render_bullets(evidence.screenshots),
        "- Alerts:",
        _render_bullets(evidence.alerts),
        "- Timeline entries:",
        _render_bullets(evidence.timeline_entries),
        "",
        "## 9. Escalation Decision",
        f"- Escalate: {escalate_text}",
        "- Who should be paged:",
        _render_bullets(escalation.who_to_page),
        f"- Why: {escalation.why}",
        "",
        "## 10. Next Update",
        "- What is still unknown:",
        _render_bullets(report.unknowns),
        "- What should be confirmed next:",
        _render_bullets(report.confirm_next),
        f"- Estimated decision point: {report.estimated_decision_point_utc}",
        "",
        "## Recommended Next Step",
        report.recommended_next_step,
    ]
    return "\n".join(sections)
