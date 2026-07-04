from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import torch
from transformers import AutoModelForTokenClassification, AutoTokenizer, pipeline


MODEL_DIR = Path(__file__).resolve().parent / "clinicalbert-maccrobat"
MODEL_NAME = "clinicalbert_maccrobat"
DEFAULT_STRIDE = 64


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the locally fine-tuned ClinicalBERT MACCROBAT NER model."
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
    parser.add_argument(
        "--device",
        choices=["auto", "cpu", "cuda"],
        default="auto",
        help="Model device. Default: auto.",
    )
    return parser.parse_args()


def read_input_text(args: argparse.Namespace) -> str:
    if args.text:
        return args.text.strip()

    if args.stdin or not sys.stdin.isatty():
        return sys.stdin.read().strip()

    print("Enter clinical text, then press Enter:")
    return input("> ").strip()


def resolve_device(device_arg: str) -> int:
    if device_arg == "cpu":
        return -1
    if device_arg == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA was requested, but torch.cuda.is_available() is false.")
        return 0
    return 0 if torch.cuda.is_available() else -1


def load_ner_pipeline(model_dir: Path, device: int):
    if not model_dir.is_dir():
        raise FileNotFoundError(f"ClinicalBERT model directory not found: {model_dir}")

    tokenizer = AutoTokenizer.from_pretrained(
        model_dir,
        local_files_only=True,
        use_fast=True,
    )
    model = AutoModelForTokenClassification.from_pretrained(
        model_dir,
        local_files_only=True,
    )
    tokenizer.model_max_length = model.config.max_position_embeddings

    return pipeline(
        task="token-classification",
        model=model,
        tokenizer=tokenizer,
        aggregation_strategy="first",
        device=device,
    )


def extract_entities(input_text: str, model_pipeline) -> list[dict]:
    predictions = model_pipeline(input_text, stride=DEFAULT_STRIDE)
    entities = []

    for prediction in predictions:
        start = int(prediction["start"])
        end = int(prediction["end"])
        label = str(
            prediction.get("entity_group")
            or prediction.get("entity")
            or ""
        ).removeprefix("B-").removeprefix("I-")

        if not label or label == "O" or not 0 <= start < end <= len(input_text):
            continue

        entities.append(
            {
                "meaning_group": label,
                "selected_text": input_text[start:end],
                "model": MODEL_NAME,
                "original_label": label,
                "start": start,
                "end": end,
                "score": float(prediction.get("score", 0.0)),
            }
        )

    return entities


def main() -> int:
    args = parse_args()
    input_text = read_input_text(args)

    if not input_text:
        print("No input text provided.", file=sys.stderr)
        return 2

    try:
        device = resolve_device(args.device)
        model_pipeline = load_ner_pipeline(MODEL_DIR, device)
        entities = extract_entities(input_text, model_pipeline)
    except Exception as exc:
        print(f"ClinicalBERT inference failed: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(entities, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
