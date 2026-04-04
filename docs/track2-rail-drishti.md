# Track 2: Rail-Drishti — Critical Infrastructure & Logistics

> Add intelligence to India's transport backbone: Rail, Metro, or Bus. Predict train delays, build a passenger rulebook bot, or design route optimisation dashboards using open data.

---

## Datasets

### 1. Indian Railways Dataset

**Source:** [Kaggle — Indian Railways Dataset](https://www.kaggle.com/datasets/sripaadsrinivasan/indian-railways-dataset)
**License:** CC0: Public Domain
**Format:** ZIP containing 3 JSON files (GeoJSON) — ~17.2 MB
**Original Source:** [DataMeet GitHub](https://github.com/datameet/)

#### What Is This Data?

A comprehensive geospatial dataset of the Indian railway network — one of the largest in the world. It includes station locations, train routes with schedules, and detailed stop-level timing data. The GeoJSON format means every station and route has geographic coordinates, enabling map visualizations and spatial queries.

#### Schema: Three JSON Files

##### File 1: `stations.json` — Railway Stations (GeoJSON FeatureCollection)

Each feature is a railway station with its geographic location and metadata.

| Field | Type | Description |
|-------|------|-------------|
| `geometry.type` | string | Always `"Point"` |
| `geometry.coordinates` | [float, float] | `[longitude, latitude]` of the station |
| `properties.name` | string | Station name (e.g., "Badhal", "New Delhi") |
| `properties.code` | string | Station code (e.g., "NDLS" for New Delhi) — the unique identifier used in train schedules |
| `properties.state` | string | Indian state (e.g., "Rajasthan", "Delhi") |
| `properties.zone` | string | Railway zone (e.g., "NWR" = North Western Railway, "CR" = Central Railway) |
| `properties.address` | string | Full address of the station |

**Semantic Notes:**
- `code` is the join key — it links stations to trains and schedules.
- `zone` represents Indian Railways' administrative divisions (17 zones total). Useful for regional analysis.
- Coordinates enable distance calculations, map rendering, and spatial clustering.

##### File 2: `trains.json` — Train Routes (GeoJSON FeatureCollection)

Each feature is a train with its full route geometry and operational details.

| Field | Type | Description |
|-------|------|-------------|
| `geometry.type` | string | `"LineString"` — the route path |
| `geometry.coordinates` | [[float, float], ...] | Array of `[lon, lat]` points tracing the route |
| `properties.number` | string | Train number (e.g., "01101") — unique identifier |
| `properties.name` | string | Train name (e.g., "Mumbai LTT - Gwalior Special") |
| `properties.type` | string | Train type: `"Exp"` (Express), `"Raj"` (Rajdhani), `"SF"` (Superfast), etc. |
| `properties.from_station_code` | string | Origin station code |
| `properties.from_station_name` | string | Origin station name |
| `properties.to_station_code` | string | Destination station code |
| `properties.to_station_name` | string | Destination station name |
| `properties.departure` | string | Departure time (HH:MM:SS) |
| `properties.arrival` | string | Arrival time (HH:MM:SS) |
| `properties.distance` | int | Total distance in kilometers |
| `properties.duration_h` | int | Journey duration — hours |
| `properties.duration_m` | int | Journey duration — minutes |
| `properties.zone` | string | Operating railway zone |
| `properties.return_train` | string | Return train number (e.g., "01102") |
| `properties.first_ac` | bool | Has First AC class? |
| `properties.second_ac` | bool | Has Second AC class? |
| `properties.third_ac` | bool | Has Third AC class? |
| `properties.sleeper` | bool | Has Sleeper class? |
| `properties.chair_car` | bool | Has Chair Car class? |
| `properties.first_class` | bool | Has First Class? |

**Semantic Notes:**
- `distance` + `duration_h/m` lets you calculate average speed — useful for detecting slow/delayed routes.
- Boolean class fields let you filter trains by amenity level (e.g., "all Rajdhani trains with First AC").
- `return_train` links outbound/inbound journeys for round-trip analysis.

##### File 3: `schedules.json` — Stop-Level Timing (Array of Objects)

Each entry is one stop of one train — the most granular data.

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Unique schedule entry ID |
| `train_number` | string | Train number (join key to `trains.json`) |
| `train_name` | string | Train name |
| `station_code` | string | Station code (join key to `stations.json`) |
| `station_name` | string | Station name |
| `arrival` | string | Arrival time at this stop (HH:MM:SS or `"None"` for origin) |
| `departure` | string | Departure time from this stop (HH:MM:SS or `"None"` for terminus) |
| `day` | int | Day number (1 = first day, 2 = second day, etc.) — for multi-day journeys |

**Semantic Notes:**
- `arrival = "None"` means this is the **origin station** (train starts here).
- `departure = "None"` means this is the **terminus** (train ends here).
- `day` is critical for long-distance trains that span multiple days. A `day=2` arrival of `"03:00:00"` means 3 AM on the second day.
- The difference between `arrival` and `departure` at a station = **halt time** (dwell time).
- Ordering entries by `train_number` + `day` + `departure` gives you the full station-by-station itinerary.

#### How to Load into Databricks

```python
import json

# Upload the JSON files to a Unity Catalog Volume first, then:

# Load stations
stations_df = spark.read.json("/Volumes/<catalog>/<schema>/railways/stations.json")
# GeoJSON needs flattening — extract properties
from pyspark.sql.functions import col, explode

stations_raw = spark.read.option("multiline", True).json(
    "/Volumes/<catalog>/<schema>/railways/stations.json"
)

# For GeoJSON, you may need to parse manually:
import json

with open("/Volumes/<catalog>/<schema>/railways/stations.json") as f:
    data = json.load(f)

stations = []
for feature in data["features"]:
    row = feature["properties"].copy()
    row["longitude"] = feature["geometry"]["coordinates"][0]
    row["latitude"] = feature["geometry"]["coordinates"][1]
    stations.append(row)

stations_df = spark.createDataFrame(stations)
stations_df.write.format("delta").saveAsTable("<catalog>.<schema>.railway_stations")

# Similarly for trains and schedules
with open("/Volumes/<catalog>/<schema>/railways/trains.json") as f:
    trains_data = json.load(f)

trains = []
for feature in trains_data["features"]:
    row = feature["properties"].copy()
    trains.append(row)

trains_df = spark.createDataFrame(trains)
trains_df.write.format("delta").saveAsTable("<catalog>.<schema>.railway_trains")

# Schedules (simpler — just an array of objects)
schedules_df = spark.read.option("multiline", True).json(
    "/Volumes/<catalog>/<schema>/railways/schedules.json"
)
schedules_df.write.format("delta").saveAsTable("<catalog>.<schema>.railway_schedules")
```

### 2. Railways Running History (data.gov.in)

**Source:** [data.gov.in](https://www.data.gov.in/) — search for "Indian Railways" or "train running status"

This is historical delay/punctuality data from Indian Railways. Use this for time-series forecasting of delays. Download CSVs from data.gov.in and load into Delta Lake.

### 3. Railway General Rules PDF

The Indian Railway General Rules document governs passenger rights, luggage rules, ticket policies, and safety regulations. Available as a PDF from Indian Railways' website. Parse with `PyMuPDF` or `pdfplumber` for a passenger rights chatbot.

### 4. Air Quality / Weather Data

**Source:** [data.gov.in](https://www.data.gov.in/) or [OpenWeatherMap API](https://openweathermap.org/api)

Weather impacts train operations significantly (fog delays in North India, monsoon flooding). Correlate weather data with delay patterns for better predictions.

---

## Recommended Indic Models

### Primary: Sarvam-M (for Chatbot / NL Interfaces)

If you're building a **passenger rights chatbot** or **natural language query interface** for railways data, use Sarvam-M via the OpenAI-compatible API.

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.sarvam.ai/v1",
    api_key="<YOUR_SARVAM_API_KEY>",
)

response = client.chat.completions.create(
    model="sarvam-m",
    messages=[
        {
            "role": "system",
            "content": (
                "You are Rail-Drishti, an Indian Railways assistant. "
                "Answer questions about train schedules, routes, rules, and delays. "
                "Use the provided data context to give accurate answers. "
                "Respond in the language the user asks in."
            ),
        },
        {
            "role": "user",
            "content": "Delhi se Mumbai tak fastest train kaun si hai aur kitna time lagta hai?",
        },
    ],
    reasoning_effort="medium",
    max_completion_tokens=4096,
)

print(response.choices[0].message.content)
```

### Secondary: Param-1 (2.9B) — For On-Cluster Inference

If you want to run the model directly on Databricks without external API calls:

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_name = "bharatgenai/Param-1-2.9B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, device_map="auto")

conversation = [
    {"role": "system", "content": "You are a helpful Indian Railways assistant."},
    {"role": "user", "content": "What are the luggage rules for Rajdhani Express?"},
]

inputs = tokenizer.apply_chat_template(conversation, return_tensors="pt", add_generation_prompt=True)
inputs = inputs.to(model.device)

with torch.no_grad():
    output = model.generate(inputs, max_new_tokens=300, temperature=0.6, top_p=0.95)

print(tokenizer.decode(output[0][inputs.shape[-1]:], skip_special_tokens=True))
```

### Translation: IndicTrans2

For multilingual interfaces — translate train information into regional languages.

```python
from inference.engine import Model

model = Model(ckpt_dir="<path>", model_type="fairseq")

# Translate train info to Tamil
english_text = ["The Rajdhani Express departs from New Delhi at 16:55 and arrives in Mumbai at 08:35."]
tamil = model.batch_translate(english_text, src_lang="eng_Latn", tgt_lang="tam_Taml")
print(tamil)
```

---

## Implementation Blueprint

### Option A: Train Delay Predictor (Time-Series + ML)

```
Historical Running Data (data.gov.in)
        │
        ▼
  ┌──────────────────┐
  │  Spark / Delta    │  Clean, join with weather, store in Delta
  └───────┬──────────┘
          ▼
  ┌──────────────────┐
  │  Feature Eng.     │  Hour, day-of-week, season, route, train type
  └───────┬──────────┘
          ▼
  ┌──────────────────┐
  │  Spark MLlib      │  Random Forest / GBT for delay prediction
  └───────┬──────────┘
          ▼
  ┌──────────────────┐
  │  MLflow           │  Log model, metrics, register
  └───────┬──────────┘
          ▼
  ┌──────────────────┐
  │  Dashboard / App  │  Gradio or Databricks App showing predictions
  └──────────────────┘
```

#### Step-by-Step: Delay Prediction with Spark MLlib

```python
from pyspark.ml.feature import VectorAssembler, StringIndexer
from pyspark.ml.regression import GBTRegressor
from pyspark.ml import Pipeline
import mlflow

# Load schedules + historical delay data
schedules = spark.table("<catalog>.<schema>.railway_schedules")

# Feature engineering
# (Assuming you have historical data with actual vs scheduled times)
from pyspark.sql.functions import hour, dayofweek, month

featured = (
    schedules
    .withColumn("hour", hour("departure"))
    .withColumn("day_of_week", dayofweek("departure"))
)

# Index categorical columns
zone_indexer = StringIndexer(inputCol="zone", outputCol="zone_idx")
assembler = VectorAssembler(
    inputCols=["hour", "day_of_week", "zone_idx", "distance"],
    outputCol="features",
)
gbt = GBTRegressor(featuresCol="features", labelCol="delay_minutes", maxIter=50)

pipeline = Pipeline(stages=[zone_indexer, assembler, gbt])

# Train with MLflow tracking
with mlflow.start_run(run_name="rail-drishti-delay-model"):
    model = pipeline.fit(train_data)
    predictions = model.transform(test_data)

    from pyspark.ml.evaluation import RegressionEvaluator
    evaluator = RegressionEvaluator(labelCol="delay_minutes", metricName="rmse")
    rmse = evaluator.evaluate(predictions)

    mlflow.log_metric("rmse", rmse)
    mlflow.spark.log_model(model, "delay_model")
    print(f"RMSE: {rmse}")
```

### Option B: Passenger Rights Chatbot (RAG)

```python
# 1. Parse Railway General Rules PDF into chunks
import pdfplumber

with pdfplumber.open("railway_general_rules.pdf") as pdf:
    chunks = []
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            chunks.append({"page": i + 1, "text": text})

# 2. Store in Delta and create Vector Search index
chunks_df = spark.createDataFrame(chunks)
chunks_df.write.format("delta").saveAsTable("<catalog>.<schema>.railway_rules")

# 3. RAG query using Sarvam-M
from openai import OpenAI

client = OpenAI(base_url="https://api.sarvam.ai/v1", api_key="<KEY>")

def ask_rail_drishti(question: str, context_chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(context_chunks)
    response = client.chat.completions.create(
        model="sarvam-m",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Rail-Drishti, an Indian Railways assistant. "
                    "Answer based ONLY on the provided railway rules. Cite page numbers."
                ),
            },
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
        max_completion_tokens=4096,
    )
    return response.choices[0].message.content
```

### Option C: Route Optimisation Dashboard

```python
# Use the trains + stations GeoJSON data for route visualization
# Combine with Spark SQL for analytics

# Top 10 longest routes
spark.sql("""
    SELECT name, from_station_name, to_station_name, distance, duration_h, duration_m,
           ROUND(distance / (duration_h + duration_m/60.0), 1) AS avg_speed_kmph
    FROM <catalog>.<schema>.railway_trains
    ORDER BY distance DESC
    LIMIT 10
""").display()

# Station connectivity analysis
spark.sql("""
    SELECT station_name, station_code, COUNT(DISTINCT train_number) AS num_trains
    FROM <catalog>.<schema>.railway_schedules
    GROUP BY station_name, station_code
    ORDER BY num_trains DESC
    LIMIT 20
""").display()
```

---

## Starter Ideas

| Idea | Complexity | Key Components |
|------|-----------|----------------|
| **Train Delay Predictor** | High | Spark MLlib + time-series + weather data + MLflow |
| **Passenger Rights Chatbot** | Medium | RAG + PDF parsing + Sarvam-M + Vector Search |
| **Route Optimisation Dashboard** | Medium | GeoJSON + Spark SQL + Gradio/Plotly maps |
| **Station Connectivity Analyzer** | Low-Med | Graph analysis on schedules data + visualization |

---

## Tips

- **GeoJSON parsing:** PySpark doesn't natively handle GeoJSON well. Parse to flat DataFrames using Python `json` module first, then convert to Spark DataFrames.
- **Join keys:** `station_code` links stations ↔ schedules. `train_number` links trains ↔ schedules. Always join on these.
- **Delta Lake advantage:** Version your data loads — if you re-ingest updated schedules, Delta's time travel lets you compare.
- **Map visualizations:** Use `folium` or `plotly` with the coordinate data for interactive maps in Gradio/Databricks notebooks.
