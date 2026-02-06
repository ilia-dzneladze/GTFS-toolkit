# GTFS Toolkit

A comprehensive toolkit for analyzing and visualizing GTFS (General Transit Feed Specification) data. This project provides Python scripts for backend data processing and a web-based frontend for interactive visualization.

https://ilia-dzneladze.github.io/GTFS-toolkit/#/kaunas/heatmap

## Features

- **Transit Heatmap**: Visualize the density of public transport coverage across a city with interactive, color-coded heatmaps.
- **Stop Frequency Analysis**: Analyze and visualize average waiting times (gaps) between vehicles at specific stops.
- **GeoJSON Export**: Efficiently generates lightweight GeoJSON files for map rendering.
- **Interactive Web Interface**: A fast, responsive frontend built with Leaflet.js to explore the analyzed data.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ilia-dzneladze/GTFS-toolkit.git
   cd GTFS-toolkit
   ```

2. **Set up a virtual environment** (optional but recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### 1. Data Analysis

The toolkit assumes GTFS data is located in `cities/<city_name>/` (e.g., `cities/kaunas/shapes.txt`, etc.).

**Generate Transit Heatmap:**
This script processes the GTFS shapes to create a visual density map.
```bash
python3 scripts/transport_analyzer.py <city_name>
# Example: python3 scripts/transport_analyzer.py kaunas
```
*Output: `docs/data/<city_name>/transit_density.geojson`*

**Analyze Stop Frequencies:**
(Assuming `stop_analysis.py` is available and configured similarly)
```bash
python3 scripts/stop_analysis.py <city_name>
```

### 2. Visualization

The frontend is a static web application located in the `docs/` directory. To view it:

1. **Start a local web server**:
   ```bash
   python3 -m http.server 8000 -d docs
   ```

2. **Open in Browser**:
   Navigate to [http://localhost:8000](http://localhost:8000).

3. **Explore**:
   - Select your city from the dropdown.
   - Switch between **Transit Heatmap** and **Stop Frequency** tools.

## Project Structure

- `scripts/`: Python scripts for data processing (`transport_analyzer.py`, `stop_analysis.py`).
- `docs/`: Frontend application (HTML, CSS, JS, and generated data).
- `cities/`: Directory for input GTFS data (not included in repo).
- `requirements.txt`: Python package dependencies.

## License

[MIT](LICENSE)