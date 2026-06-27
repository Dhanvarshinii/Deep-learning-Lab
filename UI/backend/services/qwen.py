import json
import subprocess

# Path to the local Qwen2.5 Ollama inference script.
SCRIPT_PATH = (
    "../../models/llm/"
    "qwen25_clinical_ner_ollama.py"
)


def predict(text: str):
    """
    Runs the local Qwen2.5 clinical NER model through Ollama.

    The model returns entities in JSON format. This function executes
    the standalone inference script, extracts the JSON response, and
    converts the entities into the common format expected by the frontend.

    Args:
        text: Clinical text to annotate.

    Returns:
        A list of extracted entities.
    """

    # Normalize line endings to avoid issues with offset calculations
    # and entity extraction.
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", " ")

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

    output = result.stdout.strip()

    # Ignore any status messages printed before the JSON output.
    json_start = output.find("[")

    if json_start == -1:
        return []

    output = output[json_start:]

    try:
        parsed = json.loads(output)
    except json.JSONDecodeError:
        print(output)
        return []
    
    # Support both JSON array and {"entities": [...]} response formats.
    if isinstance(parsed, dict):
        raw_entities = parsed.get("entities", [])
    else:
        raw_entities = parsed

    entities = []

    # Convert the model output into the application's standard entity format.
    for entity in raw_entities:
        entities.append(
            {
                "meaning_group": entity["label"],
                "selected_text": entity["text"],
                "model": "Qwen 2.5",
                "original_label": entity["label"],
                "start": entity["start"],
                "end": entity["end"],
            }
        )

    return entities