import csv
import time
import argparse
from helpers.time_utils import avg_gap_start_to_end

# time * 3600
START = 16 * 3600
END   = 18 * 3600  

# Argument Parsing
parser = argparse.ArgumentParser(description='Enter City Name')
parser.add_argument('city_name', type=str, help='City Name')
args = parser.parse_args()
city_name = args.city_name

# Runtime start
start_time = time.time()

# Object for stop
class stop:
    def __init__(self, id, name, frequency):
        self.name = name
        self.frequency = frequency
        self.id = id

# dictionary for stop id -> stop object
stop_id_to_stop = {}

# list for tuples (pair (frequency, object) for sorting
stops_sorted_by_frequency = []

# calculate and store frequency (gap between arrivals)
with open(f'cities/{city_name}/stop_times.txt', 'r') as csv_file:
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
            stop_id_to_stop[current_id] = stop(current_id, 'default', 0)
        
    for stop_id in stop_id_to_arrival_times:
        curr_avg = avg_gap_start_to_end(stop_id_to_arrival_times[stop_id], START, END)
        stop_id_to_avg_time[stop_id] = curr_avg
        stop_id_to_stop[stop_id].frequency = curr_avg
        stops_sorted_by_frequency.append((curr_avg, stop_id_to_stop[stop_id]))

# match stop_id with stop_name
with open(f'cities/{city_name}/stops.txt', 'r', encoding='utf-8-sig') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    for line in csv_reader:
        current_id = line['stop_id']
        current_name = line['stop_name']
        if current_id in stop_id_to_stop:
            stop_id_to_stop[current_id].name = current_name

# output object values in sorted form
stops_sorted_by_frequency.sort(key=lambda pair: pair[0])
for pair in stops_sorted_by_frequency:
    current_frequency, current_stop = pair
    current_name = current_stop.name

    if current_frequency == 0:
        continue

    print(f'{current_stop.id} frequency is {current_frequency} seconds or around {int(current_frequency/60) + 1} minutes - {current_name}')

# Runtime end
end_time = time.time()
print(f'Program took {round(end_time - start_time, 5)} seconds')