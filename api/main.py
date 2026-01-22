import os
import sys
import subprocess
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# setup cors to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# define paths relative to the project root
# we assume this file is at root/api/main.py
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
scripts_dir = os.path.join(base_dir, "scripts")
source_dir = os.path.join(base_dir, "cities")
output_dir = os.path.join(base_dir, "docs", "data")

def run_script(script_name, args=None):
    """
    helper to execute python scripts located in the scripts directory.
    uses the current python executable.
    """
    script_path = os.path.join(scripts_dir, script_name)
    
    if not os.path.exists(script_path):
        print(f"error: script not found at {script_path}")
        return False

    cmd = [sys.executable, script_path]
    if args:
        cmd.extend(args)

    print(f"running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"finished {script_name}")
            return True
        else:
            print(f"failed {script_name}:\n{result.stderr}")
            return False
    except Exception as e:
        print(f"exception while running {script_name}: {e}")
        return False

def pipeline_task(city_name):
    """
    background task to run the full analysis pipeline for a city.
    1. stops/frequency analysis
    2. transport heat map generation
    3. manifest update
    """
    print(f"starting pipeline for {city_name}")

    # ensure the output directory exists
    target_dir = os.path.join(output_dir, city_name)
    os.makedirs(target_dir, exist_ok=True)

    # run frequency analysis (generates json)
    run_script("stop_analysis.py", [city_name])

    # run heatmap generator (generates png)
    run_script("transport_analyzer.py", [city_name])

    # update the global cities.json manifest
    run_script("scan_data.py")

    print(f"completed pipeline for {city_name}")

@app.post("/api/process/{city_name}")
async def process_city(city_name: str, background_tasks: BackgroundTasks):
    # check if the raw source data exists
    city_source = os.path.join(source_dir, city_name)
    if not os.path.exists(city_source):
        raise HTTPException(status_code=404, detail=f"city '{city_name}' not found in source directory")

    background_tasks.add_task(pipeline_task, city_name)
    return {"status": "ok", "message": f"processing started for {city_name}"}

@app.get("/api/cities")
def list_cities():
    # helper to list available raw data folders
    if not os.path.exists(source_dir):
        return []
    
    return [
        d for d in os.listdir(source_dir) 
        if os.path.isdir(os.path.join(source_dir, d)) and not d.startswith(".")
    ]