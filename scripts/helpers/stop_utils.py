# Object for stop
class stop:
    def __init__(self, id):
        self.id = id
        self.name = None
        self.lat = None
        self.lon = None
        self.frequency = 0
    
    def to_dict(self):
        return {
            "stop_id": self.id,
            "name": self.name,
            "lat": self.lat,
            "lon": self.lon,
            "avg_gap_sec": self.frequency
        }