import csv
import time
import argparse
import json
import os
from helpers.time_utils import avg_gap_start_to_end
from helpers.stop_utils import stop

# time * 3600
START = 16 * 3600
END   = 18 * 3600  

# Argument Parsing
parser = argparse.ArgumentParser(description='Enter City Name')
parser.add_argument('city_name', type=str, help='City Name')
args = parser.parse_args()
city_name = args.city_name

# Find cities folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
city_dir = os.path.join(BASE_DIR, "cities", city_name)

# Runtime start
start_time = time.time()

# dictionary for stop id -> stop object
stop_id_to_stop = {}

# calculate and store frequency (gap between arrivals)
with open(os.path.join(city_dir, "stop_times.txt"), 'r', encoding='utf-8-sig') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    stop_id_to_avg_time = {}
    stop_id_to_arrival_times = {}

    for line in csv_reader:
        current_id = line['stop_id']
        current_arrival_time = line['arrival_time']
        if current_id in stop_id_to_arrival_times:
            stop_id_to_arrival_times[current_id].append(current_arrival_time)
        else:
            stop_id_to_arrival_times[current_id] = [current_arrival_time]
            stop_id_to_stop[current_id] = stop(current_id)
        
    for stop_id in stop_id_to_arrival_times:
        curr_avg = avg_gap_start_to_end(stop_id_to_arrival_times[stop_id], START, END)
        stop_id_to_avg_time[stop_id] = curr_avg
        stop_id_to_stop[stop_id].frequency = curr_avg

# match stop_id with stop_name
with open(os.path.join(city_dir, "stops.txt"), 'r', encoding='utf-8-sig') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    for line in csv_reader:
        current_id = line['stop_id']
        current_name = line['stop_name']
        current_latitude = line['stop_lat']
        current_longitude = line['stop_lon']
        if current_id in stop_id_to_stop:
            stop_id_to_stop[current_id].name = current_name
            stop_id_to_stop[current_id].lat = float(current_latitude)
            stop_id_to_stop[current_id].lon = float(current_longitude)

# build sorted list AFTER names/lat/lon are attached
valid_stops = [
    s for s in stop_id_to_stop.values()
    if s.name is not None and s.lat is not None and s.lon is not None and s.frequency > 0
]

valid_stops.sort(key=lambda s: s.frequency)  # most frequent first (smallest gap)

# print
for s in valid_stops:
    print(f'{s.id} frequency is {s.frequency} seconds or around {int(s.frequency/60) + 1} minutes - {s.name}')

# write JSON to site/data/<city>/
payload = {
    "city": city_name,
    "start_sec": START,
    "end_sec": END,
    "sorted_by": "avg_gap_sec_asc",
    "stops": [s.to_dict() for s in valid_stops]
}

out_dir = os.path.join(BASE_DIR, "docs", "data", city_name)
os.makedirs(out_dir, exist_ok=True)
out_file = os.path.join(out_dir, f"frequency_{START//3600}_{END//3600}.json")

with open(out_file, "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2, ensure_ascii=False)

print(f"Wrote JSON: {out_file}")

# Runtime end
end_time = time.time()
print(f'Program took {round(end_time - start_time, 5)} seconds')