# Track 3: Digital-Artha — Economy & Financial Inclusion

> Secure and democratise financial access. Detect UPI fraud patterns, explain RBI circulars in local languages, or build loan eligibility tools for rural users.

---

## Datasets

### 1. Synthetic UPI Transactions (2024)

**Source:** [Kaggle — UPI Transactions 2024 Dataset](https://www.kaggle.com/datasets/skullagos5246/upi-transactions-2024-dataset)
**License:** CC0: Public Domain
**Format:** CSV inside ZIP (~5.4 MB)
**Time Period:** January — December 2024
**Generation Script:** [Kaggle Notebook](https://www.kaggle.com/code/skullagos5246/upi-transactions-generator)

#### What Is This Data?

A fully synthetic (privacy-safe) dataset that simulates realistic UPI (Unified Payments Interface) transactions in India. It mirrors real-world patterns — bank market shares, device distribution, demographic splits, and spending behavior — based on NPCI, RBI, and market research data. The 0.2% fraud rate is baked in, making it ideal for fraud detection model training.

#### Schema

| Column | Type | Description |
|--------|------|-------------|
| `Transaction ID` | string | Unique identifier for each transaction |
| `Timestamp` | datetime | Date and time of the transaction (Jan–Dec 2024) |
| `Transaction Type` | string | `P2P` (person-to-person), `P2M` (person-to-merchant), `Bill Payment`, or `Recharge` |
| `Merchant Category` | string | One of: `Food`, `Grocery`, `Fuel`, `Entertainment`, `Shopping`, `Healthcare`, `Education`, `Transport`, `Utilities`, `Other` |
| `Amount (INR)` | float | Transaction value in Indian Rupees — ranges vary by category (e.g., Food: smaller, Shopping: larger) |
| `Transaction Status` | string | `SUCCESS` or `FAILED` |
| `Sender Age Group` | string | `18-25`, `26-35`, `36-45`, `46-55`, `56+` |
| `Receiver Age Group` | string | Same buckets as sender |
| `Sender State` | string | Indian state of the sender (distribution mirrors real population) |
| `Sender Bank` | string | Major Indian banks — distribution based on actual market share |
| `Receiver Bank` | string | Same as sender bank, independently distributed |
| `Device Type` | string | `Android`, `iOS`, or `Web` |
| `Network Type` | string | `4G`, `5G`, `WiFi`, or `3G` |
| `Fraud Flag` | int | `0` = legitimate, `1` = fraudulent (base rate: **0.2%**) |
| `Hour of Day` | int | 0–23, derived from Timestamp |
| `Day of Week` | string | Monday–Sunday, derived from Timestamp |
| `Is Weekend` | bool | `True` if Saturday/Sunday |

#### Semantic Understanding

- **Fraud Flag** is your target variable for classification. At 0.2%, this is a highly imbalanced dataset — you'll need techniques like SMOTE, class weighting, or anomaly detection.
- **Transaction Type** matters for fraud patterns: P2P fraud looks different from P2M fraud. P2P scams often involve social engineering; P2M fraud may involve stolen credentials.
- **Amount (INR)** has category-specific distributions with weekend spending boosts — fraudulent transactions often deviate from normal amount patterns within a category.
- **Device Type + Network Type** can be fraud signals — unusual device/network combinations (e.g., Web + 3G) may indicate suspicious activity.
- **Sender/Receiver Bank** combinations can reveal mule account patterns.
- **Hour of Day** is a strong fraud indicator — legitimate transactions peak during business hours; fraud may spike at unusual times.

#### How to Load into Databricks

```python
# Download from Kaggle first:
# kaggle datasets download -d skullagos5246/upi-transactions-2024-dataset

# Upload CSV to a Unity Catalog Volume, then:
upi_df = (
    spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv("/Volumes/<catalog>/<schema>/data/upi_transactions.csv")
)

upi_df.write.format("delta").saveAsTable("<catalog>.<schema>.upi_transactions")

# Quick exploration
display(spark.sql("""
    SELECT
        `Fraud Flag`,
        COUNT(*) AS count,
        ROUND(AVG(`Amount (INR)`), 2) AS avg_amount,
        COUNT(DISTINCT `Sender State`) AS unique_states
    FROM <catalog>.<schema>.upi_transactions
    GROUP BY `Fraud Flag`
"""))
```

### 2. RBI Circulars (Scraped)

**Source:** [RBI Website](https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx)

RBI circulars are official policy documents from the Reserve Bank of India. They cover monetary policy, banking regulations, foreign exchange rules, UPI guidelines, and more. These are dense PDF/HTML documents in English — ripe for a multilingual explainer chatbot.

**How to get the data:**
```python
# Scrape RBI circulars (example — check robots.txt and terms of use)
import requests
from bs4 import BeautifulSoup

# RBI circular listing page
url = "https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx"
# Parse and extract circular links, then download PDFs/HTML content
# Store in Delta Lake with columns: circular_number, date, title, full_text, category
```

### 3. BhashaBench-Finance

**Source:** [HuggingFace — bharatgenai/BhashaBench](https://huggingface.co/bharatgenai) (look for the Finance variant under the BharatGen AI org)
**Reference:** [BhashaBench Paper — arXiv:2510.25409](https://arxiv.org/abs/2510.25409)

A financial domain subset of BhashaBench for evaluating your model's performance on Indian-language financial tasks — QA, summarization, and comprehension in Hindi and English. Use this with MLflow evaluation (same pattern as the [BhashaBench-Legal evaluation guide in Track 1](./track1-nyaya-sahayak.md#evaluating-your-rag-pipeline-with-mlflow--bhashabench-legal)) to benchmark your fraud detection explainer or RBI circular chatbot.

---

## Recommended Indic Models

### Primary: Sarvam-M (Best for This Track)

**Why:** Hybrid reasoning mode is perfect for financial analysis — "think" mode for fraud pattern explanation, "non-think" for quick RBI circular lookups. OpenAI-compatible API makes integration trivial.

**Link:** [huggingface.co/sarvamai/sarvam-m](https://huggingface.co/sarvamai/sarvam-m)
**License:** Apache 2.0

#### Using Sarvam-M via OpenAI SDK

**Step 1: Get an API Key**

1. Go to [dashboard.sarvam.ai](https://dashboard.sarvam.ai/)
2. Sign up and generate an API key
3. In Databricks, store it using Secrets:
   ```python
   # One-time setup (use Databricks CLI)
   # databricks secrets create-scope --scope hackathon
   # databricks secrets put --scope hackathon --key sarvam-api-key

   # In notebook:
   api_key = dbutils.secrets.get(scope="hackathon", key="sarvam-api-key")
   ```

**Step 2: Use the Model**

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.sarvam.ai/v1",
    api_key=api_key,
)

# Financial explainer example
response = client.chat.completions.create(
    model="sarvam-m",
    messages=[
        {
            "role": "system",
            "content": (
                "You are Digital-Artha, a financial literacy assistant for India. "
                "Explain RBI policies, UPI rules, and financial concepts in simple language. "
                "Respond in the same language the user asks in."
            ),
        },
        {
            "role": "user",
            "content": "UPI mein fraud ho gaya hai, kya karna chahiye? RBI ka kya rule hai?",
        },
    ],
    reasoning_effort="high",  # Use high for complex financial reasoning
    max_completion_tokens=4096,
)

print(response.choices[0].message.content)
```

### Secondary: Airavata (7B) — Hindi Financial Q&A

**Why:** Strong Hindi instruction-following. Good for Hindi-specific financial explainers.

**Link:** [huggingface.co/ai4bharat/Airavata](https://huggingface.co/ai4bharat/Airavata)
**License:** Llama 2 License
**Base:** OpenHathi-7B

> **Note:** Airavata requires accepting terms on HuggingFace before download. You'll need a HuggingFace account and token.

```python
# Get a HuggingFace token:
# 1. Go to huggingface.co → Settings → Access Tokens
# 2. Create a token with "read" permission
# 3. Accept the model license at huggingface.co/ai4bharat/Airavata

# Set token in environment
import os
os.environ["HF_TOKEN"] = "<your_hf_token>"  # or use dbutils.secrets

from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
model_name = "ai4bharat/Airavata"

tokenizer = AutoTokenizer.from_pretrained(model_name, padding_side="left")
tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(
    model_name, torch_dtype=torch.bfloat16
).to(device)

# Airavata uses a specific chat format
prompt = """<|user|>
UPI fraud hone par kya karna chahiye? Step by step batao.
<|assistant|>
"""

inputs = tokenizer(prompt, return_tensors="pt").to(device)
with torch.inference_mode():
    outputs = model.generate(inputs.input_ids, max_new_tokens=300, do_sample=False)

response = tokenizer.decode(outputs[0], skip_special_tokens=True)
# Extract only the assistant's response
print(response.split("<|assistant|>")[-1].strip())
```

### Translation: IndicTrans2

Translate RBI circulars and financial content into 22 Indian languages.

```python
from inference.engine import Model

model = Model(ckpt_dir="<path>", model_type="fairseq")

rbi_text = ["The Reserve Bank has decided to keep the policy repo rate unchanged at 6.50 per cent."]
hindi = model.batch_translate(rbi_text, src_lang="eng_Latn", tgt_lang="hin_Deva")
print(hindi)  # RBI circular explained in Hindi
```

---

## Implementation Blueprint

### Option A: UPI Fraud Detection Pipeline

```
UPI Transactions CSV
        │
        ▼
  ┌──────────────────┐
  │  Delta Lake       │  Ingest, clean, store as Delta table
  └───────┬──────────┘
          ▼
  ┌──────────────────┐
  │  Feature Eng.     │  Hour, amount z-score, device+network combos,
  │  (PySpark)        │  sender-receiver patterns, velocity features
  └───────┬──────────┘
          ▼
  ┌──────────────────┐
  │  Spark MLlib      │  Random Forest / GBT classifier
  │  (Imbalanced)     │  Class weighting for 0.2% fraud rate
  └───────┬──────────┘
          ▼
  ┌──────────────────┐
  │  MLflow           │  Log model, confusion matrix, PR-AUC
  └───────┬──────────┘
          ▼
  ┌──────────────────┐
  │  Sarvam-M         │  Explain WHY a transaction was flagged
  └───────┬──────────┘
          ▼
  ┌──────────────────┐
  │  Dashboard        │  Gradio app: input transaction → fraud score + explanation
  └──────────────────┘
```

#### Step-by-Step: Fraud Detection with Spark MLlib

```python
from pyspark.sql.functions import col, when, hour, dayofweek, avg, stddev
from pyspark.ml.feature import VectorAssembler, StringIndexer
from pyspark.ml.classification import GBTClassifier
from pyspark.ml import Pipeline
import mlflow

# Load data
upi = spark.table("<catalog>.<schema>.upi_transactions")

# Feature engineering
upi_featured = (
    upi
    .withColumn("hour", hour("Timestamp"))
    .withColumn("dow", dayofweek("Timestamp"))
    .withColumn("is_weekend", col("Is Weekend").cast("int"))
    .withColumn("is_failed", when(col("Transaction Status") == "FAILED", 1).otherwise(0))
)

# Index categorical columns
type_idx = StringIndexer(inputCol="Transaction Type", outputCol="type_idx")
cat_idx = StringIndexer(inputCol="Merchant Category", outputCol="cat_idx")
device_idx = StringIndexer(inputCol="Device Type", outputCol="device_idx")
network_idx = StringIndexer(inputCol="Network Type", outputCol="network_idx")

assembler = VectorAssembler(
    inputCols=["hour", "dow", "is_weekend", "Amount (INR)", "is_failed",
               "type_idx", "cat_idx", "device_idx", "network_idx"],
    outputCol="features",
)

# GBT with class weighting for imbalanced data
gbt = GBTClassifier(
    featuresCol="features",
    labelCol="Fraud Flag",
    maxIter=100,
    maxDepth=5,
)

pipeline = Pipeline(stages=[type_idx, cat_idx, device_idx, network_idx, assembler, gbt])

# Split and train
train, test = upi_featured.randomSplit([0.8, 0.2], seed=42)

with mlflow.start_run(run_name="digital-artha-fraud-model"):
    model = pipeline.fit(train)
    predictions = model.transform(test)

    from pyspark.ml.evaluation import BinaryClassificationEvaluator
    evaluator = BinaryClassificationEvaluator(
        labelCol="Fraud Flag", metricName="areaUnderPR"
    )
    pr_auc = evaluator.evaluate(predictions)

    mlflow.log_metric("PR-AUC", pr_auc)
    mlflow.spark.log_model(model, "fraud_model")
    print(f"PR-AUC: {pr_auc}")
```

#### Adding AI Explainability with Sarvam-M

```python
from openai import OpenAI

client = OpenAI(base_url="https://api.sarvam.ai/v1", api_key="<KEY>")

def explain_fraud_flag(transaction: dict, fraud_score: float) -> str:
    """Use Sarvam-M to explain why a transaction was flagged."""
    txn_summary = (
        f"Transaction: {transaction['Transaction Type']}, "
        f"Amount: ₹{transaction['Amount (INR)']}, "
        f"Category: {transaction['Merchant Category']}, "
        f"Time: {transaction['Hour of Day']}:00, "
        f"Device: {transaction['Device Type']}, "
        f"Network: {transaction['Network Type']}, "
        f"Fraud Score: {fraud_score:.2%}"
    )

    response = client.chat.completions.create(
        model="sarvam-m",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a fraud analyst. Given a UPI transaction and its fraud score, "
                    "explain in simple Hindi why this transaction might be suspicious. "
                    "Be specific about which factors are unusual."
                ),
            },
            {"role": "user", "content": txn_summary},
        ],
        reasoning_effort="high",
        max_completion_tokens=2048,
    )
    return response.choices[0].message.content
```

### Option B: RBI Circular Explainer (RAG + Multilingual)

```python
from openai import OpenAI

client = OpenAI(base_url="https://api.sarvam.ai/v1", api_key="<KEY>")

def explain_rbi_circular(question: str, circular_chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(circular_chunks)
    response = client.chat.completions.create(
        model="sarvam-m",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Digital-Artha, a financial literacy assistant. "
                    "Explain RBI circulars in simple language that a rural user can understand. "
                    "Use analogies and examples. Respond in the user's language."
                ),
            },
            {
                "role": "user",
                "content": f"RBI Circular Context:\n{context}\n\nQuestion: {question}",
            },
        ],
        reasoning_effort="medium",
        max_completion_tokens=4096,
    )
    return response.choices[0].message.content
