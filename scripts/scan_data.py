import os
import json

# define paths relative to this script's location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "../docs/data")
MANIFEST_FILE = os.path.join(DATA_DIR, "cities.json")

def scan_cities():
    if not os.path.exists(DATA_DIR):
        print(f"Error: Could not find directory: {DATA_DIR}")
        return

    # 1. get all subdirectories in 'docs/data/'
    cities = [
        d for d in os.listdir(DATA_DIR) 
        if os.path.isdir(os.path.join(DATA_DIR, d)) 
        and not d.startswith(".")  # Ignore hidden folders
    ]
    
    # 2. sort them alphabetically
    cities.sort()
    
    # 3. write to cities.json
    try:
        with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
            json.dump(cities, f, indent=2)
        print(f"Updated {MANIFEST_FILE}")
        print(f"Found {len(cities)} cities: {', '.join(cities)}")
    except Exception as e:
        print(f"Error writing manifest: {e}")

if __name__ == "__main__":
    scan_cities()