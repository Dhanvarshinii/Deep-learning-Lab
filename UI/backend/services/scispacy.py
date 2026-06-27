import subprocess
import re

# Path to the scispaCy + Regex clinical NER script.
SCRIPT_PATH = (
    "../../models/scispacy_and_regex/"
    "scispacy_regex_ner.py"
)


def parse_scispacy(output):
    """
    Parses the terminal output produced by the scispaCy + Regex
    pipeline and converts it into the standard entity format used
    by the frontend.

    Args:
        output: Raw terminal output from the model script.

    Returns:
        A list of extracted entities.
    """
    entities = []

    for line in output.splitlines():

        # Process only table rows containing entity information.
        if not re.match(r"^\s*\d+\s*\|", line):
            continue

        parts = [p.strip() for p in line.split("|")]

        # Skip malformed rows.
        if len(parts) < 9:
            continue

        try:
            entities.append(
                {
                    "meaning_group": parts[1],
                    "selected_text": parts[2],
                    "model": parts[3],
                    "original_label": parts[5],
                    "start": int(parts[6]),
                    "end": int(parts[7]),
                }
            )
        except Exception:
            # Ignore rows that cannot be parsed.
            continue

    return entities


def predict(text: str):
    """
    Runs the scispaCy + Regex clinical NER pipeline.

    The model is executed as a separate Python process. Its
    terminal output is parsed and converted into the common
    entity format expected by the frontend.

    Args:
        text: Clinical text to annotate.

    Returns:
        A list of extracted entities.
    """
    # Normalize line endings to avoid parsing issues with
    # uploaded Windows-formatted text files.
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

    return parse_scispacy(result.stdout)

