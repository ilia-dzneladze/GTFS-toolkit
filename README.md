# Transit Heatmap Generator (GTFS)

This project visualizes a city’s public transit network using **GTFS shapes** and generates a **heat-colored line map** showing where transit service is most dense.
The heatmap is computed by rasterizing all route shapes, smoothing them, and then coloring vector lines based on local density.

## 🚀 Features
- Uses **GTFS shapes.txt** to reconstruct transit geometry  
- Creates a **2D density map** using Gaussian-smoothed rasterization  
- Overlays the heatmap onto **clean vector lines**  
- Highlights corridors shared by many routes (red = busiest)  
- Automatically normalizes colors for any city  
- Outputs a high-resolution PNG map  

## 📦 Requirements
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

## 📁 Folder Structure
```
transit-heat-map/
│
├── transport_analyzer.py
├── requirements.txt
│
├── cities/
│   ├── kaunas/
│   │   ├── shapes.txt
│   └── vilnius/
│       ├── shapes.txt
│
└── gtfs_maps/
    └── output images appear here
```

Place each city’s GTFS files (at minimum **shapes.txt**) under:

```
cities/<city_name>/
```

## ▶️ Usage
Run:

```
python3 transport_analyzer.py <cityname>
```

Example:

```
python3 transport_analyzer.py vilnius
```

Output will be saved to:

```
gtfs_maps/<city>_hybrid_heatlines.png
```

## 📜 License
MIT — free to modify and redistribute.

## 🤝 Contribute
Pull requests welcome!  
You can test the script with your own city’s GTFS feed by adding a folder under:

```
cities/<your_city>/
```