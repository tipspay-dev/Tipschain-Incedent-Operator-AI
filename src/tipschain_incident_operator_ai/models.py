from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Literal


Severity = Literal["SEV-0", "SEV-1", "SEV-2", "SEV-3", "SEV-4"]
ActionLabel = Literal[
    "approved-safe",
    "needs-human-approval",
    "evidence-preserving",
    "containment",
    "recovery",
    "communication",
]


@dataclass(slots=True)
class ImmediateAction:
    description: str
    labels: List[ActionLabel]
    rationale: str


@dataclass(slots=True)
class EvidenceRegister:
    transaction_hashes: List[str] = field(default_factory=list)
    wallet_addresses: List[str] = field(default_factory=list)
    contracts: List[str] = field(default_factory=list)
    block_numbers: List[str] = field(default_factory=list)
    log_sources: List[str] = field(default_factory=list)
    screenshots: List[str] = field(default_factory=list)
    alerts: List[str] = field(default_factory=list)
    timeline_entries: List[str] = field(default_factory=list)


@dataclass(slots=True)
class ImpactAssessment:
    funds_at_risk: str
    systems_affected: str
    users_affected: str
    operational_risk: str
    reputational_risk: str
    regulatory_compliance_risk: str


@dataclass(slots=True)
class EscalationDecision:
    escalate: bool
    who_to_page: List[str]
    why: str


@dataclass(slots=True)
class IncidentReportInput:
    incident_title: str
    severity: Severity
    confidence_level: str
    current_status: str
    affected_systems_assets: str
    potential_business_impact: str
    summary: str
    earliest_known_timestamp_utc: str
    detection_source: str
    current_observed_indicators: List[str]
    confirmed_facts: List[str]
    working_hypotheses: List[str]
    impact_assessment: ImpactAssessment
    immediate_actions: List[ImmediateAction]
    investigation_logs_to_check: List[str]
    investigation_onchain_data: List[str]
    investigation_wallets_contracts_transactions: List[str]
    investigation_access_changes: List[str]
    teams_to_involve: List[str]
    evidence_register: EvidenceRegister
    escalation_decision: EscalationDecision
    unknowns: List[str]
    confirm_next: List[str]
    estimated_decision_point_utc: str
    recommended_next_step: str
