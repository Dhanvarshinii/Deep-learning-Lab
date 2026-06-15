# Requirements Installation

Install the project dependencies from `requirements.txt`:

```powershell
cd \Deep-learning-Lab
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

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
cd  \Deep-learning-Lab
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
