import io
import base64
import os

import pandas as pd
import plotly.graph_objects as go
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv("PORT", 5001))

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

REQUIRED_COLUMNS = {"salesperson", "revenue", "region"}

PLOTLY_LAYOUT = dict(
    paper_bgcolor="#ffffff",
    plot_bgcolor="#ffffff",
    font=dict(family="Inter, system-ui, -apple-system, sans-serif", color="#1e293b", size=12),
    margin=dict(l=60, r=130, t=60, b=50),
    hoverlabel=dict(bgcolor="#ffffff", font_size=13, font_family="Inter, sans-serif"),
)


def fig_to_base64(fig: go.Figure) -> str:
    """Export a Plotly figure to a base64-encoded PNG string (requires kaleido)."""
    img_bytes = fig.to_image(format="png", width=1000, height=520, scale=2)
    return base64.b64encode(img_bytes).decode("utf-8")


def parse_dataframe(file_storage) -> pd.DataFrame:
    """
    Parses either CSV or Excel file into a clean DataFrame.
    Automatically detects header row if title banner rows are present.
    """
    filename = file_storage.filename.lower()
    content = file_storage.read()

    if filename.endswith(".csv"):
        # Try default parse first
        df = pd.read_csv(io.BytesIO(content))
        # Check if required columns are present; if not, search first 10 rows for headers
        cols_lower = [str(c).strip().lower() for c in df.columns]
        if not REQUIRED_COLUMNS.issubset(set(cols_lower)):
            # Search for header row
            df_raw = pd.read_csv(io.BytesIO(content), header=None)
            for idx, row in df_raw.head(10).iterrows():
                row_vals = [str(v).strip().lower() for v in row.values]
                if REQUIRED_COLUMNS.issubset(set(row_vals)):
                    df = pd.read_csv(io.BytesIO(content), skiprows=idx)
                    break
    elif filename.endswith((".xlsx", ".xls")):
        # Read excel without header first to locate header row
        df_raw = pd.read_excel(io.BytesIO(content), header=None)
        header_row_idx = 0
        found_header = False
        for idx, row in df_raw.head(10).iterrows():
            row_vals = [str(v).strip().lower() for v in row.values if pd.notna(v)]
            if REQUIRED_COLUMNS.issubset(set(row_vals)):
                header_row_idx = idx
                found_header = True
                break
        
        if found_header:
            df = pd.read_excel(io.BytesIO(content), skiprows=header_row_idx)
        else:
            df = pd.read_excel(io.BytesIO(content))
    else:
        raise ValueError("Unsupported file format. Please upload a .csv or .xlsx file.")

    return df


# ─────────────────────────────────────────────────────────────────────────────
# Health & Sample routes
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def index():
    return jsonify({"message": "📊 Sales Analytics Service is running!", "port": PORT})


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "analytics"})


