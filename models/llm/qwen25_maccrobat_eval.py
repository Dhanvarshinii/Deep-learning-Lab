from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from qwen25_clinical_ner_ollama import (
    ALLOWED_LABELS,
    MODEL_NAME,
    build_prompt,
    call_ollama,
    repair_offsets,
    resolve_overlaps,
)


DEFAULT_DATASET = "ktgiahieu/maccrobat2018_2020"
MACCROBAT_LABELS = ALLOWED_LABELS


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate local Qwen2.5 clinical NER on MACCROBAT labels."
    )
    parser.add_argument("--dataset-name", default=DEFAULT_DATASET)
    parser.add_argument("--local-jsonl", type=Path, help="Optional local MACCROBAT data.jsonl path.")
    parser.add_argument("--split", default="train")
    parser.add_argument(
        "--max-documents",
        type=int,
        default=0,
        help="Number of documents to evaluate. Use 0 to evaluate the complete dataset.",
    )
    parser.add_argument("--model", default=MODEL_NAME)
    parser.add_argument("--timeout", type=int, default=900)
    parser.add_argument("--output-dir", type=Path, default=Path("outputs/qwen25-maccrobat-evaluation"))
    parser.add_argument("--print-labels", action="store_true")
    return parser.parse_args()


def load_maccrobat(args: argparse.Namespace) -> list[dict[str, Any]]:
    if args.local_jsonl:
        rows = []
        with args.local_jsonl.open(encoding="utf-8") as handle:
            for line in handle:
                if line.strip():
                    rows.append(json.loads(line))
        return rows

    try:
        from datasets import load_dataset
    except ImportError as exc:
        raise RuntimeError(
            "The `datasets` package is required unless --local-jsonl is provided. "
            "Install it in your project environment or download data/maccrobat/data.jsonl."
        ) from exc

    dataset = load_dataset(args.dataset_name, split=args.split)
    return [dict(row) for row in dataset]


def token_offsets(tokens: list[str]) -> tuple[str, list[tuple[int, int]]]:
    text_parts = []
    offsets = []
    cursor = 0

    for index, token in enumerate(tokens):
        if index:
            text_parts.append(" ")
            cursor += 1

        start = cursor
        text_parts.append(token)
        cursor += len(token)
        offsets.append((start, cursor))

    return "".join(text_parts), offsets


def split_bio_label(tag: str) -> tuple[str, str] | None:
    if tag == "O":
        return None
    if "-" not in tag:
        return None
    prefix, entity_type = tag.split("-", maxsplit=1)
    if prefix not in {"B", "I"}:
        return None
    return prefix, entity_type


def gold_spans_from_bio(tokens: list[str], tags: list[str]) -> tuple[str, list[dict[str, Any]]]:
    text, offsets = token_offsets(tokens)
    spans = []
    active_type = None
    active_start = None
    active_end = None

    def close_active() -> None:
        nonlocal active_type, active_start, active_end
        if active_type is None or active_start is None or active_end is None:
            return

        spans.append(
            {
                "text": text[active_start:active_end],
                "label": active_type,
                "start": active_start,
                "end": active_end,
            }
        )

        active_type = None
        active_start = None
        active_end = None

    for token_index, tag in enumerate(tags):
        parsed = split_bio_label(tag)
        start, end = offsets[token_index]

        if parsed is None:
            close_active()
            continue

        prefix, entity_type = parsed
        if prefix == "B" or active_type != entity_type:
            close_active()
            active_type = entity_type
            active_start = start

        active_end = end

    close_active()
    return text, spans


def entity_key(entity: dict[str, Any]) -> tuple[int, int, str]:
    return int(entity["start"]), int(entity["end"]), str(entity["label"])


def entity_words(entity: dict[str, Any]) -> tuple[str, ...]:
    text = str(entity.get("text", "")).casefold()
    return tuple(re.findall(r"\w+", text))


def spans_overlap(left: dict[str, Any], right: dict[str, Any]) -> bool:
    return int(left["start"]) < int(right["end"]) and int(right["start"]) < int(left["end"])


