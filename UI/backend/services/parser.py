import re


def parse_entities(output: str):
    """
    Parses the terminal output produced by the pretrained
    ensemble NER model into the standard entity format
    used by the frontend.

    Args:
        output: Raw terminal output from the model script.

    Returns:
        A list of extracted entities.
    """
    entities = []

    lines = output.splitlines()

    for line in lines:

        # Process only rows containing entity information.
        if not re.match(r"^\d+\s+\|", line):
            continue

        parts = [p.strip() for p in line.split("|")]

        if len(parts) < 8:
            continue

        try:
            entities.append(
                {
                    "meaning_group": parts[1],
                    "selected_text": parts[2],
                    "model": parts[3],
                    "original_label": parts[4],
                    "start": int(parts[5]),
                    "end": int(parts[6]),
                    "score": float(parts[7]),
                }
            )
        except ValueError:
            continue

    return entities