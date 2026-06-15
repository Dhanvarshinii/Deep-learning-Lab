from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
from dataclasses import dataclass
from typing import Iterable

import spacy


@dataclass(frozen=True)
class ScispacyModelSpec:
    name: str
    purpose: str
    install_url: str


@dataclass(frozen=True)
class RegexPattern:
    entity: str
    pattern: str
    flags: int = re.IGNORECASE
    group: int = 0


@dataclass(frozen=True)
class EntityCandidate:
    candidate_id: int
    method: str
    source: str
    label: str
    meaning_group: str
    text: str
    start: int
    end: int


@dataclass(frozen=True)
class SelectedEntity:
    candidate: EntityCandidate
    reason: str


SCISPACY_MODEL_SPECS = [
    ScispacyModelSpec(
        name="en_core_sci_sm",
        purpose="general biomedical mentions",
        install_url="https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz",
    ),
    ScispacyModelSpec(
        name="en_ner_bc5cdr_md",
        purpose="disease and chemical",
        install_url="https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz",
    ),
    ScispacyModelSpec(
        name="en_ner_bionlp13cg_md",
        purpose="anatomy, pathology, cancer, tissue, cell, chemicals",
        install_url="https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bionlp13cg_md-0.5.4.tar.gz",
    ),
    ScispacyModelSpec(
        name="en_ner_craft_md",
        purpose="genes, chemicals, taxonomy, ontology/cell labels",
        install_url="https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_craft_md-0.5.4.tar.gz",
    ),
    ScispacyModelSpec(
        name="en_ner_jnlpba_md",
        purpose="DNA, RNA, protein, cell type, cell line",
        install_url="https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_jnlpba_md-0.5.4.tar.gz",
    ),
]


