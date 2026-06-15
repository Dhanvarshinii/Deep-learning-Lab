# Requirements Installation

Install the project dependencies from `requirements.txt`:

```powershell
cd \Deep-learning-Lab
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

# Clinical NER Approaches

## Approach 1: Fine-Tuned Hugging Face Models

The main runnable script for combining the three fine-tuned NER models is:

```text
\Deep-learning-Lab\models\pre_fine_tuned_models\ensemble_pretrained_ner.py
```

This script loads the three fine-tuned Hugging Face models used in the notebooks:

- `d4data/biomedical-ner-all`
- `pabRomero/BioClinicalBERT-full-finetuned-ner-pablo`
- `StanfordAIMI/stanford-deidentifier-base`

It takes one clinical text input, runs all three models, maps similar entity labels into common meaning groups, compares overlapping entity spans, and keeps the higher-probability prediction when two similar entities match after lowercasing and removing spaces. The terminal output shows only the final selected entities.

Run it interactively from the project root:

```powershell
cd \Deep-learning-Lab
python models\pre_fine_tuned_models\ensemble_pretrained_ner.py
```

Or pass the input text directly:

```powershell
python models\pre_fine_tuned_models\ensemble_pretrained_ner.py --text "On 03/12/2019, Dr. Emily Smith at St. Mary's Hospital prescribed ibuprofen 400 mg to Mr. David Jones."
```

Useful options:

```powershell
python models\pre_fine_tuned_models\ensemble_pretrained_ner.py --device cpu
```

The three notebooks in `models\pre_fine_tuned_models` are mainly for understanding and comparing the individual fine-tuned models. Use `ensemble_pretrained_ner.py` when you want one terminal workflow that combines all three model outputs.

## Approach 2: scispaCy + Regex

The second approach is separate from the fine-tuned Hugging Face model workflow. It uses the scispaCy models and regex patterns from:

```text
\Deep-learning-Lab\models\scispacy_and_regex\scispacy_multi_model_regex_ner.ipynb
```

The runnable script is:

```text
\Deep-learning-Lab\models\scispacy_and_regex\scispacy_regex_ner.py
```

This script runs the available scispaCy biomedical NER models and the regex layer. It maps similar regex and scispaCy entity labels into common meaning groups, then compares overlapping text after lowercasing and removing spaces. If a regex entity overlaps a similar model entity, the regex entity is kept. If only scispaCy model entities overlap, the script chooses the model with the highest use-case rank for that entity group. The terminal output shows only the final selected entities.

Run it interactively from the project root:

```powershell
cd \Deep-learning-Lab
python models\scispacy_and_regex\scispacy_regex_ner.py
```

Or pass the input text directly:

```powershell
python models\scispacy_and_regex\scispacy_regex_ner.py --text "Dr. Smith prescribed ibuprofen 400 mg PO twice daily for 7 days."
```

If a scispaCy model is missing, the script prints the exact `python -m pip install ...` command for that model. This approach has no dependency on `models\pre_fine_tuned_models`.

# Dataset Downloads

## MACCROBAT

The local MACCROBAT files live under:

```text
\Deep-learning-Lab\data\maccrobat
```

The dataset is available on Hugging Face at:

```text
https://huggingface.co/datasets/ktgiahieu/maccrobat2018_2020
```

From the project root, download the Hugging Face files into `data\maccrobat` with PowerShell:

```powershell
cd \Deep-learning-Lab
New-Item -ItemType Directory -Force -Path data\maccrobat
Invoke-RestMethod -Uri "https://huggingface.co/datasets/ktgiahieu/maccrobat2018_2020/resolve/main/data.jsonl" -OutFile "data\maccrobat\data.jsonl"
Invoke-RestMethod -Uri "https://huggingface.co/datasets/ktgiahieu/maccrobat2018_2020/resolve/main/README.md" -OutFile "data\maccrobat\README.md"
Invoke-RestMethod -Uri "https://huggingface.co/datasets/ktgiahieu/maccrobat2018_2020/resolve/main/.gitattributes" -OutFile "data\maccrobat\.gitattributes"
```

The `data\maccrobat\README.md` file also notes that this Hugging Face copy is a modified dataset from the original MACCROBAT figshare dataset.

## Technetium-I

The local Technetium-I files live under:

```text
\Deep-learning-Lab\data\technetium
```

This dataset was downloaded manually from Hugging Face, not from the terminal. The source is listed in `data\technetium\README.md` as:

```text
https://huggingface.co/datasets/temlm-foundation/Technetium-I
```

To recreate this folder, you must open that Hugging Face dataset page in a browser, log in, and download the files yourself from the web UI. Place the downloaded files in `data\technetium`, including:

```text
train.jsonl
val.jsonl
test.jsonl
statistics.json
README.md
DATASET_CARD.md
```

For this project setup, Technetium-I cannot be downloaded from the terminal; use the authenticated Hugging Face browser download flow instead.
