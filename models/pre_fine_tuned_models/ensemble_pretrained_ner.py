from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
from dataclasses import dataclass
from typing import Iterable

import torch
from transformers import AutoModelForTokenClassification, AutoTokenizer, logging as hf_logging, pipeline


hf_logging.set_verbosity_error()


@dataclass(frozen=True)
class ModelSpec:
    alias: str
    model_id: str


@dataclass(frozen=True)
class EntityCandidate:
    candidate_id: int
    model_alias: str
    model_id: str
    label: str
    meaning_group: str
    text: str
    pipeline_text: str
    start: int
    end: int
    score: float


MODEL_SPECS = [
    ModelSpec(
        alias="biomedical_all",
        model_id="d4data/biomedical-ner-all",
    ),
    ModelSpec(
        alias="medication_ner",
        model_id="pabRomero/BioClinicalBERT-full-finetuned-ner-pablo",
    ),
    ModelSpec(
        alias="phi_deidentifier",
        model_id="StanfordAIMI/stanford-deidentifier-base",
    ),
]


# Labels that mean the same practical thing across the three notebooks.
LABEL_TO_MEANING_GROUP = {
    # Dates and times.
    "DATE": "DATE",
    "TIME": "TIME",
    # Places / care sites.
    "NONBIOLOGICAL_LOCATION": "LOCATION_OR_CARE_SITE",
    "HOSPITAL": "LOCATION_OR_CARE_SITE",
    "VENDOR": "ORGANIZATION",
    # Medication.
    "MEDICATION": "MEDICATION",
    "DRUG": "MEDICATION",
    "DOSAGE": "MEDICATION_AMOUNT",
    "STRENGTH": "MEDICATION_AMOUNT",
    "FORM": "MEDICATION_FORM",
    "ROUTE": "MEDICATION_ROUTE",
    "FREQUENCY": "MEDICATION_FREQUENCY",
    "DURATION": "MEDICATION_DURATION",
    "ADMINISTRATION": "MEDICATION_ADMINISTRATION",
    "ADE": "ADVERSE_DRUG_EVENT",
    # Medication reason / clinical condition. These are related but keep
    # the original label visible because model granularity differs.
    "REASON": "CLINICAL_REASON_OR_CONDITION",
    "SIGN_SYMPTOM": "CLINICAL_REASON_OR_CONDITION",
    "DISEASE_DISORDER": "CLINICAL_REASON_OR_CONDITION",
    "SEVERITY": "CLINICAL_REASON_OR_CONDITION",
    # Other clinical concepts.
    "BIOLOGICAL_STRUCTURE": "ANATOMY",
    "DIAGNOSTIC_PROCEDURE": "PROCEDURE",
    "THERAPEUTIC_PROCEDURE": "PROCEDURE",
    "LAB_VALUE": "LAB_VALUE",
    "AGE": "AGE",
    "SEX": "SEX_OR_GENDER_CUE",
    # PHI.
    "HCW": "PERSON_PROVIDER",
    "PATIENT": "PERSON_PATIENT",
    "ID": "IDENTIFIER",
    "PHONE": "PHONE",
}


def supports_color() -> bool:
    return sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


USE_COLOR = supports_color()


def color(text: str, code: str) -> str:
    if not USE_COLOR:
        return text
    return f"\033[{code}m{text}\033[0m"


def strip_bio_prefix(label: str) -> str:
    label = label.strip()
    if label.startswith(("B-", "I-")):
        return label[2:]
    return label


def label_key(label: str) -> str:
    return strip_bio_prefix(label).upper().replace(" ", "_").replace("-", "_")


def meaning_group_for(label: str) -> str:
    key = label_key(label)
    return LABEL_TO_MEANING_GROUP.get(key, key)


def normalize_for_match(text: str) -> str:
    return re.sub(r"\s+", "", text.lower())


def has_substring_match(left: EntityCandidate, right: EntityCandidate) -> bool:
    left_norm = normalize_for_match(left.text)
    right_norm = normalize_for_match(right.text)
    if not left_norm or not right_norm:
        return False
    return left_norm in right_norm or right_norm in left_norm


def trim_span(source_text: str, start: int, end: int) -> tuple[str, int, int]:
    span = source_text[start:end]
    trimmed = span.strip(" \t\r\n,;:")

    # Drop leading/trailing sentence punctuation from model spans, but keep
    # punctuation that belongs inside dates, names, and IDs.
    while trimmed.startswith("."):
        trimmed = trimmed[1:].lstrip()
    while trimmed.endswith(".") and len(trimmed) > 1:
        trimmed = trimmed[:-1].rstrip()

    leading_offset = len(span) - len(span.lstrip(" \t\r\n,;:"))
    if source_text[start + leading_offset : start + leading_offset + 1] == ".":
        leading_offset += 1
        while start + leading_offset < end and source_text[start + leading_offset].isspace():
            leading_offset += 1

    new_start = start + leading_offset
    new_end = new_start + len(trimmed)
    return trimmed, new_start, new_end


def exact_text_from_prediction(input_text: str, prediction: dict) -> tuple[str, int, int]:
    start = int(prediction.get("start", -1))
    end = int(prediction.get("end", -1))
    pipeline_text = str(prediction.get("word", ""))

    if 0 <= start < end <= len(input_text):
        span_text, start, end = trim_span(input_text, start, end)
        if span_text:
            return span_text, start, end

    return pipeline_text.strip(), start, end


def choose_winner(candidates: list[EntityCandidate]) -> EntityCandidate:
    return max(
        candidates,
        key=lambda item: (
            item.score,
            len(normalize_for_match(item.text)),
            -item.start if item.start >= 0 else -10**9,
        ),
    )


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


