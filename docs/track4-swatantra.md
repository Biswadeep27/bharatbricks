# Track 4: Swatantra — Open / Any Indic AI Use Case

> Got a strong original idea that doesn't fit the defined themes? Agriculture advisory, healthcare triaging, education tools, accessibility aids. Surprise us. The only constraints are the mandatory requirements.

---

## Overview

Swatantra is the open track — you're free to tackle **any problem that matters to India** using AI on Databricks. The judges want to see creative platform usage and genuine impact. The only hard requirements are the [mandatory rules](#mandatory-requirements-recap) at the bottom.

---

## Finding Your Dataset

Since this is an open track, you pick your own dataset. Here are the two best sources for Indian public data:

### 1. data.gov.in — India's Open Government Data Platform

**URL:** [https://www.data.gov.in/](https://www.data.gov.in/)

India's official open data portal with **400,000+ datasets** across agriculture, health, education, transport, environment, and more.

#### How to Find and Download Data

1. Go to [data.gov.in](https://www.data.gov.in/)
2. Use the **search bar** or browse by **sector** (Agriculture, Health, Education, etc.)
3. Filter by format (CSV, JSON, XML, API)
4. Click on a dataset → **Download** or use the **API endpoint**

#### Example: Agriculture Crop Production Data

```python
# Many data.gov.in datasets provide direct download links or APIs
# Example: Download a CSV dataset

import requests
import pandas as pd

# Option 1: Direct download (find the download URL on the dataset page)
# Upload to Databricks Volume manually or via CLI

# Option 2: Use the data.gov.in API
# API documentation: https://data.gov.in/help/apis
# You need an API key — register at data.gov.in

# After downloading and uploading to a Volume:
df = spark.read.option("header", True).option("inferSchema", True).csv(
    "/Volumes/<catalog>/<schema>/data/crop_production.csv"
)
df.write.format("delta").saveAsTable("<catalog>.<schema>.crop_production")
display(df.limit(10))
```

#### Popular Datasets for Hackathon Ideas

| Dataset | Sector | Use Case Idea |
|---------|--------|---------------|
| Crop Production Statistics | Agriculture | Crop yield prediction, advisory bot |
| Hospital Directory | Health | Healthcare facility finder, triage assistant |
| School Education Statistics | Education | Learning gap analysis, accessibility tool |
| Air Quality Index | Environment | Pollution alert system, health advisory |
| Census Village Data | Demographics | Rural development analytics |
| Weather Station Data | Climate | Agricultural weather advisory |

### 2. AIKosh — IndiaAI's Dataset Repository

**URL:** [https://aikosh.indiaai.gov.in/](https://aikosh.indiaai.gov.in/)

AIKosh is the Indian government's AI-focused data repository. It hosts curated datasets specifically designed for AI/ML applications in Indian contexts.

#### How to Access

1. Go to [aikosh.indiaai.gov.in](https://aikosh.indiaai.gov.in/)
2. Browse by domain: Healthcare, Agriculture, Education, Smart Cities, NLP, Computer Vision
3. Create an account to download datasets
4. Many datasets include pre-defined train/test splits and evaluation benchmarks

#### Notable AIKosh Datasets

| Dataset | Domain | Description |
|---------|--------|-------------|
| Indian Language Datasets | NLP | Text corpora in multiple Indian languages |
| Healthcare Imaging | Health | Medical imaging datasets (X-rays, CT scans) |
| Agricultural Satellite Data | Agriculture | Crop area and yield estimation imagery |
| Indian Road Scene Data | Transport | For autonomous driving and traffic analysis |

### 3. Other Useful Sources

| Source | URL | Best For |
|--------|-----|----------|
| Kaggle | [kaggle.com](https://www.kaggle.com/) | Pre-cleaned, community-curated datasets |
| HuggingFace Datasets | [huggingface.co/datasets](https://huggingface.co/datasets) | NLP/text datasets, especially Indic |
| AI4Bharat | [ai4bharat.iitm.ac.in/datasets](https://ai4bharat.iitm.ac.in/datasets) | Indian language NLP datasets |
| NPCI / RBI | [npci.org.in](https://www.npci.org.in/) | Financial/payments statistics |
| India Meteorological Dept. | [mausam.imd.gov.in](https://mausam.imd.gov.in/) | Weather and climate data |

---

## Recommended Indic Models

All four models from the hackathon resource list are available to you. Pick based on your use case:

### Quick Model Selection Guide

| Model | Params | Best For | API Available? | Languages |
|-------|--------|----------|---------------|-----------|
| **Sarvam-M** | ~24B | Complex reasoning, multilingual chat, any domain | Yes (OpenAI-compatible) | 11 Indic + English |
| **Param-1** | 2.9B | Lightweight prototyping, Hindi/English tasks | No (local only) | Hindi + English |
| **Airavata** | 7B | Hindi instruction-following, Q&A, summarization | No (local only) | Hindi (primary) |
| **IndicTrans2** | 200M–1B | Translation across 22 Indian languages | No (local only) | 22 Indic + English |

### Sarvam-M via OpenAI SDK (Recommended Default)

The fastest path for any use case. Works via API — no GPU needed on your end.

**Step 1: Get an API Key**

1. Go to [dashboard.sarvam.ai](https://dashboard.sarvam.ai/)
2. Sign up → Generate API key
3. Store in Databricks Secrets:
   ```bash
   databricks secrets create-scope --scope hackathon
   databricks secrets put-secret --scope hackathon --key sarvam-api-key
   ```

**Step 2: Use in Your Notebook**

```python
from openai import OpenAI

api_key = dbutils.secrets.get(scope="hackathon", key="sarvam-api-key")

client = OpenAI(
    base_url="https://api.sarvam.ai/v1",
    api_key=api_key,
)

# Adapt system prompt to YOUR use case
response = client.chat.completions.create(
    model="sarvam-m",
    messages=[
        {
            "role": "system",
            "content": "You are [YOUR_BOT_NAME], an AI assistant that [YOUR_PURPOSE]. Respond in the user's language.",
        },
        {"role": "user", "content": "Your user's question here"},
    ],
    reasoning_effort="medium",  # "low", "medium", "high", or None
    max_completion_tokens=4096,
)

print(response.choices[0].message.content)
```

**Sarvam-M Parameters:**
- `reasoning_effort="low"` — Fast, simple responses
- `reasoning_effort="medium"` — Balanced (good default)
- `reasoning_effort="high"` — Deep reasoning for complex tasks
- `reasoning_effort=None` — Disable thinking, pure chat mode
- `max_completion_tokens` — Up to 8192

### Param-1 (2.9B) — Run Locally on Databricks

No API key needed. Runs on a single GPU or even CPU (slower).

```python
# Install in notebook
%pip install transformers torch accelerate

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_name = "bharatgenai/Param-1-2.9B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, device_map="auto")

def ask_param1(question: str, system_prompt: str = "You are a helpful assistant.") -> str:
    conversation = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question},
    ]
    inputs = tokenizer.apply_chat_template(
        conversation, return_tensors="pt", add_generation_prompt=True
    ).to(model.device)

    with torch.no_grad():
        output = model.generate(
            inputs, max_new_tokens=300, temperature=0.6, top_p=0.95, do_sample=True
        )
    return tokenizer.decode(output[0][inputs.shape[-1]:], skip_special_tokens=True)

# Example: Agriculture advisory
print(ask_param1(
    "Meri gehun ki fasal mein peela pan aa raha hai, kya karun?",
    system_prompt="You are Krishi-Mitra, an agriculture advisor for Indian farmers."
))
```

### Airavata (7B) — Hindi-First Tasks

Requires HuggingFace token and license acceptance.

```python
import os
os.environ["HF_TOKEN"] = dbutils.secrets.get(scope="hackathon", key="hf-token")

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_name = "ai4bharat/Airavata"
tokenizer = AutoTokenizer.from_pretrained(model_name, padding_side="left")
tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(
    model_name, torch_dtype=torch.bfloat16, device_map="auto"
)

# Airavata's specific chat format
def ask_airavata(question: str) -> str:
    prompt = f"<|user|>\n{question}\n<|assistant|>\n"
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.inference_mode():
        outputs = model.generate(inputs.input_ids, max_new_tokens=300, do_sample=False)
    full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return full_response.split("<|assistant|>")[-1].strip()

print(ask_airavata("भारत में सबसे अधिक उगाई जाने वाली फसलें कौन सी हैं?"))
```

### IndicTrans2 — Add Translation to Any Pipeline

```python
# Clone and install
# git clone https://github.com/AI4Bharat/IndicTrans2
# cd IndicTrans2 && source install.sh

from inference.engine import Model

trans_model = Model(ckpt_dir="<path>", model_type="fairseq")

# Translate output to any of 22 Indian languages
english_output = ["Apply nitrogen fertilizer at 60 kg per hectare for wheat crop."]
hindi = trans_model.batch_translate(english_output, src_lang="eng_Latn", tgt_lang="hin_Deva")
tamil = trans_model.batch_translate(english_output, src_lang="eng_Latn", tgt_lang="tam_Taml")
telugu = trans_model.batch_translate(english_output, src_lang="eng_Latn", tgt_lang="tel_Telu")
```

---

## Starter Ideas with Implementation Hints

### 1. Agriculture Advisory Bot (Krishi-Mitra)

**Dataset:** Crop production data from [data.gov.in](https://www.data.gov.in/), weather data from IMD
**Stack:** Delta Lake + RAG + Sarvam-M + IndicTrans2

```python
# Ingest crop data
crop_df = spark.read.csv("/Volumes/<catalog>/<schema>/data/crop_production.csv", header=True)
crop_df.write.format("delta").saveAsTable("<catalog>.<schema>.crop_data")

# Build a RAG pipeline over agricultural advisories
# Use Sarvam-M to answer farmer queries in their language
from openai import OpenAI

client = OpenAI(base_url="https://api.sarvam.ai/v1", api_key="<KEY>")

def krishi_mitra(question: str, crop_context: str) -> str:
    response = client.chat.completions.create(
        model="sarvam-m",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Krishi-Mitra, an agricultural advisor for Indian farmers. "
                    "Give practical, actionable advice based on the data provided. "
                    "Use simple language. Respond in the farmer's language."
                ),
            },
            {"role": "user", "content": f"Data:\n{crop_context}\n\nQuestion: {question}"},
        ],
        reasoning_effort="medium",
        max_completion_tokens=4096,
    )
    return response.choices[0].message.content
```

### 2. Healthcare Triage Assistant

**Dataset:** Hospital directory from data.gov.in, disease symptom data from AIKosh
**Stack:** Delta Lake + Classification model + Sarvam-M

```python
# Symptom-based triage + nearest facility finder
def health_triage(symptoms: str, location: str) -> str:
    response = client.chat.completions.create(
        model="sarvam-m",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Swasthya-Sahayak, a health triage assistant. "
                    "Based on symptoms, suggest urgency level (Emergency/Urgent/Routine) "
                    "and recommend the type of specialist. DO NOT diagnose. "
                    "Always advise consulting a doctor. Respond in the user's language."
                ),
            },
            {"role": "user", "content": f"Symptoms: {symptoms}\nLocation: {location}"},
        ],
        reasoning_effort="high",
        max_completion_tokens=4096,
    )
    return response.choices[0].message.content
```

### 3. Education Accessibility Tool

**Dataset:** School statistics from data.gov.in, NCERT textbook content
**Stack:** Delta Lake + RAG + Sarvam-M + IndicTrans2

A multilingual education assistant that explains textbook concepts in regional languages, adapting to the student's grade level.

### 4. Any Creative Idea

Some more inspiration:
- **Disaster response coordinator** using weather + geographic data
- **Government document translator** for rural panchayat offices
- **Accessibility tool** that converts Hindi text to sign language descriptions
- **Cultural heritage chatbot** using archaeological survey data

---

## Building Your UI

Every submission needs a user-facing component. Here are your options on Databricks:

### Option 1: Gradio (Quickest)

```python
%pip install gradio

import gradio as gr

def chat(message, history):
    # Your AI logic here
    return your_ai_function(message)

demo = gr.ChatInterface(
    chat,
    title="Your Bot Name",
    description="Your bot description",
    examples=["Example question 1", "Example question 2"],
)
demo.launch()
```

### Option 2: Streamlit

```python
# Create a streamlit_app.py file
import streamlit as st
from openai import OpenAI

st.title("Your App Name")

client = OpenAI(base_url="https://api.sarvam.ai/v1", api_key="<KEY>")

user_input = st.text_input("Ask a question:")
if user_input:
    response = client.chat.completions.create(
        model="sarvam-m",
        messages=[{"role": "user", "content": user_input}],
        max_completion_tokens=4096,
    )
    st.write(response.choices[0].message.content)
```

### Option 3: Databricks Notebook with Widgets

```python
dbutils.widgets.text("question", "", "Ask your question")
question = dbutils.widgets.get("question")

if question:
    answer = your_ai_function(question)
    displayHTML(f"<h3>Answer</h3><p>{answer}</p>")
```

---

## Mandatory Requirements Recap

| Requirement | What It Means |
|-------------|---------------|
| **Databricks as core** | Delta Lake, Spark, or Lakehouse must be meaningfully used — not just file storage |
| **AI must be central** | AI/ML drives the core value, not a decorative add-on |
| **Prefer Indian models** | Use at least one of: Param-1, Airavata, Sarvam-M, IndicTrans2 (encouraged, not mandatory) |
| **Working demo** | Judges will try to reproduce it. If it doesn't run, it doesn't count |
| **User-facing UI** | Databricks App, notebook with widgets, or Gradio/Streamlit on Databricks |
| **Open-source only** | No proprietary data or models |
| **No pre-coding** | Ideation and dataset review before the event is fine; coding is not |

---

## Tips

- **"Creative platform usage" wins.** Judges want to see Databricks used meaningfully — Delta Lake for versioned data, Spark for processing, MLflow for tracking, Vector Search for RAG. Don't just read a CSV and call an API.
- **Impact > Complexity.** A simple bot that solves a real problem for rural users beats a complex pipeline that doesn't work.
- **Demo reliability matters.** Test your demo end-to-end. Use Databricks Secrets for API keys, Delta Lake for data persistence, and pin your dependencies.
- **Sarvam-M via OpenAI SDK is the fastest path.** No GPU provisioning, no model downloads — just API calls. Save your time for building the actual solution.
