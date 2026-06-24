from __future__ import annotations

import argparse
import itertools
import json
import re
import sys
import threading
import time
from dataclasses import dataclass

import requests


MODEL_NAME = "qwen2.5:14b-instruct"
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_CONNECT_TIMEOUT = 10
OLLAMA_READ_TIMEOUT = 900
OLLAMA_NUM_CTX = 4096
OLLAMA_NUM_PREDICT = 1024
OLLAMA_KEEP_ALIVE = "10m"


ALLOWED_LABELS = [
    "PATIENT",
    "DOCTOR",
    "HOSPITAL",
    "ORGANIZATION",
    "LOCATION",
    "ADDRESS",
    "DATE",
    "TIME",
    "AGE",
    "ID",
    "PHONE",
    "EMAIL",
    "URL",
    "PROFESSION",
    "DISEASE",
    "SYMPTOM",
    "DRUG",
    "DOSAGE",
    "FREQUENCY",
    "ROUTE",
    "DURATION",
    "ANATOMY",
    "PROCEDURE",
    "DIAGNOSTIC_PROCEDURE",
    "LAB_TEST",
    "LAB_VALUE",
    "VITAL_SIGN",
    "CLINICAL_FINDING",
    "MEDICAL_DEVICE",
    "ALLERGY",
    "FAMILY_HISTORY",
    "SOCIAL_HISTORY",
    "TREATMENT",
    "OUTCOME",
]


LABEL_DESCRIPTIONS = {
    "PATIENT": "Patient names or direct patient identifiers as people.",
    "DOCTOR": "Clinician, physician, provider, or care-team member names.",
    "HOSPITAL": "Hospital, clinic, ward, or named care facility.",
    "ORGANIZATION": "Non-hospital organization, company, agency, or institution.",
    "LOCATION": "City, region, country, or non-address location.",
    "ADDRESS": "Street address, postal address, ZIP/postal code, or address-like location.",
    "DATE": "Calendar date or date-like expression.",
    "TIME": "Clock time or time-of-day expression.",
    "AGE": "Patient age or age-like expression.",
    "ID": "Medical record number, patient ID, account ID, visit ID, or other identifier.",
    "PHONE": "Telephone or fax number.",
    "EMAIL": "Email address.",
    "URL": "Web URL or URI.",
    "PROFESSION": "Occupation or professional role.",
    "DISEASE": "Disease, disorder, diagnosis, or chronic condition.",
    "SYMPTOM": "Symptom or patient-reported complaint.",
    "DRUG": "Medication, vaccine, supplement, or drug name.",
    "DOSAGE": "Medication amount, strength, or dose quantity.",
    "FREQUENCY": "Medication frequency or schedule.",
    "ROUTE": "Medication route of administration.",
    "DURATION": "Treatment, medication, symptom, or condition duration.",
    "ANATOMY": "Body part, organ, tissue, or anatomical location.",
    "PROCEDURE": "Therapeutic, surgical, or general clinical procedure.",
    "DIAGNOSTIC_PROCEDURE": "Diagnostic test, imaging, exam, or measurement procedure.",
    "LAB_TEST": "Laboratory test name.",
    "LAB_VALUE": "Laboratory result value including units when present.",
    "VITAL_SIGN": "Vital sign measurement such as blood pressure, pulse, temperature, or oxygen saturation.",
    "CLINICAL_FINDING": "Observed clinical finding that is not clearly a symptom, disease, lab, or vital sign.",
    "MEDICAL_DEVICE": "Medical device, implant, catheter, monitor, or instrument.",
    "ALLERGY": "Allergy or adverse sensitivity.",
    "FAMILY_HISTORY": "Family history statement or inherited-risk mention.",
    "SOCIAL_HISTORY": "Social history such as smoking, alcohol, occupation, or living situation.",
    "TREATMENT": "Treatment plan, therapy, intervention, or recommendation.",
    "OUTCOME": "Clinical outcome, response, disposition, or prognosis.",
}


JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "entities": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "label": {"type": "string", "enum": ALLOWED_LABELS},
                    "start": {"type": "integer", "minimum": 0},
                    "end": {"type": "integer", "minimum": 0},
                },
                "required": ["text", "label", "start", "end"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["entities"],
    "additionalProperties": False,
}


PHI_LABELS = {
    "PATIENT",
    "DOCTOR",
    "HOSPITAL",
    "ORGANIZATION",
    "LOCATION",
    "ADDRESS",
    "DATE",
    "TIME",
    "AGE",
    "ID",
    "PHONE",
    "EMAIL",
    "URL",
    "PROFESSION",
}