```

### Option C: Loan Eligibility Tool

```python
# Simple rule-based + AI explanation pipeline
def check_loan_eligibility(user_profile: dict) -> str:
    """Check loan eligibility and explain in user's language."""
    profile_text = "\n".join(f"{k}: {v}" for k, v in user_profile.items())

    response = client.chat.completions.create(
        model="sarvam-m",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a loan eligibility advisor. Based on the user's profile "
                    "and RBI/government guidelines, assess their eligibility for: "
                    "1) Mudra Loan, 2) PM SVANidhi, 3) KCC (Kisan Credit Card). "
                    "Explain in simple Hindi what they qualify for and how to apply."
                ),
            },
            {"role": "user", "content": f"User Profile:\n{profile_text}"},
        ],
        reasoning_effort="medium",
        max_completion_tokens=4096,
    )
    return response.choices[0].message.content

# Example
eligibility = check_loan_eligibility({
    "name": "Ramesh Kumar",
    "occupation": "Street food vendor",
    "monthly_income": "₹15,000",
    "location": "Rural Uttar Pradesh",
    "bank_account": "Yes (Jan Dhan)",
    "existing_loans": "None",
})
print(eligibility)
```

---

## Starter Ideas

| Idea | Complexity | Key Components |
|------|-----------|----------------|
| **UPI Fraud Detection Pipeline** | High | Spark MLlib + Delta Lake + MLflow + Sarvam-M explainer |
| **RBI Circular Explainer** | Medium | RAG + web scraping + Sarvam-M + IndicTrans2 |
| **Loan Eligibility Tool** | Low-Med | Rule engine + Sarvam-M for explanation + Gradio UI |
| **Financial Literacy Chatbot** | Medium | RAG over RBI docs + Sarvam-M + multilingual |

---

## Tips

- **Imbalanced data:** The UPI dataset has only 0.2% fraud. Use PR-AUC (not accuracy) as your evaluation metric. Consider SMOTE or class weights in your classifier.
- **Feature engineering matters:** Velocity features (transactions per hour by sender), amount deviation from category mean, and device-network combination rarity are strong fraud signals.
- **RBI scraping:** Be respectful of rate limits. Cache the circulars in Delta Lake after scraping once.
- **Databricks Free Edition:** Use `dbutils.secrets` for API keys. Spark MLlib runs natively. Use Delta Lake for all storage.
- **Evaluation:** Use BhashaBench-Finance to benchmark your model's financial comprehension in Indian languages.