@app.get("/sample-excel")
def sample_excel():
    excel_path = os.path.join(os.path.dirname(__file__), "sample_sales_data.xlsx")
    if os.path.exists(excel_path):
        return send_file(
            excel_path,
            as_attachment=True,
            download_name="sample_sales_data.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    return jsonify({"error": "Sample excel file not found."}), 404


@app.get("/sample-csv")
def sample_csv():
    csv_content = """salesperson,revenue,region
Alice Johnson,87400,East
Bob Smith,62300,West
Carol Williams,95750,North
David Brown,43200,South
Emma Davis,112600,East
Frank Miller,38900,West
Grace Wilson,71400,North
Henry Moore,88500,East
Isabella Taylor,55200,South
James Anderson,79800,West
Karen Thomas,91100,North
Liam Jackson,47300,South
Mia White,103700,East
Noah Harris,66400,West
Olivia Martin,84200,North
Paul Thompson,52800,South
Quinn Garcia,73600,East
Rachel Martinez,69900,West
Samuel Robinson,96300,North
Tina Clark,41500,South
Uma Lewis,58700,East
Victor Lee,77200,West
Wendy Walker,89400,North
Xander Hall,34600,South
Yara Allen,61800,East
Zach Young,48900,West
Anna Hernandez,82100,North
Brian King,55400,South
Chloe Wright,94600,East
Daniel Scott,70300,West"""
    return (
        csv_content,
        200,
        {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=sample_sales_data.csv",
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /analyze
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/analyze")
def analyze():
    # ── 1. Validate file upload ───────────────────────────────────────────────
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded. Send a CSV or Excel file as 'file'."}), 400

    file = request.files["file"]
    filename = file.filename.lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx") or filename.endswith(".xls")):
        return jsonify({"success": False, "error": "Only CSV and Excel (.xlsx, .xls) files are supported."}), 400

    # ── 2. Parse File ─────────────────────────────────────────────────────────
    try:
        df = parse_dataframe(file)
    except Exception as exc:
        return jsonify({"success": False, "error": f"Could not parse file: {str(exc)}"}), 422

    # Normalise column names
    df.columns = [str(c).strip().lower() for c in df.columns]

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required columns: {', '.join(missing)}. "
                     f"Expected columns: salesperson, revenue, region"
        }), 422

    # Clean data
    df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce")
    df.dropna(subset=["revenue"], inplace=True)
    df["region"] = df["region"].astype(str).str.strip()
    df["salesperson"] = df["salesperson"].astype(str).str.strip()

    # Filter out summary / totals rows (e.g. rows where salesperson is 'TOTAL' or 'SUM')
    df = df[~df["salesperson"].str.upper().isin(["TOTAL", "SUM", "TOTALS", "AVERAGE", "COUNT"])]
    # Filter out blank / nan strings
    df = df[~df["salesperson"].str.lower().isin(["nan", "none", ""])]
    df = df[~df["region"].str.lower().isin(["nan", "none", ""])]

    if df.empty:
        return jsonify({"success": False, "error": "No valid numeric data rows found in file."}), 422

    total_revenue = float(df["revenue"].sum())
    if total_revenue <= 0:
        return jsonify({"success": False, "error": "Total revenue must be greater than zero."}), 422

    # ── 3. Aggregations ───────────────────────────────────────────────────────
    region_agg = (
        df.groupby("region", as_index=False)
        .agg(total_revenue=("revenue", "sum"), salespeople_count=("salesperson", "nunique"))
        .sort_values("total_revenue", ascending=False)
    )
    region_agg["percentage"] = (region_agg["total_revenue"] / total_revenue * 100).round(1)
    region_agg["avg_revenue"] = (region_agg["total_revenue"] / region_agg["salespeople_count"]).round(2)

    # Salespeople aggregation (in case one person has multiple rows)
    # Also find top region for each salesperson
    sales_agg = (
        df.groupby("salesperson", as_index=False)
        .agg(total_revenue=("revenue", "sum"), records=("revenue", "count"))
        .sort_values("total_revenue", ascending=False)
    )
    # Find predominant region for each salesperson
    person_region = df.groupby(["salesperson", "region"])["revenue"].sum().reset_index()
    person_region = person_region.sort_values("revenue", ascending=False).drop_duplicates(subset=["salesperson"])
    sales_agg = sales_agg.merge(person_region[["salesperson", "region"]], on="salesperson", how="left")
    sales_agg["region"] = sales_agg["region"].fillna("General")
    sales_agg["percentage"] = (sales_agg["total_revenue"] / total_revenue * 100).round(1)
    sales_agg["rank"] = range(1, len(sales_agg) + 1)

    top_sales = sales_agg.head(10)

    # ── 4. Chart 1 – Revenue by Region ────────────────────────────────────────
    region_colors = [
        "#2563eb", "#3b82f6", "#10b981", "#f59e0b",
        "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1",
    ]
    fig_region = go.Figure()
    fig_region.add_trace(go.Bar(
        x=region_agg["region"],
        y=region_agg["total_revenue"],
        marker=dict(
            color=region_colors[:len(region_agg)],
            line=dict(color="#ffffff", width=1.5),
            cornerradius=6,
        ),
        text=[f"${v:,.0f}" for v in region_agg["total_revenue"]],
        textposition="outside",
        cliponaxis=False,
        hovertemplate="<b>%{x}</b><br>Revenue: $%{y:,.0f}<extra></extra>",
    ))
    fig_region.update_layout(
        **PLOTLY_LAYOUT,
        title=dict(text="💰 Revenue by Region", font=dict(size=18, weight=700, color="#0f172a"), x=0.5),
        xaxis=dict(showgrid=False, zeroline=False, tickfont=dict(size=12, weight=600, color="#334155")),
        yaxis=dict(showgrid=True, gridcolor="#f1f5f9", zeroline=False,
                   tickprefix="$", tickformat=",.0f", tickfont=dict(size=11, color="#64748b")),
    )

    # ── 5. Chart 2 – Top Salespeople (horizontal bar) ─────────────────────────
    sales_colors = [
        "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa",
        "#38bdf8", "#818cf8", "#a78bfa", "#c084fc", "#e879f9"
    ][:len(top_sales)]

    fig_sales = go.Figure()
    fig_sales.add_trace(go.Bar(
        x=top_sales["total_revenue"],
        y=top_sales["salesperson"],
        orientation="h",
        marker=dict(
            color=sales_colors,
            line=dict(color="#ffffff", width=1.5),
            cornerradius=6,
        ),
        text=[f"${v:,.0f}" for v in top_sales["total_revenue"]],
        textposition="outside",
        cliponaxis=False,
        hovertemplate="<b>%{y}</b><br>Revenue: $%{x:,.0f}<extra></extra>",
    ))

    max_rev = top_sales["total_revenue"].max() if not top_sales.empty else 100000
    fig_sales.update_layout(
        **PLOTLY_LAYOUT,
        title=dict(text="🏆 Top Salespeople", font=dict(size=18, weight=700, color="#0f172a"), x=0.5),
        xaxis=dict(
            showgrid=True,
            gridcolor="#f1f5f9",
            zeroline=False,
            tickprefix="$",
            tickformat=",.0f",
            range=[0, max_rev * 1.3],
            tickfont=dict(size=11, color="#64748b"),
        ),
        yaxis=dict(showgrid=False, zeroline=False, autorange="reversed", tickfont=dict(size=12, weight=600, color="#334155")),
        height=max(420, len(top_sales) * 52),
    )

    # ── 6. Export charts to PNG (Kaleido) ────────────────────────────────────
    chart_region_png = None
    chart_sales_png = None
    try:
        chart_region_png = fig_to_base64(fig_region)
        chart_sales_png = fig_to_base64(fig_sales)
        export_format = "png"
    except Exception:
        export_format = "json"

    # ── 7. Summary statistics ─────────────────────────────────────────────────
    revenue_by_region_list = region_agg.to_dict(orient="records")
    top_salespeople_list = top_sales.to_dict(orient="records")
    all_salespeople_list = sales_agg.to_dict(orient="records")

    summary = {
        "total_revenue": total_revenue,
        "total_records": int(len(df)),
        "total_regions": int(df["region"].nunique()),
        "total_salespeople": int(sales_agg["salesperson"].nunique()),
        "avg_revenue_per_salesperson": float(sales_agg["total_revenue"].mean()),
        "median_revenue_per_salesperson": float(sales_agg["total_revenue"].median()),
        "top_region": str(region_agg.iloc[0]["region"]),
        "top_region_revenue": float(region_agg.iloc[0]["total_revenue"]),
        "top_region_percentage": float(region_agg.iloc[0]["percentage"]),
        "top_salesperson": str(top_sales.iloc[0]["salesperson"]),
        "top_salesperson_revenue": float(top_sales.iloc[0]["total_revenue"]),
        "top_salesperson_percentage": float(top_sales.iloc[0]["percentage"]),
        "top_salesperson_region": str(top_sales.iloc[0]["region"]),
        "revenue_by_region": revenue_by_region_list,
        "top_salespeople": top_salespeople_list,
        "all_salespeople": all_salespeople_list,
    }

    response = {
        "success": True,
        "export_format": export_format,
        "charts": {
            "revenue_by_region": {
                "png": chart_region_png,
                "plotly": fig_region.to_json(),
            },
            "top_salespeople": {
                "png": chart_sales_png,
                "plotly": fig_sales.to_json(),
            },
        },
        "summary": summary,
    }

    return jsonify(response)


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"📊 Analytics Service starting on http://localhost:{PORT}")
    print(f"   POST /analyze – Upload CSV or Excel to generate sales analytics")
    app.run(host="0.0.0.0", port=PORT, debug=True)
