import json
import os

# Create data folder if missing
if not os.path.exists("data"):
    os.makedirs("data")

FILE = "data/performance.json"

def load_data():
    if not os.path.exists(FILE):
        with open(FILE, "w") as f:
            json.dump({}, f)
        return {}  # <--- THIS WAS MISSING BEFORE!

    with open(FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def save_data(data):
    with open(FILE, "w") as f:
        json.dump(data, f, indent=4)

def update_performance(topic, correct, time_taken):
    data = load_data()

    if topic not in data:
        data[topic] = {
            "attempts": 0,
            "incorrect": 0,
            "total_time": 0
        }

    data[topic]["attempts"] += 1
    data[topic]["total_time"] += time_taken

    if not correct:
        data[topic]["incorrect"] += 1

    save_data(data)

def generate_report():
    data = load_data()
    report = []

    for topic, d in data.items():
        if d["attempts"] == 0: continue
        
        accuracy = (d["attempts"] - d["incorrect"]) / d["attempts"]
        avg_time = d["total_time"] / d["attempts"]

        weak = accuracy < 0.6 or avg_time > 60

        report.append({
            "topic": topic,
            "accuracy": round(accuracy * 100),
            "avg_time": round(avg_time, 2),
            "status": "WEAK" if weak else "STRONG"
        })

    return report