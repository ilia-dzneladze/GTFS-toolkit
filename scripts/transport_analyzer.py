import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
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
city_path = os.path.join("cities", city)

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

########################################
# COLOR MAP
########################################
max_h = heat_smooth.max()
min_h = heat_smooth.min()

cmap = mcolors.LinearSegmentedColormap.from_list(
    "transit_heat",
    ["#00BFFF", "#00FF00", "#FFFF00", "#FF4500", "#FF0000"]
)

norm = mcolors.Normalize(vmin=min_h, vmax=max_h)

########################################
# DRAW HEAT-COLORED VECTOR LINES
########################################
fig, ax = plt.subplots(figsize=(26, 26), dpi=200)

print("Drawing colored lines...")

MAX_JUMP_KM = 1.0   # <-- ONLY NEW FIX

for shape_id, grp in shapes.groupby("shape_id"):
    grp = grp.sort_values("shape_pt_sequence")
    pts = grp[["shape_pt_lat", "shape_pt_lon"]].to_numpy()

    for i in range(len(pts) - 1):

        lat1, lon1 = pts[i]
        lat2, lon2 = pts[i + 1]

        # --------------------------------------------------
        #      FIX: Remove teleport jumps between points
        # --------------------------------------------------
        if haversine((lat1, lon1), (lat2, lon2)) > MAX_JUMP_KM:
            continue
        # --------------------------------------------------

        mid = np.array([(lat1 + lat2) / 2, (lon1 + lon2) / 2])
        hval = heat_interp(mid)
        color = cmap(norm(hval))

        x1 = (lon1 - min_lon) / (max_lon - min_lon) * 3000
        y1 = (lat1 - min_lat) / (max_lat - min_lat) * 3000
        x2 = (lon2 - min_lon) / (max_lon - min_lon) * 3000
        y2 = (lat2 - min_lat) / (max_lat - min_lat) * 3000

        ax.plot([x1, x2], [y1, y2], color=color, linewidth=2)

########################################
# COLORBAR
########################################
sm = plt.cm.ScalarMappable(cmap=cmap, norm=norm)
sm.set_array([])

plt.colorbar(sm, ax=ax, shrink=0.55, pad=0.02,
             label="Transit Density (GTFS shapes)")

########################################
# OUTPUT
########################################

# output directory for frontend
out_dir = os.path.join(BASE_DIR, "site", "data", city)
os.makedirs(out_dir, exist_ok=True)

outfile = os.path.join(out_dir, "heatlines.png")

plt.title(f"{city.capitalize()} — Heat-Colored Transit Network", fontsize=22)
plt.axis("off")
plt.tight_layout()
plt.savefig(outfile, bbox_inches="tight", dpi=200)
plt.close()

print("Saved:", outfile)
