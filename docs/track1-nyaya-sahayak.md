# Track 1: Nyaya-Sahayak — Governance & Access to Justice

> Build AI that makes Indian law accessible. India recently transitioned from the colonial IPC to the Bharatiya Nyaya Sanhita (BNS). Help citizens and junior lawyers navigate this new legal framework and discover government schemes.

---

## Datasets

### 1. Bharatiya Nyaya Sanhita (BNS) 2023 Full Text

**Source:** [Kaggle — BNS Dataset](https://www.kaggle.com/datasets/nandr39/bharatiya-nyaya-sanhita-dataset-bns)
**License:** CC BY-SA 4.0
**Format:** CSV/JSON inside a ZIP (~83 KB)

#### What Is This Data?

The Bharatiya Nyaya Sanhita (BNS), 2023 is India's new criminal code that replaced the 163-year-old Indian Penal Code (IPC) on 1 July 2024. This dataset is a structured, machine-readable version of the complete BNS text — organized by chapters, sections, and descriptions.

#### Schema

| Column | Type | Description |
|--------|------|-------------|
| `chapter` | string | Chapter number/title grouping related offences (e.g., "Chapter VI — Of Offences Against the State") |
| `section` | string | Section number within the chapter (e.g., "Section 109") |
| `description` | string | Full legal text of the section — the actual law, including definitions, punishments, and exceptions |

#### Semantic Understanding

- **Chapter** acts as a thematic grouper — think of it as a "category" of law (offences against body, property, state, etc.). Useful for filtering and building topic-specific retrievers.
- **Section** is the atomic legal unit. Citizens and lawyers reference laws by section number (e.g., "BNS Section 303" for murder). Your chatbot should be able to retrieve and explain individual sections.
- **Description** contains the actual legal language — often dense, with nested clauses, provisos, and cross-references to other sections. This is where chunking and embedding matter most.

#### How to Use in Your Project

```python
# Download from Kaggle (requires kaggle CLI or manual download)
# pip install kaggle
# kaggle datasets download -d nandr39/bharatiya-nyaya-sanhita-dataset-bns

import pandas as pd

# Load the BNS dataset
bns_df = pd.read_csv("bharatiya_nyaya_sanhita.csv")
print(bns_df.head())
print(f"Total sections: {len(bns_df)}")

# Each row = one section of the law
# Combine chapter + section + description for embedding
bns_df["full_text"] = (
    "Chapter: " + bns_df["chapter"] +
    "\nSection: " + bns_df["section"] +
    "\n" + bns_df["description"]
)
```

**Loading into Databricks (Delta Lake):**

```python
# In a Databricks notebook
df = spark.read.option("header", True).csv("/Volumes/<catalog>/<schema>/bns/bharatiya_nyaya_sanhita.csv")
df.write.format("delta").saveAsTable("<catalog>.<schema>.bns_sections")

# Verify
display(spark.sql("SELECT * FROM <catalog>.<schema>.bns_sections LIMIT 5"))
```

### 2. Constitution of India

The full text of the Constitution is publicly available. You can source it from:
- [India Code — Constitution](https://www.indiacode.nic.in/handle/123456789/2263/browse?type=type&value=Constitution)
- [Legislative.gov.in](https://legislative.gov.in/constitution-of-india/)

For the hackathon, download the PDF and parse it into structured text (articles, schedules, amendments). Libraries like `PyMuPDF` or `pdfplumber` work well.

### 3. Government Schemes (gov_myscheme)

**Source:** [myScheme.gov.in](https://www.myscheme.gov.in/) and [data.gov.in](https://www.data.gov.in/)

This dataset contains Indian government welfare schemes with eligibility criteria, benefits, application process, and target demographics. Useful for building a "scheme eligibility checker" where a user describes their profile and the AI recommends applicable schemes.

### 4. BhashaBench-Legal (BBL)

**Source:** [HuggingFace — bharatgenai/BhashaBench-Legal](https://huggingface.co/datasets/bharatgenai/BhashaBench-Legal)
**License:** CC BY 4.0
**Format:** Parquet (test split)
**Access:** Gated — requires HuggingFace login and agreeing to share contact info
**Paper:** [arXiv:2510.25409](https://arxiv.org/abs/2510.25409)

#### What Is This Data?

BhashaBench-Legal is a comprehensive benchmark of **24,365 legal questions** sourced from 50+ Indian judicial service exams, bar examinations, and legal education assessments. It's designed to evaluate how well AI models understand Indian law — making it the perfect evaluation dataset for your Nyaya-Sahayak RAG pipeline.

#### Statistics

| Metric | Value |
|--------|-------|
| Total Questions | 24,365 |
| English Questions | 17,047 |
| Hindi Questions | 7,318 |
| Subject Domains | 20+ |
| Government Exams Covered | 50+ |
| Difficulty: Easy | 8,200 |
| Difficulty: Medium | 12,150 |
| Difficulty: Hard | 4,015 |

#### Schema

| Column | Type | Description |
|--------|------|-------------|
| `question` | string | The legal question text (in English or Hindi) |
| `options` | list/string | Multiple choice answer options |
| `answer` | string | The correct answer |
| `difficulty` | string | `Easy`, `Medium`, or `Hard` |
| `subject_domain` | string | Legal domain (see below) |

#### Subject Domains (Top 10 by Volume)

| Domain | Count | Relevance to BNS Track |
|--------|-------|----------------------|
| Civil Litigation & Procedure | 7,126 | High — procedure questions |
| Constitutional & Administrative Law | 3,609 | High — fundamental rights, governance |
| Criminal Law & Justice | 2,769 | **Very High** — directly covers BNS territory |
| Corporate & Commercial Law | 2,700 | Medium |
| General Academic Subjects | 1,756 | Low |
| Legal Theory & Jurisprudence | 1,421 | Medium |
| Family & Personal Law | 991 | Medium |
| International & Comparative Law | 962 | Low |
| Technology & Cyber Law | 123 | Medium |
| Consumer & Competition Law | 75 | Low |

#### Task Types

- **Multiple Choice** — Standard 4-option MCQ
- **Assertion-Reasoning** — "Assertion A is true because of Reason R"
- **Match the Column** — Match legal concepts to definitions
- **Rearrange the Sequence** — Order legal procedures correctly
- **Fill in the Blanks** — Complete legal statements

#### How to Load

```python
# Requires HuggingFace token (gated dataset)
# 1. Create account at huggingface.co
# 2. Go to huggingface.co/datasets/bharatgenai/BhashaBench-Legal
# 3. Accept the terms
# 4. Create a read token at huggingface.co/settings/tokens

from datasets import load_dataset

# Load English questions
english_data = load_dataset(
    "bharatgenai/BhashaBench-Legal",
    data_dir="English",
    split="test",
    token="<YOUR_HF_TOKEN>",  # or set HF_TOKEN env var
)
print(f"English questions: {len(english_data)}")
print(english_data[0])

# Load Hindi questions
hindi_data = load_dataset(
    "bharatgenai/BhashaBench-Legal",
    data_dir="Hindi",
    split="test",
    token=True,  # uses HF_TOKEN from environment
)
print(f"Hindi questions: {len(hindi_data)}")
print(hindi_data[0])
```

#### Semantic Understanding

- **Criminal Law & Justice** (2,769 questions) maps directly to BNS content — use these to evaluate your BNS chatbot.
- **Constitutional & Administrative Law** (3,609 questions) tests governance knowledge — relevant if you're building a scheme eligibility checker.
- **Difficulty levels** let you measure your RAG pipeline's robustness: if it handles `Hard` questions well, it's solid.
- **Hindi questions** (7,318) let you evaluate multilingual performance — critical for a tool targeting Indian citizens.
- The **correct answer** field gives you ground truth for automated evaluation with MLflow.

---

## Recommended Indic Models

### Primary: Sarvam-M (Best for This Track)

**Why:** Sarvam-M has hybrid reasoning (think/non-think modes), strong Indic language support across 11 languages, and an **OpenAI-compatible API** — perfect for students.

**Link:** [huggingface.co/sarvamai/sarvam-m](https://huggingface.co/sarvamai/sarvam-m)
**License:** Apache 2.0
**Base:** Mistral-Small-3.1-24B

#### Using Sarvam-M via OpenAI SDK (Easiest Approach)

Sarvam provides an OpenAI-compatible API. This is the simplest way to use it in your notebooks.

**Step 1: Get an API Key**

1. Go to [dashboard.sarvam.ai](https://dashboard.sarvam.ai/)
2. Sign up and create an API key
3. Store it securely (Databricks Secrets or environment variable)

**Step 2: Install the OpenAI SDK**

```bash
pip install openai
```

**Step 3: Query the Model**

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.sarvam.ai/v1",
    api_key="<YOUR_SARVAM_API_KEY>",  # Use dbutils.secrets.get() in Databricks
)

# Legal Q&A example
response = client.chat.completions.create(
    model="sarvam-m",
    messages=[
        {
            "role": "system",
            "content": (
                "You are Nyaya-Sahayak, a legal assistant that explains Indian law "
                "in simple language. You help citizens understand the Bharatiya Nyaya "
                "Sanhita (BNS) 2023. Answer in the same language the user asks in."
            ),
        },
        {
            "role": "user",
            "content": "BNS Section 303 kya kehta hai? Simple Hindi mein samjhao.",
        },
    ],
    reasoning_effort="medium",  # Enables think mode for complex legal reasoning
    max_completion_tokens=4096,
)

print(response.choices[0].message.content)
```

### Secondary: Param-1 (2.9B) — Lightweight Alternative

**Why:** Only 2.9B params — runs on CPU or a single small GPU. Great for quick prototyping.

**Link:** [huggingface.co/bharatgenai/Param-1-2.9B-Instruct](https://huggingface.co/bharatgenai/Param-1-2.9B-Instruct)
**License:** Apache 2.0
**Languages:** Hindi + English

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_name = "bharatgenai/Param-1-2.9B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, device_map="auto")

conversation = [
    {"role": "system", "content": "You are a legal assistant for Indian law."},
    {"role": "user", "content": "What is Section 109 of BNS 2023?"},
]

inputs = tokenizer.apply_chat_template(conversation, return_tensors="pt", add_generation_prompt=True)
inputs = inputs.to(model.device)

with torch.no_grad():
    output = model.generate(inputs, max_new_tokens=300, temperature=0.6, top_p=0.95)

generated = output[0][inputs.shape[-1]:]
print(tokenizer.decode(generated, skip_special_tokens=True))
```

### Translation: IndicTrans2

**Why:** Translate legal text across 22 Indian languages. Essential for making law accessible to non-English, non-Hindi speakers.

**Link:** [github.com/AI4Bharat/IndicTrans2](https://github.com/AI4Bharat/IndicTrans2)
**Variants:** 1B (base), 200M-320M (distilled)

```bash
git clone https://github.com/AI4Bharat/IndicTrans2
cd IndicTrans2
source install.sh
```

```python
from inference.engine import Model

model = Model(ckpt_dir="<path_to_model>", model_type="fairseq")

# Translate legal text from English to Tamil
english_sections = [
    "Whoever commits murder shall be punished with death or imprisonment for life."
]
tamil_output = model.batch_translate(english_sections, src_lang="eng_Latn", tgt_lang="tam_Taml")
print(tamil_output)
```

---

## Implementation Blueprint

### Architecture: RAG Pipeline for Legal Q&A

```
User Query (Hindi/English/Regional)
        │
        ▼
  ┌─────────────┐
  │ IndicTrans2  │  (if non-Hindi/English, translate to English)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Embedding   │  (embed query using Databricks Model Serving or sentence-transformers)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ Vector Search│  (retrieve top-k relevant BNS sections from Delta table)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Sarvam-M    │  (generate answer with retrieved context via OpenAI SDK)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ IndicTrans2  │  (translate response back to user's language)
  └──────┬──────┘
         ▼
    Response with Citations
```

### Step-by-Step Notebook Walkthrough

#### Step 1: Ingest & Store BNS Data in Delta Lake

```python
# Upload BNS CSV to a Unity Catalog Volume, then:
bns_df = spark.read.option("header", True).csv("/Volumes/<catalog>/<schema>/data/bns.csv")

# Add a unique ID and a combined text column for embedding
from pyspark.sql.functions import concat_ws, monotonically_increasing_id

bns_df = bns_df.withColumn("id", monotonically_increasing_id())
bns_df = bns_df.withColumn(
    "full_text",
    concat_ws(" | ", "chapter", "section", "description")
)

bns_df.write.format("delta").mode("overwrite").saveAsTable("<catalog>.<schema>.bns_sections")
```

#### Step 2: Generate Embeddings & Build Vector Index

```python
# Option A: Use Databricks Vector Search (recommended)
# Create a Vector Search endpoint and sync from the Delta table.
# See: https://docs.databricks.com/en/generative-ai/vector-search.html

# Option B: Use sentence-transformers locally
from sentence_transformers import SentenceTransformer
import pandas as pd

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
pdf = spark.table("<catalog>.<schema>.bns_sections").toPandas()

pdf["embedding"] = pdf["full_text"].apply(lambda x: model.encode(x).tolist())
```

#### Step 3: RAG Query with Sarvam-M

```python
from openai import OpenAI

client = OpenAI(base_url="https://api.sarvam.ai/v1", api_key="<KEY>")

def ask_nyaya_sahayak(question: str, retrieved_sections: list[str]) -> str:
    context = "\n\n---\n\n".join(retrieved_sections)

    response = client.chat.completions.create(
        model="sarvam-m",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Nyaya-Sahayak, an AI legal assistant. Use ONLY the "
                    "provided BNS sections to answer. Cite section numbers. "
                    "If the answer is not in the context, say so. "
                    "Respond in the same language the user asks in."
                ),
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}",
            },
        ],
        reasoning_effort="medium",
        max_completion_tokens=4096,
    )
    return response.choices[0].message.content

# Example usage
sections = ["Section 109: Attempt to murder — Whoever attempts to commit murder..."]
answer = ask_nyaya_sahayak("What is the punishment for attempt to murder under BNS?", sections)
print(answer)
```

#### Step 4: Build a UI (Databricks App or Gradio)

```python
# Quick Gradio UI in a Databricks notebook
import gradio as gr

def chat(message, history):
    # 1. Embed the question
    # 2. Search Vector Index for relevant sections
    # 3. Call ask_nyaya_sahayak()
    return ask_nyaya_sahayak(message, retrieved_sections)

gr.ChatInterface(chat, title="Nyaya-Sahayak: BNS Legal Assistant").launch()
```

---

## Starter Ideas

| Idea | Complexity | Key Components |
|------|-----------|----------------|
| **BNS Explainer Chatbot (Hindi/English)** | Medium | RAG + Sarvam-M + BNS dataset |
| **Scheme Eligibility Checker** | Medium | RAG + gov_myscheme data + user profile matching |
| **IPC → BNS Comparison Tool** | High | Both IPC + BNS datasets, section mapping, diff visualization |
| **Multilingual Legal Q&A** | High | RAG + IndicTrans2 + Sarvam-M + Vector Search |

---

## Evaluating Your RAG Pipeline with MLflow + BhashaBench-Legal

A working demo is great, but **measuring how accurate your RAG pipeline actually is** will set your submission apart. BhashaBench-Legal gives you 24,365 legal questions with known correct answers — combine that with MLflow's evaluation framework to run structured experiments.

### Why Evaluate?

- **Prove your RAG works.** "It seems to answer well" is not enough. Show precision, recall, and correctness metrics.
- **Compare approaches.** Does adding IndicTrans2 translation improve Hindi accuracy? Does chunk size matter? MLflow lets you A/B test.
- **Impress judges.** An MLflow experiment dashboard showing systematic evaluation signals engineering maturity.

### Step 1: Load BhashaBench-Legal as Your Eval Dataset

```python
%pip install datasets mlflow openai

from datasets import load_dataset
import pandas as pd
import os

os.environ["HF_TOKEN"] = dbutils.secrets.get(scope="hackathon", key="hf-token")

# Load the Criminal Law subset (most relevant to BNS track)
bbl_english = load_dataset(
    "bharatgenai/BhashaBench-Legal",
    data_dir="English",
    split="test",
    token=True,
)

bbl_hindi = load_dataset(
    "bharatgenai/BhashaBench-Legal",
    data_dir="Hindi",
    split="test",
    token=True,
)

# Convert to pandas for easier manipulation
eval_en = bbl_english.to_pandas()
eval_hi = bbl_hindi.to_pandas()

print(f"English eval questions: {len(eval_en)}")
print(f"Hindi eval questions: {len(eval_hi)}")

# Filter to Criminal Law & Justice domain (directly relevant to BNS)
# Adjust the column name based on actual schema
eval_criminal = eval_en[eval_en["subject_domain"].str.contains("Criminal", case=False, na=False)]
print(f"Criminal law questions for BNS eval: {len(eval_criminal)}")
```

### Step 2: Define Your RAG Pipeline as a Function

Wrap your entire RAG pipeline (retrieve + generate) into a single function that MLflow can call repeatedly.

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.sarvam.ai/v1",
    api_key=dbutils.secrets.get(scope="hackathon", key="sarvam-api-key"),
)

def retrieve_bns_sections(question: str, top_k: int = 3) -> list[str]:
    """
    Retrieve relevant BNS sections for a question.
    Replace this with your actual Vector Search / FAISS retrieval logic.
    """
    # Option A: Databricks Vector Search
    # results = vs_index.similarity_search(
    #     query_text=question,
    #     columns=["full_text", "section"],
    #     num_results=top_k,
    # )
    # return [row["full_text"] for row in results["result"]["data_array"]]

    # Option B: FAISS / sentence-transformers (placeholder)
    # embedding = embed_model.encode(question)
    # distances, indices = faiss_index.search(embedding, top_k)
    # return [bns_chunks[i] for i in indices[0]]

    return ["<your retrieval logic here>"]


def nyaya_sahayak_rag(question: str) -> str:
    """Full RAG pipeline: retrieve + generate."""
    retrieved = retrieve_bns_sections(question, top_k=3)
    context = "\n\n---\n\n".join(retrieved)

    response = client.chat.completions.create(
        model="sarvam-m",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Nyaya-Sahayak, an AI legal assistant specializing in "
                    "Indian law. Use ONLY the provided BNS sections to answer. "
                    "Cite section numbers. If the answer is not in the context, say so."
                ),
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}",
            },
        ],
        reasoning_effort="medium",
        max_completion_tokens=1024,
    )
    return response.choices[0].message.content
```

### Step 3: Build the MLflow Evaluation Dataset

MLflow's `evaluate()` expects a specific format. Convert BhashaBench-Legal into an eval DataFrame with `inputs` (questions) and `targets` (ground truth answers).

```python
import pandas as pd

# Sample a manageable subset for evaluation (full 24k would be expensive via API)
eval_sample = eval_criminal.sample(n=100, random_state=42).reset_index(drop=True)

# Build the eval DataFrame
eval_df = pd.DataFrame({
    "inputs": eval_sample["question"].tolist(),
    "targets": eval_sample["answer"].tolist(),
})

# If questions have options, include them in the input
# (so the model knows it's an MCQ and can pick the right option)
if "options" in eval_sample.columns:
    eval_df["inputs"] = eval_sample.apply(
        lambda row: f"{row['question']}\n\nOptions:\n{row['options']}", axis=1
    )

print(eval_df.head())
```

### Step 4: Run the MLflow Evaluation Experiment

```python
import mlflow

# Set the experiment name
mlflow.set_experiment("/Users/<your-email>/nyaya-sahayak-eval")

# Define a model wrapper that MLflow can call
def rag_model(inputs: pd.DataFrame) -> list[str]:
    """Wrapper for MLflow evaluate — takes a DataFrame, returns predictions."""
    predictions = []
    for question in inputs["inputs"]:
        try:
            answer = nyaya_sahayak_rag(question)
            predictions.append(answer)
        except Exception as e:
            predictions.append(f"Error: {str(e)}")
    return predictions

# Run the evaluation
with mlflow.start_run(run_name="nyaya-sahayak-v1-sarvam-m"):
    # Log your configuration
    mlflow.log_params({
        "model": "sarvam-m",
        "reasoning_effort": "medium",
        "retriever": "vector_search",
        "top_k": 3,
        "eval_dataset": "BhashaBench-Legal (Criminal Law, English)",
        "eval_size": len(eval_df),
    })

    results = mlflow.evaluate(
        model=rag_model,
        data=eval_df,
        targets="targets",
        model_type="question-answering",
        extra_metrics=[
            # MLflow built-in metrics for QA
            # Exact match, token overlap, etc.
        ],
    )

    print(f"\n=== Evaluation Results ===")
    print(results.metrics)

    # The per-row results are in results.tables["eval_results_table"]
    results_df = results.tables["eval_results_table"]
    display(results_df.head(10))
```

### Step 5: Custom Scorers for Legal RAG

MLflow's built-in metrics (exact match, token F1) are a start, but legal Q&A needs domain-specific evaluation. Define custom scorers.

```python
from mlflow.metrics.genai import make_genai_metric

# Custom scorer: Does the answer cite BNS section numbers?
citation_scorer = make_genai_metric(
    name="citation_quality",
    definition=(
        "Does the answer cite specific BNS section numbers to support its claims? "
        "A good legal answer always references the relevant section."
    ),
    grading_prompt=(
        "Score from 1-5:\n"
        "1 = No citations at all\n"
        "2 = Vague reference ('the law says...')\n"
        "3 = Mentions a section but may be wrong\n"
        "4 = Correctly cites relevant section(s)\n"
        "5 = Comprehensive citations with section numbers and explanations"
    ),
    model="endpoints:/databricks-meta-llama-3-1-70b-instruct",  # judge model
    parameters={"temperature": 0.0},
    greater_is_better=True,
)

# Custom scorer: Is the answer factually correct per Indian law?
correctness_scorer = make_genai_metric(
    name="legal_correctness",
    definition=(
        "Is the answer factually correct according to the Bharatiya Nyaya Sanhita (BNS) 2023? "
        "Compare the model's answer against the ground truth."
    ),
    grading_prompt=(
        "Given the question, the model's answer, and the ground truth answer, "
        "score from 1-5:\n"
        "1 = Completely wrong\n"
        "2 = Partially correct but misleading\n"
        "3 = Roughly correct but imprecise\n"
        "4 = Correct with minor omissions\n"
        "5 = Fully correct and well-explained"
    ),
    model="endpoints:/databricks-meta-llama-3-1-70b-instruct",
    parameters={"temperature": 0.0},
    greater_is_better=True,
)

# Run evaluation with custom scorers
with mlflow.start_run(run_name="nyaya-sahayak-v1-custom-metrics"):
    mlflow.log_params({
        "model": "sarvam-m",
        "reasoning_effort": "medium",
        "retriever": "vector_search",
        "top_k": 3,
    })

    results = mlflow.evaluate(
        model=rag_model,
        data=eval_df,
        targets="targets",
        model_type="question-answering",
        extra_metrics=[citation_scorer, correctness_scorer],
    )

    print(results.metrics)
```

### Step 6: Compare Experiments (A/B Testing)

The real power of MLflow is comparing different configurations side by side.

```python
# Experiment 1: Sarvam-M with top_k=3
# (already done above)

# Experiment 2: Sarvam-M with top_k=5 (more context)
with mlflow.start_run(run_name="nyaya-sahayak-v2-topk5"):
    mlflow.log_params({"model": "sarvam-m", "top_k": 5})
    # ... run evaluate with top_k=5 retrieval ...

# Experiment 3: Param-1 instead of Sarvam-M (smaller model)
with mlflow.start_run(run_name="nyaya-sahayak-v3-param1"):
    mlflow.log_params({"model": "Param-1-2.9B", "top_k": 3})
    # ... run evaluate with Param-1 as the generator ...

# Experiment 4: Hindi questions (test multilingual performance)
eval_hi_sample = eval_hi.sample(n=50, random_state=42)
eval_hi_df = pd.DataFrame({
    "inputs": eval_hi_sample["question"].tolist(),
    "targets": eval_hi_sample["answer"].tolist(),
})

with mlflow.start_run(run_name="nyaya-sahayak-v4-hindi"):
    mlflow.log_params({"model": "sarvam-m", "language": "Hindi", "top_k": 3})
    results = mlflow.evaluate(
        model=rag_model,
        data=eval_hi_df,
        targets="targets",
        model_type="question-answering",
    )
    print(f"Hindi evaluation: {results.metrics}")
```

After running multiple experiments, open the **MLflow Experiment UI** in Databricks to compare runs side by side — see which configuration gives the best legal_correctness and citation_quality scores.

### Quick Reference: MLflow Evaluation Metrics

| Metric | What It Measures | Good For |
|--------|-----------------|----------|
| `exact_match` | Does the answer exactly match ground truth? | MCQ-style questions |
| `token_overlap_f1` | Token-level F1 between prediction and target | Open-ended legal answers |
| `citation_quality` (custom) | Does the answer cite BNS section numbers? | Legal RAG quality |
| `legal_correctness` (custom) | Is the answer factually correct per Indian law? | Overall RAG accuracy |
| `latency` | Response time per question | User experience |

### What Judges Will See

When judges open your MLflow experiment, they'll see:
1. **Params**: model name, top_k, language, reasoning_effort — showing you tested systematically
2. **Metrics**: correctness scores, citation quality, latency — showing measurable quality
3. **Artifacts**: eval results table — showing per-question breakdown
4. **Run comparison**: side-by-side charts — showing you optimized your pipeline

This turns "my chatbot works" into "my chatbot achieves 78% legal correctness on 100 BhashaBench-Legal criminal law questions, with 4.2/5 citation quality, and handles Hindi at 71% accuracy."

---

## Tips

- **Chunking legal text:** BNS sections are already atomic units — each section is a natural chunk. No need for complex chunking strategies.
- **Cross-references:** Legal text often says "as described in Section X". Consider building a section-reference graph to pull in related sections automatically.
- **Evaluation cost:** Running 24,365 questions through Sarvam-M API costs time and credits. Sample 100-200 questions for your eval runs. Use the `subject_domain` filter to focus on Criminal Law questions most relevant to BNS.
- **BhashaBench is gated:** You need a HuggingFace account and must accept terms before downloading. Do this during the workshop/setup phase, not during the hack.
- **Databricks Free Edition:** Use `dbutils.secrets` to store API keys (Sarvam + HuggingFace). Use Delta Lake for all structured data. Use Vector Search if available, or FAISS on DBFS as fallback.
