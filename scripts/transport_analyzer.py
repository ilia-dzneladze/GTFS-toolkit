import pandas as pd
import numpy as np
import json
from shapely.geometry import LineString, mapping
from scipy.ndimage import gaussian_filter
from scipy.interpolate import RegularGridInterpolator
from haversine import haversine    # <-- added for jump filtering
import sys, os
import argparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

########################################
# INPUT
########################################
parser = argparse.ArgumentParser()
parser.add_argument("city", help="City name (folder in cities/)")
args = parser.parse_args()

city = args.city
city_path = os.path.join(BASE_DIR, "cities", city)

shapes_path = os.path.join(city_path, "shapes.txt")
if not os.path.isfile(shapes_path):
    print("Error: shapes.txt missing in", city_path)
    sys.exit(1)

print("Loading shapes...")
shapes = pd.read_csv(shapes_path).sort_values("shape_pt_sequence")

########################################
# Extract geometry
########################################
coords = shapes[["shape_pt_lat", "shape_pt_lon"]].to_numpy()
lats = coords[:, 0]
lons = coords[:, 1]

min_lat, max_lat = lats.min(), lats.max()
min_lon, max_lon = lons.min(), lons.max()

########################################
# BUILD HEATMAP GRID
########################################
GRID = 1000
heat = np.zeros((GRID, GRID))

lat_idx = ((lats - min_lat) / (max_lat - min_lat) * (GRID - 1)).astype(int)
lon_idx = ((lons - min_lon) / (max_lon - min_lon) * (GRID - 1)).astype(int)

print("Rasterizing heatmap...")
for y, x in zip(lat_idx, lon_idx):
    heat[y, x] += 1

heat_smooth = gaussian_filter(heat, sigma=8)

########################################
# Interpolator for sampling heat values
########################################
heat_interp = RegularGridInterpolator(
    (np.linspace(min_lat, max_lat, GRID),
     np.linspace(min_lon, max_lon, GRID)),
    heat_smooth,
    bounds_error=False,
    fill_value=0
)

# ... (imports adapted)
import json
from shapely.geometry import LineString, mapping

# ... (keep existing setup until color map section)


print("Calculating heat values and building GeoJSON...")

max_h = heat_smooth.max()
min_h = heat_smooth.min()

features = []

MAX_JUMP_KM = 1.0 

current_shape_id = None
current_line_coords = []
current_density = 0.0

for shape_id, grp in shapes.groupby("shape_id"):
    grp = grp.sort_values("shape_pt_sequence")
    pts = grp[["shape_pt_lat", "shape_pt_lon"]].to_numpy()

    for i in range(len(pts) - 1):
        lat1, lon1 = pts[i]
        lat2, lon2 = pts[i + 1]

        # Fix: Remove teleport jumps
        if haversine((lat1, lon1), (lat2, lon2)) > MAX_JUMP_KM:
            continue

        mid = np.array([(lat1 + lat2) / 2, (lon1 + lon2) / 2])
        hval = float(heat_interp(mid)[0]) # Get interpolated heat value
        
        # Normalize and quantize
        # Quantizing to 20 levels (5% steps) allows merging many segments while keeping smooth look
        normalized_heat = (hval - min_h) / (max_h - min_h) if (max_h > min_h) else 0
        density_bucket = round(normalized_heat * 20) / 20.0

        if (
            current_shape_id == shape_id and 
            abs(current_density - density_bucket) < 0.001 and
            # Fix: current_line_coords is (lon, lat), haversine needs (lat, lon)
            haversine((current_line_coords[-1][1], current_line_coords[-1][0]), (lat1, lon1)) < 0.05 
        ):
            # Extend current line
            current_line_coords.append((lon2, lat2))
        else:
            # Emit old line if exists
            if current_line_coords:
                 features.append({
                    "type": "Feature",
                    "properties": {"density": current_density},
                    "geometry": mapping(LineString(current_line_coords))
                })
            
            # Start new line
            current_shape_id = shape_id
            current_density = density_bucket
            current_line_coords = [(lon1, lat1), (lon2, lat2)]

# Emit last dangling line
if current_line_coords:
    features.append({
        "type": "Feature",
        "properties": {"density": current_density},
        "geometry": mapping(LineString(current_line_coords))
    })

geojson_payload = {
    "type": "FeatureCollection",
    "features": features
}

########################################
# OUTPUT
########################################

# output directory for frontend
out_dir = os.path.join(BASE_DIR, "docs", "data", city)
os.makedirs(out_dir, exist_ok=True)

outfile = os.path.join(out_dir, "transit_density.geojson")

with open(outfile, "w", encoding="utf-8") as f:
    json.dump(geojson_payload, f, ensure_ascii=False)

print(f"Saved: {outfile} with {len(features)} segments.")
