# 📊 Sales Analytics Service

**Module 3** – Standalone Python/Flask microservice that accepts CSV uploads and generates interactive sales charts.

## Tech Stack
- **Python** · **Flask** · **Pandas** · **Plotly** · **Kaleido**

## Setup

```bash
# Navigate to this directory
cd analytics-service

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python app.py
```

Server runs on **http://localhost:5001**

## API

### `POST /analyze`

Upload a CSV file and receive charts + summary statistics.

**Request:** `multipart/form-data` with field `file`

**Required CSV columns:**
| Column | Type | Example |
|--------|------|---------|
| `salesperson` | string | `Alice Johnson` |
| `revenue` | number | `45000` |
| `region` | string | `East` |

**Example CSV:**
```csv
salesperson,revenue,region
Alice Johnson,45000,East
Bob Smith,38000,West
Carol Williams,52000,North
```

**Response:**
```json
{
  "success": true,
  "export_format": "png",
  "charts": {
    "revenue_by_region": { "png": "<base64>" },
    "top_salespeople": { "png": "<base64>" }
  },
  "summary": {
    "total_revenue": 135000,
    "top_region": "North",
    "top_salesperson": "Carol Williams",
    ...
  }
}
```

### `GET /health`
Returns service status.

## Bonus: PNG Export
Charts are exported as high-resolution PNG files using **Kaleido**. If Kaleido is not installed, the response will include Plotly JSON instead.
