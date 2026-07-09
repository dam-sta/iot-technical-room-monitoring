import json
import random
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt


MQTT_HOST = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "technical-room/room-1/telemetry"

DEVICE_ID = "sensor_technical_room_01"


def generate_measurement() -> dict:
    return {
        "device_id": DEVICE_ID,
        "temperature": round(random.uniform(20.0, 32.0), 2),
        "humidity": round(random.uniform(35.0, 75.0), 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(MQTT_HOST, MQTT_PORT, 60)

    print(f"Publishing telemetry to topic: {MQTT_TOPIC}")

    while True:
        measurement = generate_measurement()
        payload = json.dumps(measurement)

        client.publish(MQTT_TOPIC, payload)
        print(payload)

        time.sleep(5)


if __name__ == "__main__":
    main()