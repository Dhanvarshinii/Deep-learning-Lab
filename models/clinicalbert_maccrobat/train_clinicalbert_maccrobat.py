from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

import numpy as np
from datasets import Dataset, DatasetDict, load_dataset
from seqeval.metrics import accuracy_score, f1_score, precision_score, recall_score
from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    DataCollatorForTokenClassification,
    EvalPrediction,
    Trainer,
    TrainingArguments,
    set_seed,
)


DEFAULT_MODEL = "emilyalsentzer/Bio_ClinicalBERT"
DEFAULT_DATASET = "ktgiahieu/maccrobat2018_2020"
IGNORE_LABEL_ID = -100


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fine-tune Bio_ClinicalBERT for NER on an 80/20 MACCROBAT split."
    )
    parser.add_argument("--model-name", default=DEFAULT_MODEL)
    parser.add_argument("--dataset-name", default=DEFAULT_DATASET)
    parser.add_argument("--output-dir", default="outputs/clinicalbert-maccrobat")
    parser.add_argument("--epochs", type=float, default=5.0)
    parser.add_argument("--learning-rate", type=float, default=2e-5)
    parser.add_argument("--train-batch-size", type=int, default=8)
    parser.add_argument("--eval-batch-size", type=int, default=8)
    parser.add_argument("--gradient-accumulation-steps", type=int, default=1)
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--warmup-ratio", type=float, default=0.1)
    parser.add_argument("--max-length", type=int, default=512)
    parser.add_argument("--stride", type=int, default=64)
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--max-train-samples", type=int)
    parser.add_argument("--max-test-samples", type=int)
    parser.add_argument(
        "--max-steps",
        type=int,
        default=-1,
        help="Stop after this many optimizer steps. Useful for a smoke test.",
    )
    parser.add_argument("--fp16", action="store_true")
    parser.add_argument("--gradient-checkpointing", action="store_true")
    parser.add_argument("--resume-from-checkpoint")
    parser.add_argument("--push-to-hub", action="store_true")
    parser.add_argument("--hub-model-id")
    return parser.parse_args()


def validate_args(args: argparse.Namespace) -> None:
    if args.max_length < 8:
        raise ValueError("--max-length must be at least 8.")
    if args.stride < 0 or args.stride >= args.max_length:
        raise ValueError("--stride must be non-negative and smaller than --max-length.")
    if not 0 < args.test_size < 1:
        raise ValueError("--test-size must be between 0 and 1.")
    if args.gradient_accumulation_steps <= 0:
        raise ValueError("--gradient-accumulation-steps must be positive.")


def validate_dataset(dataset: Dataset) -> None:
    required_columns = {"tokens", "tags"}
    missing = required_columns.difference(dataset.column_names)
    if missing:
        raise ValueError(f"Dataset is missing required columns: {sorted(missing)}")

    for row_index, row in enumerate(dataset):
        if len(row["tokens"]) != len(row["tags"]):
            raise ValueError(
                f"Row {row_index} has {len(row['tokens'])} tokens but "
                f"{len(row['tags'])} tags."
            )


def make_splits(dataset: Dataset, test_size: float, seed: int) -> DatasetDict:
    split = dataset.train_test_split(test_size=test_size, seed=seed, shuffle=True)
    return DatasetDict(train=split["train"], test=split["test"])


def limit_split(dataset: Dataset, maximum: int | None) -> Dataset:
    if maximum is None:
        return dataset
    if maximum <= 0:
        raise ValueError("Sample limits must be positive.")
    return dataset.select(range(min(maximum, len(dataset))))


def collect_labels(dataset: Dataset) -> list[str]:
    labels = sorted({tag for tags in dataset["tags"] for tag in tags})
    if "O" not in labels:
        raise ValueError("The dataset does not contain the required outside label 'O'.")
    return ["O", *(label for label in labels if label != "O")]


def tokenize_and_align(
    examples: dict[str, list[Any]],
    tokenizer,
    label_to_id: dict[str, int],
    max_length: int,
    stride: int,
) -> dict[str, list[Any]]:
    tokenized = tokenizer(
        examples["tokens"],
        is_split_into_words=True,
        truncation=True,
        max_length=max_length,
        stride=stride,
        return_overflowing_tokens=True,
    )
    sample_mapping = tokenized.pop("overflow_to_sample_mapping")
    aligned_labels: list[list[int]] = []

    for chunk_index, sample_index in enumerate(sample_mapping):
        word_ids = tokenized.word_ids(batch_index=chunk_index)
        source_tags = examples["tags"][sample_index]
        previous_word_id = None
        chunk_labels: list[int] = []

        for word_id in word_ids:
            if word_id is None or word_id == previous_word_id:
                chunk_labels.append(IGNORE_LABEL_ID)
            else:
                chunk_labels.append(label_to_id[source_tags[word_id]])
            previous_word_id = word_id

        aligned_labels.append(chunk_labels)

    tokenized["labels"] = aligned_labels
    return tokenized


