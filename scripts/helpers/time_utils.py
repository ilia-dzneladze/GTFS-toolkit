def to_seconds(t: str) -> int:
    h, m, s = map(int, t.split(":"))
    return h * 3600 + m * 60 + s

def filter_time_window(timestamps: list[str], start, end) -> list[str]:
    filtered = []

    for t in timestamps:
        sec = to_seconds(t)
        if start <= sec <= end:
            filtered.append(t)

    return filtered

def sort_timestamps(timestamps: list[str]) -> list[str]:
    return sorted(
        timestamps,
        key=lambda t: tuple(map(int, t.split(":")))
    )

def average_time_between(timestamps: list[str]) -> int:
    if len(timestamps) < 2:
        return 0.0

    seconds = [to_seconds(t) for t in timestamps]

    diffs = [
        seconds[i + 1] - seconds[i]
        for i in range(len(seconds) - 1)
    ]

    return sum(diffs) // len(diffs)

def avg_gap_start_to_end(timestamps: list[str], start, end) -> int:
    filtered = filter_time_window(timestamps, start, end)

    if len(filtered) < 2:
        return 0

    sorted_ts = sort_timestamps(filtered)
    return average_time_between(sorted_ts)