def resolve_overlaps(
    candidates: list[EntityCandidate],
) -> list[EntityCandidate]:
    selected: list[EntityCandidate] = []

    for group in sorted({candidate.meaning_group for candidate in candidates}):
        group_items = [candidate for candidate in candidates if candidate.meaning_group == group]
        if len(group_items) == 1:
            selected.extend(group_items)
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
            selected.append(choose_winner(cluster_items))

    selected = resolve_cross_group_text_matches(selected)
    return sorted(selected, key=lambda item: (item.start, item.end, item.meaning_group))


def resolve_cross_group_text_matches(candidates: list[EntityCandidate]) -> list[EntityCandidate]:
    if len(candidates) <= 1:
        return candidates

    union_find = UnionFind(len(candidates))
    for left_idx, left_item in enumerate(candidates):
        for right_idx in range(left_idx + 1, len(candidates)):
            right_item = candidates[right_idx]
            if has_substring_match(left_item, right_item):
                union_find.union(left_idx, right_idx)

    clusters: dict[int, list[EntityCandidate]] = {}
    for idx, item in enumerate(candidates):
        clusters.setdefault(union_find.find(idx), []).append(item)

    return [choose_winner(cluster_items) for cluster_items in clusters.values()]


def load_pipeline(spec: ModelSpec, device: int):
    tokenizer = AutoTokenizer.from_pretrained(spec.model_id)
    model = AutoModelForTokenClassification.from_pretrained(spec.model_id)
    return pipeline(
        task="token-classification",
        model=model,
        tokenizer=tokenizer,
        aggregation_strategy="simple",
        device=device,
    )


def run_model(
    model_pipeline,
    spec: ModelSpec,
    input_text: str,
    next_candidate_id: int,
) -> tuple[list[EntityCandidate], int]:
    predictions = model_pipeline(input_text)
    candidates: list[EntityCandidate] = []

    for prediction in predictions:
        label = str(prediction.get("entity_group") or prediction.get("entity") or "").strip()
        if not label or label == "O":
            continue

        exact_text, start, end = exact_text_from_prediction(input_text, prediction)
        if not exact_text:
            continue

        candidates.append(
            EntityCandidate(
                candidate_id=next_candidate_id,
                model_alias=spec.alias,
                model_id=spec.model_id,
                label=strip_bio_prefix(label),
                meaning_group=meaning_group_for(label),
                text=exact_text,
                pipeline_text=str(prediction.get("word", exact_text)).strip(),
                start=start,
                end=end,
                score=float(prediction.get("score", 0.0)),
            )
        )
        next_candidate_id += 1

    return candidates, next_candidate_id


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


def print_rule(title: str | None = None) -> None:
    width = terminal_width()
    if title:
        clean_title = f" {title} "
        side = max(1, (width - len(clean_title)) // 2)
        print("=" * side + color(clean_title, "1") + "=" * (width - side - len(clean_title)))
    else:
        print("-" * width)


def print_table(headers: list[str], rows: list[list[object]], max_widths: dict[str, int]) -> None:
    if not rows:
        print(color("  No rows.", "33"))
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


def score_text(score: float) -> str:
    return f"{score:.4f}"


def print_final_entities(selected: list[EntityCandidate]) -> None:
    rows = [
        [
            idx,
            item.meaning_group,
            item.text,
            item.model_alias,
            item.label,
            item.start,
            item.end,
            score_text(item.score),
        ]
        for idx, item in enumerate(selected, start=1)
    ]
    print_table(
        ["#", "Meaning group", "Selected text", "Model", "Original label", "Start", "End", "Score"],
        rows,
        {
            "#": 4,
            "Meaning group": 30,
            "Selected text": 44,
            "Model": 18,
            "Original label": 24,
            "Start": 7,
            "End": 7,
            "Score": 8,
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
        description="Run three fine-tuned clinical NER models and resolve overlapping entities."
    )
    parser.add_argument(
        "--text",
        help="Input text to analyze. If omitted, the script prompts in the terminal.",
    )
    parser.add_argument(
        "--stdin",
        action="store_true",
        help="Read the input text from standard input.",
    )
    parser.add_argument(
        "--device",
        choices=["auto", "cpu", "cuda"],
        default="auto",
        help="Model device. Default: auto.",
    )
    return parser.parse_args()


def resolve_device(device_arg: str) -> int:
    if device_arg == "cpu":
        return -1
    if device_arg == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA was requested, but torch.cuda.is_available() is false.")
        return 0
    return 0 if torch.cuda.is_available() else -1


def main() -> int:
    args = parse_args()
    input_text = read_input_text(args)
    if not input_text:
        print(color("No input text provided.", "31"), file=sys.stderr)
        return 2

    try:
        device = resolve_device(args.device)
    except RuntimeError as exc:
        print(color(str(exc), "31"), file=sys.stderr)
        return 2

    all_candidates: list[EntityCandidate] = []
    next_candidate_id = 1
    for spec in MODEL_SPECS:
        try:
            model_pipeline = load_pipeline(spec, device=device)
            candidates, next_candidate_id = run_model(
                model_pipeline,
                spec,
                input_text,
                next_candidate_id,
            )
        except Exception as exc:  # noqa: BLE001 - keep CLI failure readable.
            print(color(f"Failed while running {spec.alias}: {exc}", "31"), file=sys.stderr)
            return 1

        all_candidates.extend(candidates)

    selected = resolve_overlaps(all_candidates)
    print_rule("Final Selected Entities")
    print_final_entities(selected)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