def build_compute_metrics(id_to_label: dict[int, str]):
    def compute_metrics(prediction: EvalPrediction) -> dict[str, float]:
        logits = prediction.predictions
        if isinstance(logits, tuple):
            logits = logits[0]
        predicted_ids = np.argmax(logits, axis=-1)

        true_predictions: list[list[str]] = []
        true_labels: list[list[str]] = []
        for predicted_row, label_row in zip(predicted_ids, prediction.label_ids):
            kept_predictions: list[str] = []
            kept_labels: list[str] = []
            for predicted_id, label_id in zip(predicted_row, label_row):
                if label_id == IGNORE_LABEL_ID:
                    continue
                kept_predictions.append(id_to_label[int(predicted_id)])
                kept_labels.append(id_to_label[int(label_id)])
            true_predictions.append(kept_predictions)
            true_labels.append(kept_labels)

        return {
            "precision": precision_score(true_labels, true_predictions, zero_division=0),
            "recall": recall_score(true_labels, true_predictions, zero_division=0),
            "f1": f1_score(true_labels, true_predictions, zero_division=0),
            "accuracy": accuracy_score(true_labels, true_predictions),
        }

    return compute_metrics


def main() -> int:
    args = parse_args()
    validate_args(args)
    set_seed(args.seed)

    raw_dataset = load_dataset(args.dataset_name, split="train")
    validate_dataset(raw_dataset)
    splits = make_splits(raw_dataset, args.test_size, args.seed)
    splits["train"] = limit_split(splits["train"], args.max_train_samples)
    splits["test"] = limit_split(splits["test"], args.max_test_samples)

    label_names = collect_labels(raw_dataset)
    label_to_id = {label: index for index, label in enumerate(label_names)}
    id_to_label = {index: label for label, index in label_to_id.items()}

    tokenizer = AutoTokenizer.from_pretrained(args.model_name, use_fast=True)
    if not tokenizer.is_fast:
        raise ValueError("A fast tokenizer is required for word-to-subword alignment.")

    tokenized_splits = splits.map(
        tokenize_and_align,
        batched=True,
        remove_columns=splits["train"].column_names,
        fn_kwargs={
            "tokenizer": tokenizer,
            "label_to_id": label_to_id,
            "max_length": args.max_length,
            "stride": args.stride,
        },
        desc="Tokenizing and aligning BIO labels",
    )

    steps_per_epoch = math.ceil(
        len(tokenized_splits["train"])
        / (args.train_batch_size * args.gradient_accumulation_steps)
    )
    total_steps = (
        args.max_steps if args.max_steps > 0 else math.ceil(steps_per_epoch * args.epochs)
    )
    warmup_steps = round(total_steps * args.warmup_ratio)

    model = AutoModelForTokenClassification.from_pretrained(
        args.model_name,
        num_labels=len(label_names),
        id2label=id_to_label,
        label2id=label_to_id,
    )
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "labels.json").write_text(
        json.dumps(label_to_id, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (output_dir / "split_summary.json").write_text(
        json.dumps(
            {
                "dataset": args.dataset_name,
                "seed": args.seed,
                "test_fraction": args.test_size,
                "train_documents": len(splits["train"]),
                "test_documents": len(splits["test"]),
            },
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        num_train_epochs=args.epochs,
        max_steps=args.max_steps,
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.train_batch_size,
        per_device_eval_batch_size=args.eval_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        weight_decay=args.weight_decay,
        warmup_steps=warmup_steps,
        eval_strategy="no",
        save_strategy="epoch",
        logging_strategy="steps",
        logging_steps=10,
        save_total_limit=2,
        fp16=args.fp16,
        gradient_checkpointing=args.gradient_checkpointing,
        report_to="none",
        seed=args.seed,
        data_seed=args.seed,
        push_to_hub=args.push_to_hub,
        hub_model_id=args.hub_model_id,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_splits["train"],
        processing_class=tokenizer,
        data_collator=DataCollatorForTokenClassification(tokenizer),
        compute_metrics=build_compute_metrics(id_to_label),
    )

    train_result = trainer.train(resume_from_checkpoint=args.resume_from_checkpoint)
    trainer.save_model()
    tokenizer.save_pretrained(output_dir)
    trainer.save_metrics("train", train_result.metrics)

    test_metrics = trainer.evaluate(tokenized_splits["test"], metric_key_prefix="test")
    trainer.save_metrics("test", test_metrics)
    trainer.save_state()
    print(json.dumps(test_metrics, indent=2, sort_keys=True))

    if args.push_to_hub:
        trainer.push_to_hub()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
