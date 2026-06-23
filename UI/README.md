# Clinical NER Annotation Tool UI

## Overview

The Clinical NER Annotation Tool provides a human-in-the-loop interface for extracting, reviewing, and refining clinical entities from medical documents. The application combines automated clinical NER approaches with manual annotation capabilities to support the creation of high-quality annotated datasets.

## Features

- Upload and process clinical documents in TXT and PDF format
- Annotate text using multiple clinical NER approaches:
  - Ensemble Transformer Models
  - scispaCy + Regex
  - Qwen 2.5 (Ollama)
- Review extracted entities and confidence scores
- Create manual annotations through direct text selection
- Edit entity labels and confidence scores
- Delete unwanted annotations
- Export finalized annotations as JSON

## Technology Stack

### Frontend
- React
- Vite
- Axios
- PDF.js
- Lucide React

### Backend
- FastAPI
- Python

## Project Structure

```text
UI
├── backend
└── frontend
```

## Purpose

This interface was developed as part of a Clinical Named Entity Recognition (NER) project to support efficient annotation, correction, and validation of clinical entities through an intuitive and user-friendly workflow.