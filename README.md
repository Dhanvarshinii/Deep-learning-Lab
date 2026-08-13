# An Annotation Interface and Deep Learning Backend for Named Entity Recognition in English Doctor’s Letters

**Clinical NER Annotation Tool**

Implemented by:

- Aveen Vas (3759264)
- Byna Rithika (3759109)
- Dhanvarshini Ramesh (3762374)

## Project overview

This repository contains a human-in-the-loop clinical named entity recognition (NER) application. The final working project is the web application under `UI/`.

The application allows a user to:

- paste clinical text or upload a TXT/PDF document;
- run one of five clinical NER approaches;
- review highlighted entities and confidence scores;
- add, edit, or delete annotations; and
- export the reviewed annotations as JSON.

The React frontend sends text to a local FastAPI backend. The backend runs the selected inference script and converts its output into a common entity format for the frontend.

## What the UI uses

The UI exposes all five inference approaches listed below. It does not execute every file under `models/`: training scripts, development notebooks, and evaluation notebooks are retained to document the work completed during the project.

| UI option | Backend service | Runtime inference script | Model or method |
|---|---|---|---|
| Ensemble Transformer | `UI/backend/services/ensemble.py` | `models/pre_fine_tuned_models/ensemble_pretrained_ner.py` | `d4data/biomedical-ner-all`, `pabRomero/BioClinicalBERT-full-finetuned-ner-pablo`, and `StanfordAIMI/stanford-deidentifier-base` |
| scispaCy + Regex | `UI/backend/services/scispacy.py` | `models/scispacy_and_regex/scispacy_regex_ner.py` | Five scispaCy biomedical models plus clinical and PHI regex patterns |
| Qwen 2.5 (LLM) | `UI/backend/services/qwen.py` | `models/llm/qwen25_clinical_ner_ollama.py` | Local `qwen2.5:14b-instruct` through Ollama |
| BioBERT + MACCROBAT | `UI/backend/services/biobert.py` | `models/biobert_maccrobat/biobert_maccrobat_ner.py` | Locally fine-tuned BioBERT model |
| ClinicalBERT + MACCROBAT | `UI/backend/services/clinicalbert.py` | `models/clinicalbert_maccrobat/clinicalbert_maccrobat_ner.py` | Locally fine-tuned ClinicalBERT model |

The two MACCROBAT inference scripts load their final model weights from:

- `models/biobert_maccrobat/biobert-maccrobat/`
- `models/clinicalbert_maccrobat/clinicalbert-maccrobat/`

These model weights are stored with Git LFS.

## Dataset used

### Live UI

The live UI does not require a fixed dataset. It performs inference on text supplied by the user through the text box or a TXT/PDF upload.

### MACCROBAT

MACCROBAT is the dataset used for model fine-tuning and evaluation in this repository. The local dataset contains 400 clinical documents represented as token and BIO-tag lists, with 82 labels including `O`.

- Local directory: `data/maccrobat/`
- Dataset source: `https://huggingface.co/datasets/ktgiahieu/maccrobat2018_2020`
- Original dataset: `https://doi.org/10.6084/m9.figshare.9764942.v2`
- License listed by the local dataset copy: CC BY 4.0

The local `data.jsonl` file is optional for the working UI. It is useful for rerunning training and evaluation notebooks and is intentionally ignored by Git because of its size.

## Repository structure

```text
Deep-learning-Lab/
|-- README.md
|-- requirements.txt
|-- data/
|   `-- maccrobat/
|       |-- data.jsonl                         # Optional local dataset copy
|       |-- Finetune_roberta_large_pubmed_vocab.ipynb
|       `-- README.md
|-- models/
|   |-- biobert_maccrobat/                    # Training, evaluation, final model, inference
|   |-- clinicalbert_maccrobat/               # Training, evaluation, final model, inference
|   |-- llm/                                  # Qwen inference and MACCROBAT evaluation
|   |-- pre_fine_tuned_models/                # Three-model ensemble and comparison notebooks
|   `-- scispacy_and_regex/                   # Hybrid pipeline and evaluation notebooks
`-- UI/
    |-- backend/                              # FastAPI application and model services
    `-- frontend/                             # React/Vite annotation interface