def is_word_subset_match(gold_entity: dict[str, Any], predicted_entity: dict[str, Any]) -> bool:
    if str(gold_entity["label"]) != str(predicted_entity["label"]):
        return False
    if not spans_overlap(gold_entity, predicted_entity):
        return False

    gold_words = entity_words(gold_entity)
    predicted_words = entity_words(predicted_entity)
    if not gold_words or not predicted_words:
        return False

    gold_set = set(gold_words)
    predicted_set = set(predicted_words)
    return gold_set <= predicted_set or predicted_set <= gold_set


def score_document(gold: list[dict[str, Any]], predicted: list[dict[str, Any]]) -> dict[str, Any]:
    predicted_keys = {entity_key(entity) for entity in predicted}
    matched_predicted_indexes = set()
    true_positive = 0

    for gold_entity in gold:
        best_predicted_index = None
        best_predicted_length = None

        for predicted_index, predicted_entity in enumerate(predicted):
            if predicted_index in matched_predicted_indexes:
                continue
            if not is_word_subset_match(gold_entity, predicted_entity):
                continue

            predicted_length = len(entity_words(predicted_entity))
            if best_predicted_length is None or predicted_length < best_predicted_length:
                best_predicted_index = predicted_index
                best_predicted_length = predicted_length

        if best_predicted_index is not None:
            matched_predicted_indexes.add(best_predicted_index)
            true_positive += 1

    return {
        "true_positive": true_positive,
        "predicted": len(predicted_keys),
        "gold": len(gold),
    }


