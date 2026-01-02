# GTFS toolkit

This project visualizes a city’s public transit network using **GTFS data** and currently (WIP) generates a **heat-colored line map** and **stop frequency (gaps between arrival times)** showing where transit service is most dense and frequent.
The heatmap is computed by rasterizing all route shapes, smoothing them, and then coloring vector lines based on local density.
The frequency is calculated by taking the average of the gaps between arrival times for each stop between given time stamps.

## Features
- Uses **GTFS shapes.txt** to reconstruct transit geometry  
- Creates a **2D density map** using Gaussian-smoothed rasterization  
- Overlays the heatmap onto **clean vector lines**  
- Highlights corridors shared by many routes (red = busiest)  
- Automatically normalizes colors for any city  
- Outputs a high-resolution PNG map  

## Requirements
Install dependencies:

```
pip install -r requirements.txt
```

Dependencies include:
- pandas
- numpy
- matplotlib
- scipy
- haversine
- tqdm

Place each city’s GTFS files (at minimum **shapes.txt/stop_times.txt/stops.txt** ) under:

```
cities/<city_name>/
```

## Usage

All scripts are run from the **project root**.

### Transit heat-map (PNG output)

Run:
```bash
python3 scripts/transport_analyzer.py <city>
```

Example:
```bash
python3 scripts/transport_analyzer.py vilnius
```

Output:
```text
site/data/vilnius/heatlines.png
```

---

### Stop frequency analysis (JSON output)

Run:
```bash
python3 scripts/stop_analysis.py <city>
```

Example:
```bash
python3 scripts/stop_analysis.py kaunas
```

Output:
```text
site/data/kaunas/frequency_<START>_<END>.json
```

Where:
- `<START>` and `<END>` are the hour values of the analyzed time window  
  (e.g. `frequency_16_18.json` for 16:00–18:00).

The JSON contains **all stops for the city**, sorted by average arrival gap
(most frequent service first), and is consumed by the frontend.

---

### Notes
- `<city>` must match a folder name inside `cities/`
- Outputs are written automatically to `site/data/<city>/`
- The website loads data directly from this folder (GitHub Pages compatible)

## License
MIT — free to modify and redistribute.

## Contribute
Pull requests welcome!  
You can test the script with your own city’s GTFS feed by adding a folder under:


```
cities/<your_city>/
```