```

## Prerequisites

- Windows, macOS, or Linux
- Python 3.9 or newer (tested with Python 3.9.13 and Python 3.11)
- Node.js 20.19 or newer and npm
- Git LFS
- Internet access during initial dependency/model installation
- Ollama only when using the Qwen 2.5 option. Ollama is a separate system application and is not installed by `pip` or `requirements.txt`.

A CUDA GPU is optional. The local BioBERT and ClinicalBERT models automatically use CUDA when available and otherwise run on CPU. On macOS, the standalone inference scripts use CPU.

## Windows setup and execution

Open PowerShell, replace the example path with the location of your clone, and enter the project root:

```powershell
cd "C:\path\to\Deep-learning-Lab"
```

### 1. Download Git LFS model files

```powershell
git lfs install
git lfs pull
```

The two final `model.safetensors` files should each be approximately 411 MB. If they are only small text pointer files, rerun `git lfs pull` before starting the backend.

### 2. Create the Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If PowerShell blocks environment activation, enable it for the current terminal and retry:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### 3. Install the five scispaCy model packages

The `scispacy` Python package does not automatically install its biomedical language models. Install all five to run the complete scispaCy + Regex approach:

```powershell
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bionlp13cg_md-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_craft_md-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_jnlpba_md-0.5.4.tar.gz
```

### 4. Prepare Ollama for Qwen 2.5

This step is required only for the `Qwen 2.5 (LLM)` option.

Install Ollama from PowerShell:

```powershell
irm https://ollama.com/install.ps1 | iex
```

Alternatively, download the Windows installer from [Ollama for Windows](https://ollama.com/download/windows). After installation, close and reopen PowerShell, then verify the command and download the model:

```powershell
ollama --version
ollama pull qwen2.5:14b-instruct
```

If Ollama is installed but not already running, start it in a separate terminal:

```powershell
ollama serve
```

### 5. Install the frontend

```powershell
cd UI\frontend
npm ci
```

### Run the application on Windows

The backend and frontend must run in separate terminals.

#### Terminal 1: backend

Start the backend from `UI/backend`. This working directory is required by the current model service paths.

```powershell
cd "C:\path\to\Deep-learning-Lab"
.\.venv\Scripts\Activate.ps1
cd UI\backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Verify the backend at `http://127.0.0.1:8000/`. The expected response is:

```json
{"message": "Clinical NER Backend Running"}
```

#### Terminal 2: frontend

```powershell
cd "C:\path\to\Deep-learning-Lab\UI\frontend"
npm run dev
```

Open the exact URL printed by Vite, normally:

```text
http://localhost:5173
```

Use `localhost`, rather than `127.0.0.1`, for the frontend because the backend development CORS configuration allows `http://localhost:5173`.

## macOS setup and execution

The following commands use Terminal and Homebrew. If Homebrew is not installed, install it from `https://brew.sh` first.

### 1. Install system prerequisites

```bash
brew install python@3.11 node git-lfs
```

Enter the cloned project directory:

```bash
cd /path/to/Deep-learning-Lab
```

### 2. Download Git LFS model files

```bash
git lfs install
git lfs pull
```

The two final `model.safetensors` files should each be approximately 411 MB.

### 3. Create the Python environment

```bash
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 4. Install the five scispaCy model packages

```bash
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bionlp13cg_md-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_craft_md-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_jnlpba_md-0.5.4.tar.gz
```

### 5. Prepare Ollama for Qwen 2.5

This step is required only for the `Qwen 2.5 (LLM)` option. Install Ollama from Terminal:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Alternatively, download the application from [Ollama for macOS](https://ollama.com/download/mac). Open Ollama, then verify the command and download the model:

```bash
ollama --version
ollama pull qwen2.5:14b-instruct
```

### 6. Install the frontend

```bash
cd UI/frontend
npm ci
cd ../..
```

### 7. Run the backend

Open a terminal and start the backend from `UI/backend`:

```bash
cd /path/to/Deep-learning-Lab
source .venv/bin/activate
cd UI/backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Verify the backend at `http://127.0.0.1:8000/`.

### 8. Run the frontend

Open a second terminal:

```bash
cd /path/to/Deep-learning-Lab/UI/frontend
npm run dev
```

Open `http://localhost:5173` or the exact URL printed by Vite.

## Linux setup and execution

The following instructions target Ubuntu and Debian-based distributions. For another distribution, install the equivalent Python, Git LFS, and Node.js packages with its package manager. Ensure Node.js 20.19 or newer is installed before running `npm ci`.

### 1. Install system prerequisites

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git git-lfs build-essential
node --version
npm --version
```

If the displayed Node.js version is older than 20.19, install a current Node.js LTS release from `https://nodejs.org` before continuing.

Enter the cloned project directory:

```bash
cd /path/to/Deep-learning-Lab
```

### 2. Download Git LFS model files

```bash
git lfs install
git lfs pull
```

The two final `model.safetensors` files should each be approximately 411 MB.

### 3. Create the Python environment

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 4. Install the five scispaCy model packages

```bash
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bc5cdr_md-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_bionlp13cg_md-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_craft_md-0.5.4.tar.gz
python -m pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_ner_jnlpba_md-0.5.4.tar.gz
```

### 5. Prepare Ollama for Qwen 2.5

This step is required only for the `Qwen 2.5 (LLM)` option. Install Ollama using its official installation script:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Verify the command and download the model:

```bash
ollama --version
ollama pull qwen2.5:14b-instruct
```

If the Ollama service is not running, start it in a separate terminal:

```bash
ollama serve
```

### 6. Install the frontend

```bash
cd UI/frontend
npm ci
cd ../..
```

### 7. Run the backend

Open a terminal and start the backend from `UI/backend`:

