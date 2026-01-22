# GTFS Toolkit

A lightweight, developer-friendly toolkit for exploring, analyzing, and visualizing public transport data. The project bridges the gap between raw GTFS data and interactive visualizations by combining a Python-based analysis pipeline with a static, serverless frontend.

https://ilia-dzneladze.github.io/GTFS-toolkit/#/kaunas/frequency?window=16_18

## Overview

This toolkit uses a hybrid architecture:
1.  **Local Automation (Python):** An API-driven backend processes raw GTFS feeds, calculates metrics (frequency, connectivity), and generates optimized static assets.
2.  **Static Visualization (JavaScript):** A lightweight frontend loads the pre-computed JSON and PNG assets to display interactive maps and tables without requiring a live backend server in production.

## Features

-   **Automated Data Ingestion:** Simply drop standard GTFS folders into the directory; the system detects and integrates them automatically.
-   **Transit Heatmaps:** Generates high-resolution network density visualizations from `shapes.txt`.
-   **Frequency Analysis:** Computes stop-level arrival gaps (e.g., average wait time between 4 PM and 6 PM) to identify service levels.
-   **Interactive Dashboard:** Map-based exploration using Leaflet.js with synchronized table views and dynamic city switching.
-   **API-Driven Workflow:** Includes a local FastAPI server to trigger analysis scripts and manage data updates via HTTP requests.

## Project Structure

```text
GTFS-toolkit/
├── api/                       # Local automation server
│   └── main.py
│
├── cities/                    # INPUT: Raw GTFS folders go here
│   ├── kaunas/
│   └── san-francisco/
│
├── docs/                      # OUTPUT: The static frontend website
│   ├── index.html
│   ├── app.js
│   ├── data/                  # Generated assets (JSON/PNG)
│   │   ├── cities.json        # Manifest
│   │   └── kaunas/
│   └── scripts/
│
├── scripts/                   # ANALYSIS: Python logic (ETL & Stats)
│   ├── fetch_feed.py          # Downloader
│   ├── scan_data.py           # Manifest generator
│   ├── stop_analysis.py       # Frequency calculator
│   └── transport_analyzer.py  # Heatmap renderer
│
├── requirements.txt
└── README.md
```

## Installation

Clone the repository and set up the Python environment:

```bash
git clone [https://github.com/ilia-dzneladze/GTFS-toolkit.git](https://github.com/ilia-dzneladze/GTFS-toolkit.git)
cd GTFS-toolkit

# Linux / Mac
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### 1. Automated Workflow (API)

The recommended way to use the toolkit is via the local API, which orchestrates the scripts.

1.  **Start the server:**
    ```bash
    uvicorn api.main:app --reload
    ```

2.  **Access the tool:**
    Open the frontend (e.g., `docs/index.html`) in your browser.

3.  **Process a new city:**
    Place a valid GTFS folder (unzipped) into the `cities/` directory. You can then trigger the analysis via the frontend interface or by sending a request to the API:

    ```bash
    curl -X POST [http://127.0.0.1:8000/api/process/](http://127.0.0.1:8000/api/process/)<city_folder_name>
    ```

### 2. Manual CLI Workflow

You can run individual analysis scripts manually from the terminal.

**Download a generic feed (optional):**
```bash
python scripts/fetch_feed.py
```

**Run stop frequency analysis:**
Generates a JSON file with average service gaps for a specific time window.
```bash
python scripts/stop_analysis.py <city_folder_name>
```

**Generate network heatmap:**
Creates a high-resolution PNG visualization of the transit network.
```bash
python scripts/transport_analyzer.py <city_folder_name>
```

**Update the frontend manifest:**
Run this after adding new data so the frontend can detect the new city.
```bash
python scripts/scan_data.py
```

## Deployment

The project is designed for static hosting. The `docs/` folder contains the complete frontend application and the generated data.

To deploy:
1.  Run the analysis locally to generate the contents of `docs/data/`.
2.  Commit the changes.
3.  Serve the `docs/` directory using GitHub Pages, Netlify, or any static file server.

## Tech Stack

-   **Frontend:** HTML5, CSS3, JavaScript (ES6), Leaflet.js
-   **Backend (Data Processing):** Python 3.12, FastAPI
-   **Analysis Libraries:** Pandas, NetworkX, Matplotlib
-   **Data Standard:** GTFS (General Transit Feed Specification)