LABEL_PRIORITY = {
    "PATIENT": 1,
    "DOCTOR": 1,
    "HOSPITAL": 1,
    "EMAIL": 1,
    "PHONE": 1,
    "ID": 1,
    "ADDRESS": 2,
    "LOCATION": 3,
    "DATE": 4,
    "TIME": 4,
    "AGE": 4,
    "URL": 4,
    "PROFESSION": 5,
    "DRUG": 1,
    "DOSAGE": 1,
    "FREQUENCY": 1,
    "ROUTE": 1,
    "DURATION": 1,
    "VITAL_SIGN": 1,
    "LAB_VALUE": 1,
    "LAB_TEST": 2,
    "ALLERGY": 2,
    "DISEASE": 3,
    "SYMPTOM": 3,
    "ANATOMY": 4,
    "DIAGNOSTIC_PROCEDURE": 4,
    "PROCEDURE": 5,
    "TREATMENT": 5,
    "CLINICAL_FINDING": 6,
    "MEDICAL_DEVICE": 6,
    "FAMILY_HISTORY": 7,
    "SOCIAL_HISTORY": 7,
    "OUTCOME": 7,
}


@dataclass
class LoadingScreen:
    message: str = "Running Qwen through Ollama"

    def __post_init__(self) -> None:
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def __enter__(self) -> None:
        if not sys.stderr.isatty():
            print(f"{self.message}...", file=sys.stderr)
            return

        self._thread = threading.Thread(target=self._spin, daemon=True)
        self._thread.start()

    def __exit__(self, exc_type, exc, traceback) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join()
            print("\r" + " " * (len(self.message) + 6) + "\r", end="", file=sys.stderr)

    def _spin(self) -> None:
        for marker in itertools.cycle("|/-\\"):
            if self._stop.is_set():
                return
            print(f"\r{self.message} {marker}", end="", file=sys.stderr, flush=True)
            time.sleep(0.12)


def build_prompt(input_text: str) -> str:
    label_block = "\n".join(
        f"- {label}: {LABEL_DESCRIPTIONS[label]}" for label in ALLOWED_LABELS
    )

    return f"""
You are a clinical named entity recognition system.

Extract all clinical and PHI entities from the input clinical text.

Allowed labels and descriptions:
{label_block}

Return only entities that appear exactly in the input text. Use exact character spans from the original input text.
The start offset is inclusive. The end offset is exclusive.
Each entity text must exactly equal input_text[start:end].
Do not hallucinate entities. If unsure, skip the entity.
Do not infer entities that are not explicitly present in the text.

Return only valid JSON with this shape: {{"entities": [{{"text": string, "label": one allowed label, "start": integer, "end": integer}}]}}.
Do not include markdown, explanations, comments, or extra keys.
Do not wrap the JSON in code fences.

Clinical text:
{input_text}
""".strip()


def call_ollama(
    prompt: str,
    model: str,
    read_timeout: int = OLLAMA_READ_TIMEOUT,
) -> dict:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": True,
        "format": JSON_SCHEMA,
        "keep_alive": OLLAMA_KEEP_ALIVE,
        "options": {
            "temperature": 0.0,
            "num_ctx": OLLAMA_NUM_CTX,
            "num_predict": OLLAMA_NUM_PREDICT,
        },
    }

    response_text = ""
    final_payload = None

    try:
        with requests.post(
            OLLAMA_URL,
            json=payload,
            stream=True,
            timeout=(OLLAMA_CONNECT_TIMEOUT, read_timeout),
        ) as response:
            if response.status_code != 200:
                raise RuntimeError(
                    f"Ollama returned HTTP {response.status_code}: {response.text[:1000]}"
                )

            for line in response.iter_lines(decode_unicode=True):
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise RuntimeError(f"Ollama returned invalid JSON chunk: {line[:1000]}") from exc

                if "error" in chunk:
                    raise RuntimeError(f"Ollama generation failed: {chunk['error']}")

                response_text += chunk.get("response", "")
                final_payload = chunk

                if chunk.get("done"):
                    break
    except requests.ConnectionError as exc:
        raise RuntimeError(
            "Could not connect to Ollama. Start Ollama, or run `ollama serve` in a terminal, then retry."
        ) from exc
    except requests.Timeout as exc:
        raise RuntimeError(
            f"Ollama generation timed out after {read_timeout} seconds without a response chunk."
        ) from exc
    except requests.RequestException as exc:
        raise RuntimeError(f"Ollama request failed: {exc}") from exc

    if final_payload is None:
        raise RuntimeError("Ollama returned no streaming chunks.")

    final_payload["response"] = response_text
    if not response_text.strip():
        raise RuntimeError(f"Ollama returned an empty response: {final_payload}")

    return final_payload


def parse_model_response(raw_response: dict | str) -> dict:
    content = raw_response["response"] if isinstance(raw_response, dict) else raw_response
    cleaned = str(content).strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Model response was not valid JSON: {cleaned[:1000]}") from exc

    if isinstance(parsed, list):
        parsed = {"entities": parsed}

    if not isinstance(parsed, dict) or "entities" not in parsed:
        raise ValueError("Model response must contain an 'entities' list.")

    if not isinstance(parsed["entities"], list):
        raise ValueError("Model response field 'entities' must be a list.")

    return {"entities": parsed["entities"]}


