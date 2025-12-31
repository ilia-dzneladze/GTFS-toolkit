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

Place each city’s GTFS files (at minimum **shapes.txt stop_times.txt stops.txt** ) under:

```
cities/<city_name>/
```

## Usage
Run:

```
python3 transport_analyzer.py <cityname>
```

or

```
python3 stop_analysis.py <cityname>
```

Example:

```
python3 transport_analyzer.py vilnius
```

Output will be saved to:

```
gtfs_maps/<city>_hybrid_heatlines.png
```

or

```
python3 stop_analysis.py <cityname>
```

output will be put to standard output

## License
MIT — free to modify and redistribute.

## Contribute
Pull requests welcome!  
You can test the script with your own city’s GTFS feed by adding a folder under:


```
cities/<your_city>/
```