def prf(tp: int, predicted: int, gold: int) -> dict[str, float]:
    precision = tp / predicted if predicted else 0.0
    recall = tp / gold if gold else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {"precision": precision, "recall": recall, "f1": f1}


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def build_evaluation_tables(prediction_rows: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    totals = Counter()
    per_label = defaultdict(Counter)
    document_rows = []

    for row in sorted(prediction_rows, key=lambda item: int(item["document_index"])):
        gold_entities = row["gold_entities"]
        predicted_entities = row["predicted_entities"]
        scores = score_document(gold_entities, predicted_entities)
        row.update(scores)
        totals.update(scores)
        document_rows.append({"document_index": row["document_index"], **scores})

        for label in sorted({entity["label"] for entity in gold_entities + predicted_entities}):
            label_gold = [entity for entity in gold_entities if entity["label"] == label]
            label_predicted = [entity for entity in predicted_entities if entity["label"] == label]
            per_label[label].update(score_document(label_gold, label_predicted))

    summary = {
        "documents": len(prediction_rows),
        "labels": ALLOWED_LABELS,
        "matching": "same label + overlapping spans + word-level subset in either direction",
        "metrics": prf(totals["true_positive"], totals["predicted"], totals["gold"]),
        "counts": dict(totals),
    }

    per_label_summary = {
        label: {
            "metrics": prf(counts["true_positive"], counts["predicted"], counts["gold"]),
            "counts": dict(counts),
        }
        for label, counts in sorted(per_label.items())
    }

    return summary, per_label_summary, document_rows


def save_evaluation_outputs(output_dir: Path, prediction_rows: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    prediction_rows = sorted(prediction_rows, key=lambda item: int(item["document_index"]))
    summary, per_label_summary, document_rows = build_evaluation_tables(prediction_rows)

    write_json(output_dir / "summary.json", summary)
    write_json(output_dir / "per_label_summary.json", per_label_summary)
    write_json(output_dir / "predictions.json", prediction_rows)

    with (output_dir / "document_results.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["document_index", "true_positive", "predicted", "gold"],
        )
        writer.writeheader()
        writer.writerows(document_rows)

    return summary, per_label_summary, document_rows


def decode_json_string_fragment(value: str) -> str:
    try:
        return json.loads(f'"{value}"')
    except json.JSONDecodeError:
        return value


def extract_entities_with_regex(text: str) -> list[dict[str, Any]]:
    entity_pattern = re.compile(
        r'"text"\s*:\s*"(?P<text>(?:\\.|[^"\\])*)"\s*,?\s*'
        r'"label"\s*:\s*"(?P<label>(?:\\.|[^"\\])*)"\s*,?\s*'
        r'"start"\s*:\s*(?P<start>\d+)\s*,?\s*'
        r'"end"\s*:\s*(?P<end>\d+)',
        flags=re.DOTALL,
    )

    entities = []
    for match in entity_pattern.finditer(text):
        entities.append(
            {
                "text": decode_json_string_fragment(match.group("text")),
                "label": decode_json_string_fragment(match.group("label")),
                "start": int(match.group("start")),
                "end": int(match.group("end")),
            }
        )
    return entities


def parse_qwen_response_lenient(raw_response: dict[str, Any] | str) -> dict[str, Any]:
    content = raw_response["response"] if isinstance(raw_response, dict) else raw_response
    cleaned = str(content).strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    candidates = [cleaned]
    json_start = cleaned.find("{")
    json_end = cleaned.rfind("}")
    if json_start != -1 and json_end != -1 and json_start < json_end:
        candidates.append(cleaned[json_start : json_end + 1])

    repaired = re.sub(
        r'(?<=[0-9"\]}])\s+(?="(?:entities|text|label|start|end)"\s*:)',
        ", ",
        candidates[-1],
    )
    candidates.append(repaired)

    last_error = None
    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
            break
        except json.JSONDecodeError as exc:
            last_error = exc
    else:
        regex_entities = extract_entities_with_regex(cleaned)
        if regex_entities:
            return {"entities": regex_entities}
        raise ValueError(
            "Model response was not valid JSON, even after a light repair pass. "
            f"First 1000 characters: {cleaned[:1000]}"
        ) from last_error

    if isinstance(parsed, list):
        parsed = {"entities": parsed}
    if not isinstance(parsed, dict) or not isinstance(parsed.get("entities"), list):
        raise ValueError("Model response must be a JSON object with an 'entities' list.")

    return {"entities": parsed["entities"]}


def extract_entities_for_maccrobat(
    input_text: str,
    model: str = MODEL_NAME,
    read_timeout: int = 900,
) -> dict[str, Any]:
    if not input_text.strip():
        raise ValueError("input_text must be a non-empty string.")

    prompt = build_prompt(input_text)
    raw_response = call_ollama(prompt, model=model, read_timeout=read_timeout)
    model_output = parse_qwen_response_lenient(raw_response)
    repaired_entities = repair_offsets(input_text, model_output["entities"])
    clean_entities = resolve_overlaps(repaired_entities)
    return {"text": input_text, "entities": clean_entities}


def main() -> int:
    args = parse_args()

    if args.print_labels:
        print(json.dumps(ALLOWED_LABELS, indent=2))
        return 0

    documents = load_maccrobat(args)
    if args.max_documents < 0:
        raise ValueError("--max-documents must be 0 or positive.")
    if args.max_documents:
        documents = documents[: args.max_documents]

    args.output_dir.mkdir(parents=True, exist_ok=True)
    prediction_rows = load_json(args.output_dir / "predictions.json", [])
    prediction_by_index = {int(row["document_index"]): row for row in prediction_rows}

    for document_index, document in enumerate(documents):
        if document_index in prediction_by_index:
            print(f"Document {document_index}: already completed, skipping")
            continue

        tokens = document["tokens"]
        tags = document["tags"]
        text, gold_entities = gold_spans_from_bio(tokens, tags)
        result = extract_entities_for_maccrobat(text, model=args.model, read_timeout=args.timeout)
        predicted_entities = result["entities"]
        scores = score_document(gold_entities, predicted_entities)

        row = {
            "document_index": document_index,
            "text": text,
            "gold_entities": gold_entities,
            "predicted_entities": predicted_entities,
            **scores,
        }
        prediction_by_index[document_index] = row
        prediction_rows = list(prediction_by_index.values())
        summary, _, _ = save_evaluation_outputs(args.output_dir, prediction_rows)

        metrics = prf(scores["true_positive"], scores["predicted"], scores["gold"])
        print(
            f"Document {document_index}: "
            f"f1={metrics['f1']:.3f}, predicted={scores['predicted']}, gold={scores['gold']}, "
            f"saved={len(prediction_rows)}/{len(documents)}"
        )

    summary, _, _ = save_evaluation_outputs(args.output_dir, list(prediction_by_index.values()))

    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