REGEX_PATTERNS = [
    RegexPattern("EMAIL", r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"),
    RegexPattern("PHONE", r"(?<!\d)(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)"),
    RegexPattern("SSN", r"\b\d{3}-\d{2}-\d{4}\b"),
    RegexPattern("URL", r"\bhttps?://[^\s)]+"),
    RegexPattern("IP_ADDRESS", r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    RegexPattern("DATE", r"\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b"),
    RegexPattern("DATE", r"\b(?:19|20)\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])\b"),
    RegexPattern("DATE", r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+(?:19|20)\d{2}\b"),
    RegexPattern("DATE_OF_BIRTH", r"\b(?:DOB|date of birth)\s*[:#-]?\s*(?:\d{1,2}[/-]\d{1,2}[/-](?:19|20)\d{2}|(?:19|20)\d{2}[-/]\d{1,2}[-/]\d{1,2})\b"),
    RegexPattern("TIME", r"\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b"),
    RegexPattern("AGE", r"\b(?:age(?:d)?\s*)?\d{1,3}\s*(?:-?\s*years? old|-?year-old|yo|y/o)\b|\bage\s*[:=]?\s*\d{1,3}\b"),
    RegexPattern("DOCTOR_NAME", r"\b(?:Dr|Doctor|Prof|Professor)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b", 0),
    RegexPattern("PATIENT_NAME", r"\b(?:Mr|Mrs|Ms|Miss)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b", 0),
    RegexPattern("PATIENT_NAME", r"\b(?:patient|pt|name)\s*(?:is|name|:)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b", re.IGNORECASE, 1),
    RegexPattern("HOSPITAL", r"\b((?:St\.?\s+)?[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,4}\s+(?:Hospital|Clinic|Medical Center|Health System|Healthcare|University Hospital|Cancer Center))\b", 0, 1),
    RegexPattern("ADDRESS", r"(?<![/.-])\b\d{1,6}\s+(?!(?:Dr|Doctor|Mr|Mrs|Ms|Prof)\.?\b)[A-Z0-9][A-Za-z0-9'.-]*(?:\s+[A-Za-z0-9'.-]+){0,5}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\.?\b(?:,\s*[A-Z][A-Za-z .'-]+)?(?:,\s*[A-Z]{2})?(?:\s+\d{5}(?:-\d{4})?)?"),
    RegexPattern("ZIP_CODE", r"(?<!CPT\s)\b\d{5}(?:-\d{4})?\b"),
    RegexPattern("CITY_STATE_ZIP", r"\b[A-Z][A-Za-z .'-]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?\b"),
    RegexPattern("MRN", r"\b(?:MRN|M\.?R\.?N\.?|medical record(?: number)?|record number)\s*[:#-]?\s*[A-Z0-9-]{4,}\b"),
    RegexPattern("PATIENT_ID", r"\b(?:patient|member|account|visit|encounter)\s*(?:id|number|no\.?)\s*[:#-]?\s*[A-Z0-9-]{3,}\b"),
    RegexPattern("NPI", r"\bNPI\s*[:#-]?\s*\d{10}\b"),
    RegexPattern("ICD10_CODE", r"\b[A-TV-Z][0-9][0-9AB](?:\.[0-9A-TV-Z]{1,4})?\b"),
    RegexPattern("CPT_CODE", r"\bCPT\s*[:#-]?\s*\d{5}\b"),
    RegexPattern("DOSAGE", r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|kg|mL|ml|L|units?|IU|%)\b"),
    RegexPattern("FREQUENCY", r"\b(?:once|twice|three times|four times)\s+(?:daily|a day|per day|weekly|monthly)\b|\b(?:q\d{1,2}h|qhs|qid|tid|bid|prn|daily|weekly|monthly)\b"),
    RegexPattern("DURATION", r"\bfor\s+\d+\s+(?:hours?|days?|weeks?|months?|years?)\b"),
    RegexPattern("ROUTE", r"\b(?:PO|IV|IM|SC|SQ|subcutaneous|intravenous|intramuscular|oral|topical|inhaled|nasal|rectal)\b"),
    RegexPattern("MEDICATION_CONTEXT", r"\b(?:prescribed|started|taking|takes|given|administered)\s+([A-Za-z][A-Za-z-]{2,})\b", re.IGNORECASE, 1),
    RegexPattern("BLOOD_PRESSURE", r"\b(?:BP|blood pressure)\s*[:=]?\s*\d{2,3}/\d{2,3}\b"),
    RegexPattern("HEART_RATE", r"\b(?:HR|heart rate|pulse)\s*[:=]?\s*\d{2,3}\s*(?:bpm)?\b"),
    RegexPattern("TEMPERATURE", r"\b(?:temp(?:erature)?\s*[:=]?\s*)?\d{2,3}(?:\.\d)?\s*(?:F|C|deg F|deg C)\b"),
    RegexPattern("OXYGEN_SATURATION", r"\b(?:SpO2|O2 sat|oxygen saturation)\s*[:=]?\s*\d{2,3}%(?=\W|$)"),
    RegexPattern("LAB_VALUE", r"\b(?:WBC|RBC|Hgb|Hb|hemoglobin|platelets?|creatinine|glucose|sodium|potassium|HbA1c|A1c|ALT|AST|BUN|INR|CRP)\s*[:=]?\s*\d+(?:\.\d+)?(?:\s*(?:mg/dL|g/dL|mmol/L|mEq/L|K/uL|%|U/L|ng/mL))?\b"),
    RegexPattern("FAMILY_HISTORY", r"\bfamily history of\s+([A-Za-z][A-Za-z\s-]{2,40}?)(?=\.|,|;|\sand\s(?:prior|past|previous)|$)", re.IGNORECASE, 1),
]


REGEX_LABEL_TO_GROUP = {
    "EMAIL": "EMAIL",
    "PHONE": "PHONE",
    "SSN": "SSN",
    "URL": "URL",
    "IP_ADDRESS": "IP_ADDRESS",
    "DATE": "DATE",
    "DATE_OF_BIRTH": "DATE",
    "TIME": "TIME",
    "AGE": "AGE",
    "DOCTOR_NAME": "PERSON_PROVIDER",
    "PATIENT_NAME": "PERSON_PATIENT",
    "HOSPITAL": "CARE_SITE_OR_LOCATION",
    "ADDRESS": "ADDRESS",
    "ZIP_CODE": "ADDRESS",
    "CITY_STATE_ZIP": "ADDRESS",
    "MRN": "IDENTIFIER",
    "PATIENT_ID": "IDENTIFIER",
    "NPI": "IDENTIFIER",
    "ICD10_CODE": "CLINICAL_CODE",
    "CPT_CODE": "CLINICAL_CODE",
    "DOSAGE": "DOSAGE_OR_MEASUREMENT",
    "FREQUENCY": "MEDICATION_FREQUENCY",
    "DURATION": "MEDICATION_DURATION",
    "ROUTE": "MEDICATION_ROUTE",
    "MEDICATION_CONTEXT": "CHEMICAL_OR_MEDICATION",
    "BLOOD_PRESSURE": "VITAL_SIGN",
    "HEART_RATE": "VITAL_SIGN",
    "TEMPERATURE": "VITAL_SIGN",
    "OXYGEN_SATURATION": "VITAL_SIGN",
    "LAB_VALUE": "LAB_VALUE",
    "FAMILY_HISTORY": "CLINICAL_CONDITION",
}


SCISPACY_LABEL_TO_GROUP = {
    "ENTITY": "BIOMEDICAL_MENTION",
    "AMINO_ACID": "CHEMICAL_OR_MEDICATION",
    "CHEMICAL": "CHEMICAL_OR_MEDICATION",
    "SIMPLE_CHEMICAL": "CHEMICAL_OR_MEDICATION",
    "CHEBI": "CHEMICAL_OR_MEDICATION",
    "DISEASE": "CLINICAL_CONDITION",
    "CANCER": "CLINICAL_CONDITION",
    "PATHOLOGICAL_FORMATION": "CLINICAL_CONDITION",
    "ANATOMICAL_SYSTEM": "ANATOMY",
    "DEVELOPING_ANATOMICAL_STRUCTURE": "ANATOMY",
    "IMMATERIAL_ANATOMICAL_ENTITY": "ANATOMY",
    "MULTI_TISSUE_STRUCTURE": "ANATOMY",
    "ORGAN": "ANATOMY",
    "ORGANISM_SUBSTANCE": "ANATOMY",
    "TISSUE": "ANATOMY",
    "CELL": "CELL_OR_CELLULAR_COMPONENT",
    "CELLULAR_COMPONENT": "CELL_OR_CELLULAR_COMPONENT",
    "CELL_TYPE": "CELL_OR_CELLULAR_COMPONENT",
    "CELL_LINE": "CELL_OR_CELLULAR_COMPONENT",
    "CL": "CELL_OR_CELLULAR_COMPONENT",
    "DNA": "GENE_OR_PROTEIN",
    "RNA": "GENE_OR_PROTEIN",
    "PROTEIN": "GENE_OR_PROTEIN",
    "GENE_OR_GENE_PRODUCT": "GENE_OR_PROTEIN",
    "GGP": "GENE_OR_PROTEIN",
    "GO": "ONTOLOGY_OR_SEQUENCE_FEATURE",
    "SO": "ONTOLOGY_OR_SEQUENCE_FEATURE",
    "ORGANISM": "ORGANISM_OR_TAXON",
    "ORGANISM_SUBDIVISION": "ORGANISM_OR_TAXON",
    "TAXON": "ORGANISM_OR_TAXON",
}


GLOBAL_MODEL_RANK = {
    "en_ner_bc5cdr_md": 1,
    "en_ner_bionlp13cg_md": 2,
    "en_ner_craft_md": 3,
    "en_ner_jnlpba_md": 4,
    "en_core_sci_sm": 5,
}


MODEL_GROUP_RANKS = {
    "BIOMEDICAL_MENTION": {
        "en_core_sci_sm": 1,
        "en_ner_bc5cdr_md": 2,
        "en_ner_bionlp13cg_md": 3,
        "en_ner_craft_md": 4,
        "en_ner_jnlpba_md": 5,
    },
    "CHEMICAL_OR_MEDICATION": {
        "en_ner_bc5cdr_md": 1,
        "en_ner_bionlp13cg_md": 2,
        "en_ner_craft_md": 3,
        "en_core_sci_sm": 4,
        "en_ner_jnlpba_md": 5,
    },
    "CLINICAL_CONDITION": {
        "en_ner_bionlp13cg_md": 1,
        "en_ner_bc5cdr_md": 2,
        "en_core_sci_sm": 3,
        "en_ner_craft_md": 4,
        "en_ner_jnlpba_md": 5,
    },
    "ANATOMY": {
        "en_ner_bionlp13cg_md": 1,
        "en_core_sci_sm": 2,
        "en_ner_craft_md": 3,
        "en_ner_jnlpba_md": 4,
        "en_ner_bc5cdr_md": 5,
    },
    "CELL_OR_CELLULAR_COMPONENT": {
        "en_ner_jnlpba_md": 1,
        "en_ner_craft_md": 2,
        "en_ner_bionlp13cg_md": 3,
        "en_core_sci_sm": 4,
        "en_ner_bc5cdr_md": 5,
    },
    "GENE_OR_PROTEIN": {
        "en_ner_jnlpba_md": 1,
        "en_ner_bionlp13cg_md": 2,
        "en_ner_craft_md": 3,
        "en_core_sci_sm": 4,
        "en_ner_bc5cdr_md": 5,
    },
    "ONTOLOGY_OR_SEQUENCE_FEATURE": {
        "en_ner_craft_md": 1,
        "en_ner_bionlp13cg_md": 2,
        "en_core_sci_sm": 3,
        "en_ner_jnlpba_md": 4,
        "en_ner_bc5cdr_md": 5,
    },
    "ORGANISM_OR_TAXON": {
        "en_ner_craft_md": 1,
        "en_ner_bionlp13cg_md": 2,
        "en_core_sci_sm": 3,
        "en_ner_jnlpba_md": 4,
        "en_ner_bc5cdr_md": 5,
    },
}


def supports_color() -> bool:
    return sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


USE_COLOR = supports_color()


def color(text: str, code: str) -> str:
    if not USE_COLOR:
        return text
    return f"\033[{code}m{text}\033[0m"


def normalize_for_match(text: str) -> str:
    return re.sub(r"\s+", "", text.lower())


def has_substring_match(left: EntityCandidate, right: EntityCandidate) -> bool:
    left_norm = normalize_for_match(left.text)
    right_norm = normalize_for_match(right.text)
    if not left_norm or not right_norm:
        return False
    return left_norm in right_norm or right_norm in left_norm


def trim_span(text: str, start: int, end: int) -> tuple[str, int, int]:
    raw_span = text[start:end]
    stripped_span = raw_span.strip(" ,.;:\n\t")
    leading_trim = len(raw_span) - len(raw_span.lstrip(" ,.;:\n\t"))
    new_start = start + leading_trim
    new_end = new_start + len(stripped_span)
    return stripped_span, new_start, new_end


def label_key(label: str) -> str:
    return label.upper().replace(" ", "_").replace("-", "_")


def regex_group(label: str) -> str:
    return REGEX_LABEL_TO_GROUP.get(label_key(label), label_key(label))


def scispacy_group(label: str) -> str:
    return SCISPACY_LABEL_TO_GROUP.get(label_key(label), label_key(label))


def load_available_scispacy_models() -> dict[str, spacy.language.Language]:
    loaded = {}
    missing: list[ScispacyModelSpec] = []

    for spec in SCISPACY_MODEL_SPECS:
        try:
            loaded[spec.name] = spacy.load(spec.name)
        except OSError:
            missing.append(spec)

    if missing:
        print("Missing scispaCy models:", file=sys.stderr)
        for spec in missing:
            print(f"  {spec.name}: python -m pip install {spec.install_url}", file=sys.stderr)

    return loaded


def run_scispacy_models(
    text: str,
    models: dict[str, spacy.language.Language],
    next_candidate_id: int,
) -> tuple[list[EntityCandidate], int]:
    candidates: list[EntityCandidate] = []

    for model_name, nlp in models.items():
        doc = nlp(text)
        for ent in doc.ents:
            candidates.append(
                EntityCandidate(
                    candidate_id=next_candidate_id,
                    method="scispacy",
                    source=model_name,
                    label=ent.label_,
                    meaning_group=scispacy_group(ent.label_),
                    text=ent.text,
                    start=ent.start_char,
                    end=ent.end_char,
                )
            )
            next_candidate_id += 1

    return candidates, next_candidate_id


def run_regex_patterns(text: str, next_candidate_id: int) -> tuple[list[EntityCandidate], int]:
    candidates: list[EntityCandidate] = []

    for pattern_spec in REGEX_PATTERNS:
        compiled_pattern = re.compile(pattern_spec.pattern, pattern_spec.flags)
        for match in compiled_pattern.finditer(text):
            start, end = match.span(pattern_spec.group)
            if start < 0 or end < 0:
                continue

            span_text, start, end = trim_span(text, start, end)
            if not span_text:
                continue

            candidates.append(
                EntityCandidate(
                    candidate_id=next_candidate_id,
                    method="regex",
                    source=f"regex:{pattern_spec.entity}",
                    label=pattern_spec.entity,
                    meaning_group=regex_group(pattern_spec.entity),
                    text=span_text,
                    start=start,
                    end=end,
                )
            )
            next_candidate_id += 1

    return candidates, next_candidate_id


class UnionFind:
    def __init__(self, size: int) -> None:
        self.parent = list(range(size))

    def find(self, item: int) -> int:
        while self.parent[item] != item:
            self.parent[item] = self.parent[self.parent[item]]
            item = self.parent[item]
        return item

    def union(self, left: int, right: int) -> None:
        root_left = self.find(left)
        root_right = self.find(right)
        if root_left != root_right:
            self.parent[root_right] = root_left


def longest_candidate(candidates: list[EntityCandidate]) -> EntityCandidate:
    return max(candidates, key=lambda item: (len(normalize_for_match(item.text)), -item.start))


def model_rank(candidate: EntityCandidate) -> int:
    group_ranks = MODEL_GROUP_RANKS.get(candidate.meaning_group, {})
    return group_ranks.get(candidate.source, GLOBAL_MODEL_RANK.get(candidate.source, 999))


def highest_ranked_model(candidates: list[EntityCandidate]) -> EntityCandidate:
    return min(
        candidates,
        key=lambda item: (
            model_rank(item),
            -len(normalize_for_match(item.text)),
            item.start,
        ),
    )


def suppress_models_overlapping_regex(
    candidates: list[EntityCandidate],
) -> tuple[list[EntityCandidate], set[int]]:
    regex_candidates = [item for item in candidates if item.method == "regex"]
    regex_priority_ids: set[int] = set()
    filtered_candidates: list[EntityCandidate] = []

    for candidate in candidates:
        if candidate.method != "scispacy":
            filtered_candidates.append(candidate)
            continue

        overlapping_regex = [regex for regex in regex_candidates if has_substring_match(candidate, regex)]
        if overlapping_regex:
            regex_priority_ids.update(regex.candidate_id for regex in overlapping_regex)
            continue

        filtered_candidates.append(candidate)

    return filtered_candidates, regex_priority_ids


def select_cluster(cluster: list[EntityCandidate], regex_priority_ids: set[int]) -> SelectedEntity:
    regex_candidates = [item for item in cluster if item.method == "regex"]
    model_candidates = [item for item in cluster if item.method == "scispacy"]

    if regex_candidates and model_candidates:
        best_regex = longest_candidate(regex_candidates)
        reason = (
            "regex priority over overlapping model entity"
            if best_regex.candidate_id in regex_priority_ids
            else "regex match"
        )
        return SelectedEntity(best_regex, reason)

    if regex_candidates:
        best_regex = longest_candidate(regex_candidates)
        reason = (
            "regex priority over overlapping model entity"
            if best_regex.candidate_id in regex_priority_ids
            else "regex match"
        )
        return SelectedEntity(best_regex, reason)

    best_model = highest_ranked_model(model_candidates)
    return SelectedEntity(best_model, f"highest ranked model for {best_model.meaning_group}")


def resolve_overlaps(candidates: list[EntityCandidate]) -> list[SelectedEntity]:
    selected: list[SelectedEntity] = []
    candidates, regex_priority_ids = suppress_models_overlapping_regex(candidates)

    for group in sorted({candidate.meaning_group for candidate in candidates}):
        group_items = [candidate for candidate in candidates if candidate.meaning_group == group]
        if len(group_items) == 1:
            candidate = group_items[0]
            if candidate.method == "regex" and candidate.candidate_id in regex_priority_ids:
                reason = "regex priority over overlapping model entity"
            else:
                reason = "regex match" if candidate.method == "regex" else "model-only span"
            selected.append(SelectedEntity(candidate, reason))
            continue

        union_find = UnionFind(len(group_items))
        for left_idx, left_item in enumerate(group_items):
            for right_idx in range(left_idx + 1, len(group_items)):
                right_item = group_items[right_idx]
                if has_substring_match(left_item, right_item):
                    union_find.union(left_idx, right_idx)

        clusters: dict[int, list[EntityCandidate]] = {}
        for idx, item in enumerate(group_items):
            clusters.setdefault(union_find.find(idx), []).append(item)

        for cluster_items in clusters.values():
            selected.append(select_cluster(cluster_items, regex_priority_ids))

    return sorted(selected, key=lambda item: (item.candidate.start, item.candidate.end, item.candidate.meaning_group))


def terminal_width() -> int:
    return max(90, min(shutil.get_terminal_size((120, 20)).columns, 160))


def truncate(text: object, width: int) -> str:
    value = "" if text is None else str(text)
    value = value.replace("\n", " ")
    if len(value) <= width:
        return value
    if width <= 3:
        return value[:width]
    return value[: width - 3] + "..."


def print_rule(title: str) -> None:
    width = terminal_width()
    clean_title = f" {title} "
    side = max(1, (width - len(clean_title)) // 2)
    print("=" * side + color(clean_title, "1") + "=" * (width - side - len(clean_title)))


def print_table(headers: list[str], rows: list[list[object]], max_widths: dict[str, int]) -> None:
    if not rows:
        print(color("  No entities found.", "33"))
        return

    widths = []
    for col_idx, header in enumerate(headers):
        max_content_width = max([len(header)] + [len(str(row[col_idx])) for row in rows])
        widths.append(min(max_content_width, max_widths.get(header, 28)))

    def row_line(values: Iterable[object]) -> str:
        return " | ".join(
            truncate(value, widths[idx]).ljust(widths[idx]) for idx, value in enumerate(values)
        )

    print(row_line(headers))
    print("-+-".join("-" * width for width in widths))
    for row in rows:
        print(row_line(row))


def print_selected_entities(selected: list[SelectedEntity]) -> None:
    rows = []
    for idx, selected_entity in enumerate(selected, start=1):
        item = selected_entity.candidate
        rows.append(
            [
                idx,
                item.meaning_group,
                item.text,
                item.method,
                item.source,
                item.label,
                item.start,
                item.end,
                model_rank(item) if item.method == "scispacy" else "REGEX",
                selected_entity.reason,
            ]
        )

    print_table(
        ["#", "Meaning group", "Text", "Method", "Source", "Label", "Start", "End", "Rank", "Reason"],
        rows,
        {
            "#": 4,
            "Meaning group": 28,
            "Text": 42,
            "Method": 10,
            "Source": 22,
            "Label": 24,
            "Start": 7,
            "End": 7,
            "Rank": 8,
            "Reason": 44,
        },
    )


def read_input_text(args: argparse.Namespace) -> str:
    if args.text:
        return args.text.strip()

    if args.stdin or not sys.stdin.isatty():
        return sys.stdin.read().strip()

    print(color("Enter clinical text, then press Enter:", "1"))
    return input("> ").strip()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run scispaCy models plus regex and resolve overlapping similar entities."
    )
    parser.add_argument(
        "--text",
        help="Input text to analyze. If omitted, the script prompts in the terminal.",
    )
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="Read input text from standard input.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_text = read_input_text(args)
    if not input_text:
        print(color("No input text provided.", "31"), file=sys.stderr)
        return 2

    next_candidate_id = 1
    models = load_available_scispacy_models()
    scispacy_candidates, next_candidate_id = run_scispacy_models(input_text, models, next_candidate_id)
    regex_candidates, _ = run_regex_patterns(input_text, next_candidate_id)

    selected = resolve_overlaps(scispacy_candidates + regex_candidates)
    print_rule("Final Selected Entities")
    print_selected_entities(selected)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
