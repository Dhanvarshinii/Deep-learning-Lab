import json
import subprocess


SCRIPT_PATH = (
    "../../models/biobert_maccrobat/"
    "biobert_maccrobat_ner.py"
)


def predict(text: str):
    """Run BioBERT inference and return extracted entities."""

    result = subprocess.run(
        [
            "python",
            SCRIPT_PATH,
            "--text",
            text,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(result.stderr)
        return []

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        print(result.stdout)
        return []