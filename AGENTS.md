# BharatBricks - ArXiv Research Paper RAG Chatbot

## Project Overview

A Databricks App that demonstrates Databricks platform capabilities through a **Research Paper RAG Chatbot** targeting IISc Bangalore. Users can query a curated corpus of arXiv papers and get AI-powered answers with citations.

**Databricks features showcased:** Vector Search, Model Serving (LLM + embeddings), Unity Catalog Volumes, Databricks Apps with OAuth, MLflow Tracing.

## Project Structure

```
bharatbricks/
├── CLAUDE.md                     # This file - project conventions & structure
├── README.md                     # Project overview and setup instructions
├── pyproject.toml                # Package config, dependencies, CLI scripts
├── app.yaml                      # Databricks App deployment config
├── databricks.yml                # Databricks Asset Bundle config
├── requirements.txt              # Pinned deps for Databricks App deployment
│
├── src/
│   └── arxiv_distil/             # Core SDK / library module
│       ├── __init__.py
│       ├── config.py             # Centralized config (catalog, schema, endpoints, index names)
│       ├── embeddings.py         # Embedding generation using Databricks Model Serving
│       ├── vector_search.py      # Vector Search index creation & querying
│       ├── retriever.py          # RAG retrieval logic (query -> relevant chunks)
│       ├── chain.py              # LLM chain: prompt template + model serving call
│       └── ingest.py             # Paper ingestion: download, chunk, embed, upsert
│
├── app/                          # Databricks App (FastAPI backend + React frontend)
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app entry point, serves React static + API
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py           # POST /api/chat - RAG query endpoint (streaming)
│   │   │   └── health.py         # GET /api/health - health check
│   │   └── auth.py               # Databricks Apps OAuth helper
│   │
│   └── frontend/                 # React SPA (built static files served by FastAPI)
│       ├── package.json
│       ├── public/
│       │   └── index.html
│       └── src/
│           ├── App.jsx           # Main app component
│           ├── index.jsx         # React entry point
│           ├── components/
│           │   ├── ChatWindow.jsx    # Chat message list with streaming
│           │   ├── MessageInput.jsx  # User input box
│           │   └── Citation.jsx      # Paper citation card
│           └── styles/
│               └── app.css       # Styling
│
├── scripts/                      # CLI entry points (registered in pyproject.toml)
│   ├── __init__.py
│   ├── start_app.py              # Start FastAPI dev server locally
│   ├── preflight.py              # Validate Databricks workspace, endpoints, indexes exist
│   ├── ingest_papers.py          # Trigger paper ingestion pipeline
│   └── quickstart.py             # One-command setup: preflight + ingest + start
│
├── notebooks/                    # Databricks notebooks for ingestion & orchestration
│   ├── 01_setup_resources.py     # Create UC Volume, Vector Search endpoint/index, etc.
│   ├── 02_ingest_arxiv.py        # Download arXiv papers, chunk, embed, upsert to VS index
│   └── 03_evaluate_rag.py        # MLflow evaluation of RAG quality
│
├── tests/
│   ├── __init__.py
│   ├── test_retriever.py
│   └── test_chain.py
│
└── docs/
    └── architecture.md           # Architecture diagram & design decisions
```

## Key Conventions

- **Package manager:** `uv` (use `uv pip install -e .` for local dev)
- **Build system:** `hatchling`
- **Python version:** >=3.11
- **CLI scripts** are defined in `[project.scripts]` in `pyproject.toml`
- **Frontend:** Built React app lives in `app/frontend/build/` (gitignored), served as static files by FastAPI
- **Config:** All Databricks resource names (catalog, schema, VS endpoint, model endpoint) centralized in `src/arxiv_distil/config.py`

## Development Workflow

1. `uv pip install -e .` - Install package in editable mode
2. `cd app/frontend && npm install && npm run build` - Build React frontend
3. `preflight` - Verify Databricks resources exist
4. `ingest-papers` - Run paper ingestion
5. `start-app` - Launch FastAPI dev server
6. `quickstart` - All-in-one: preflight + ingest + start

## Databricks Deployment

- `app.yaml` defines the Databricks App config
- `databricks.yml` defines the Asset Bundle for CI/CD
- React frontend is pre-built and bundled; FastAPI serves it at `/`
- API routes under `/api/*`
