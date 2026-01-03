# GTFS Toolkit

A lightweight GTFS analysis toolkit that generates static outputs (PNG + JSON) using Python and visualizes them through a barebones static frontend hosted on GitHub Pages.

The project follows a one-way data flow: raw GTFS CSV files are processed by Python scripts into static assets, and a frontend loads those assets directly with no backend.

Features:
- Transit heatmap generation from `shapes.txt`
- Stop frequency analysis from `stops.txt` and `stop_times.txt`
- Static frontend for browsing results by city and tool

Transit Heatmap:
- Reads GTFS `shapes.txt`
- Generates a PNG heatmap of the transit network
- Output path:
  site/data/<city>/heatlines.png

Stop Frequency Analysis:
- Reads GTFS `stops.txt` and `stop_times.txt`
- Computes the average gap between arrivals per stop for a given time window
- Stops are sorted by lowest average gap (most frequent service first)
- Output path:
  site/data/<city>/frequency_<START>_<END>.json
  Example:
  site/data/kaunas/frequency_16_18.json

Project structure:
GTFS-toolkit/
├── venv/                      # virtual environment (gitignored)
├── scripts/
│   ├── transport_analyzer.py   # heatmap generation
│   ├── stop_analysis.py        # stop frequency analysis
│   └── helpers/
├── cities/                    # raw GTFS data per city
├── site/                      # static frontend (GitHub Pages)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── data/                  # generated outputs
│       └── <city>/
├── requirements.txt
└── README.md

Setup:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

Usage:
Generate heatmap:
python3 scripts/transport_analyzer.py <city>

Generate stop frequency JSON:
python3 scripts/stop_analysis.py <city> <START_HOUR> <END_HOUR>

All outputs are written to:
site/data/<city>/

Frontend (local):
The frontend is fully static and loads generated PNG and JSON files directly.
To run locally:
cd site
python3 -m http.server 8000

Open in browser:
http://localhost:8000

Deployment:
The frontend is deployed using GitHub Pages and served directly from the site/ directory.
