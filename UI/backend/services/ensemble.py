import subprocess

from services.parser import parse_entities

# Path to the pretrained ensemble model script.
SCRIPT_PATH = (
    "../../models/pre_fine_tuned_models/"
    "ensemble_pretrained_ner.py"
)


def predict(text: str):
    """
    Runs the pretrained ensemble clinical NER model.

    The model is executed as a separate Python process, and its
    terminal output is parsed into the standard entity format
    expected by the frontend.

    Args:
        text: Clinical text to annotate.

    Returns:
        A list of extracted entities.
    """

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

    return parse_entities(result.stdout)