def find_all_occurrences(source: str, needle: str) -> list[int]:
    starts = []
    search_from = 0
    while needle:
        idx = source.find(needle, search_from)
        if idx == -1:
            break
        starts.append(idx)
        search_from = idx + 1
    return starts


def repair_offsets(input_text: str, entities: list[dict]) -> list[dict]:
    repaired = []
    seen = set()

    for entity in entities:
        label = str(entity.get("label", "")).strip().upper()
        if label not in ALLOWED_LABELS:
            continue

        text = str(entity.get("text", "")).strip()
        if not text:
            continue

        try:
            original_start = int(entity.get("start", -1))
            original_end = int(entity.get("end", -1))
        except (TypeError, ValueError):
            original_start = -1
            original_end = -1

        start = original_start
        end = original_end

        if not (0 <= start <= end <= len(input_text) and input_text[start:end] == text):
            matches = find_all_occurrences(input_text, text)
            if not matches:
                continue
            start = min(matches, key=lambda idx: abs(idx - original_start))
            end = start + len(text)

        clean_entity = {"text": text, "label": label, "start": start, "end": end}
        key = (text, label, start, end)
        if key not in seen:
            seen.add(key)
            repaired.append(clean_entity)

    return sorted(repaired, key=lambda item: (item["start"], item["end"]))


def spans_overlap(left: dict, right: dict) -> bool:
    return left["start"] < right["end"] and right["start"] < left["end"]


def entity_length(entity: dict) -> int:
    return entity["end"] - entity["start"]


def entity_priority(entity: dict) -> int:
    return LABEL_PRIORITY.get(entity.get("label"), 999)


def choose_same_span(entities: list[dict]) -> dict:
    return sorted(
        entities,
        key=lambda item: (
            entity_priority(item),
            item["label"] not in PHI_LABELS,
            item["label"],
        ),
    )[0]


def choose_overlap_winner(entities: list[dict]) -> dict:
    return sorted(
        entities,
        key=lambda item: (
            -entity_length(item),
            entity_priority(item),
            item["start"],
            item["end"],
        ),
    )[0]


def resolve_overlaps(entities: list[dict]) -> list[dict]:
    by_span = {}
    for entity in entities:
        by_span.setdefault((entity["start"], entity["end"]), []).append(entity)

    sorted_entities = sorted(
        [choose_same_span(items) for items in by_span.values()],
        key=lambda item: (item["start"], -entity_length(item), entity_priority(item)),
    )

    selected = []
    for entity in sorted_entities:
        overlapping = [item for item in selected if spans_overlap(item, entity)]
        if not overlapping:
            selected.append(entity)
            continue

        winner = choose_overlap_winner(overlapping + [entity])
        selected = [item for item in selected if item not in overlapping]
        if winner not in selected:
            selected.append(winner)

    return sorted(
        [
            {
                "text": item["text"],
                "label": item["label"],
                "start": int(item["start"]),
                "end": int(item["end"]),
            }
            for item in selected
        ],
        key=lambda item: (item["start"], item["end"]),
    )


def extract_entities(
    input_text: str,
    model: str = MODEL_NAME,
    read_timeout: int = OLLAMA_READ_TIMEOUT,
) -> dict:
    if not input_text.strip():
        raise ValueError("input_text must be a non-empty string.")

    prompt = build_prompt(input_text)
    raw_response = call_ollama(prompt, model=model, read_timeout=read_timeout)
    model_output = parse_model_response(raw_response)
    repaired_entities = repair_offsets(input_text, model_output["entities"])
    clean_entities = resolve_overlaps(repaired_entities)
    return {"text": input_text, "entities": clean_entities}


def read_input_text(args: argparse.Namespace) -> str:
    if args.text:
        return args.text.strip()

    if args.stdin or not sys.stdin.isatty():
        return sys.stdin.read().strip()

    print("Enter clinical text, then press Enter:")
    return input("> ").strip()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run Qwen2.5 clinical NER through local Ollama.")
    parser.add_argument("--text", help="Input text to analyze. If omitted, the script prompts in the terminal.")
    parser.add_argument("--stdin", action="store_true", help="Read input text from standard input.")
    parser.add_argument("--model", default=MODEL_NAME, help=f"Ollama model name. Default: {MODEL_NAME}.")
    parser.add_argument("--timeout", type=int, default=OLLAMA_READ_TIMEOUT, help="Ollama read timeout in seconds.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_text = read_input_text(args)
    if not input_text:
        print("No input text provided.", file=sys.stderr)
        return 2

    try:
        with LoadingScreen():
            result = extract_entities(input_text, model=args.model, read_timeout=args.timeout)
    except Exception as exc:  # noqa: BLE001 - keep CLI errors readable.
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(result["entities"], indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