```bash
cd /path/to/Deep-learning-Lab
source .venv/bin/activate
cd UI/backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Verify the backend at `http://127.0.0.1:8000/`.

### 8. Run the frontend

Open a second terminal:

```bash
cd /path/to/Deep-learning-Lab/UI/frontend
npm run dev
```

Open `http://localhost:5173` or the exact URL printed by Vite.

## Using the UI

1. Select one of the five annotation approaches.
2. Paste clinical text or upload a `.txt` or `.pdf` file.
3. Click **Run Annotation**.
4. Review the highlighted spans and entity list.
5. Select text to add a manual annotation, or edit/delete an existing annotation.
6. Click **Export** to save the reviewed annotations as JSON.

The exported JSON contains the document name, selected annotation model, and final annotation list.

## Model details

### Ensemble Transformer

The ensemble runs three Hugging Face token-classification models. It maps related labels into shared meaning groups and keeps the highest-confidence result when similar entity text is detected by multiple models.

The models are downloaded into the Hugging Face cache on first use. The UI backend currently limits ensemble input to 1,500 characters.

### scispaCy + Regex

This hybrid approach combines five biomedical scispaCy pipelines with regex rules for dates, names, identifiers, contact information, medication attributes, vital signs, laboratory values, and other structured clinical patterns.

Regex results receive priority when they conflict with a similar scispaCy entity. Missing scispaCy models are reported in the backend terminal.

### Qwen 2.5 through Ollama

Qwen uses the locally running `qwen2.5:14b-instruct` model. The prompt requests MACCROBAT-compatible span labels and structured JSON. The inference script validates labels, repairs character offsets, removes duplicates, and resolves overlapping spans.

Clinical text is sent only to the local Ollama server at `http://localhost:11434`.

### BioBERT + MACCROBAT

The BioBERT model starts from `dmis-lab/biobert-base-cased-v1.2` and was fine-tuned on an 80/20 seeded MACCROBAT document split. The final model supports all 82 BIO labels and performs sliding-window inference for long documents.

### ClinicalBERT + MACCROBAT

The ClinicalBERT model starts from `emilyalsentzer/Bio_ClinicalBERT` and uses the same MACCROBAT label schema and seeded 80/20 split.

## Model results

| Metric | BioBERT | ClinicalBERT | Qwen2.5 |
|---|---:|---:|---:|
| Accuracy | 95.54% | 95.50% | 85.14% |
| Precision | 84.11% | 82.85% | 45.88% |
| Recall | 93.53% | 92.84% | 18.87% |
| F1 Score | 88.57% | 87.56% | 26.74% |

The two fine-tuned-model scores use Seqeval on their held-out token windows. The ensemble, scispaCy, and Qwen notebooks use different label mappings and span-matching rules, so their scores should not be treated as a direct ranking against these results.

## Development and evaluation evidence

The notebooks and training scripts outside the five runtime inference entry points are intentionally retained as project evidence:

- individual pretrained-model exploration and scoped MACCROBAT evaluation;
- BioBERT and ClinicalBERT fine-tuning workflows;
- ensemble exact-span evaluation;
- scispaCy + Regex development and evaluation;
- Qwen prompt development and full MACCROBAT evaluation; and
- the original MACCROBAT RoBERTa fine-tuning reference notebook.

They are not imported or executed when the web application starts.

## Run an inference script directly

The models can also be tested without the UI from the project root:

```powershell
python models\biobert_maccrobat\biobert_maccrobat_ner.py --device cpu --text "A 67-year-old woman takes aspirin 325 mg daily."
python models\clinicalbert_maccrobat\clinicalbert_maccrobat_ner.py --device cpu --text "A 67-year-old woman takes aspirin 325 mg daily."
python models\pre_fine_tuned_models\ensemble_pretrained_ner.py --device cpu --text "Dr. Smith prescribed aspirin 325 mg."
python models\scispacy_and_regex\scispacy_regex_ner.py --text "Dr. Smith prescribed aspirin 325 mg PO daily."
python models\llm\qwen25_clinical_ner_ollama.py --text "Dr. Smith prescribed aspirin 325 mg PO daily."
```

## Troubleshooting

### `No module named fastapi` or another Python dependency

Confirm the virtual environment is active, then reinstall the root requirements:

```powershell
python -m pip install -r requirements.txt
```

### Local MACCROBAT model directory or weight not found

```powershell
git lfs pull
```

### A scispaCy model is missing

Install the exact URL printed in the backend terminal, or rerun all five scispaCy installation commands from the setup section.

### Qwen cannot connect to Ollama

Confirm the server and model:

```powershell
ollama list
ollama serve
```

### The first request is slow

The backend runs model scripts in separate processes. Transformer and scispaCy models are loaded when their approach is requested, and CPU inference can take significant time. The first ensemble request may also download model files.

### Frontend cannot reach the backend

Confirm that:

- FastAPI is running at `http://127.0.0.1:8000`;
- the frontend is open at `http://localhost:5173`; and
- the backend was started from `UI/backend`.
