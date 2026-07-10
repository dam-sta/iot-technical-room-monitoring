import json
import os
import random
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt


MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = 1883
MQTT_TOPIC = "technical-room/room-1/telemetry"

DEVICE_ID = "sensor_technical_room_01"
PUBLISH_INTERVAL_SECONDS = 5


def generate_measurement() -> dict:
    return {
        "device_id": DEVICE_ID,
        "temperature_c": round(random.uniform(20.0, 30.0), 2),
        "humidity_percent": round(random.uniform(35.0, 70.0), 2),
        "measured_at": datetime.now(timezone.utc).isoformat(),
    }


def connect_to_broker(client: mqtt.Client) -> None:
    while True:
        try:
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
            print(f"Connected to MQTT broker: {MQTT_HOST}:{MQTT_PORT}")
            return
        except OSError as error:
            print(f"Broker is not ready ({error}). Trying again in 2 seconds...")
            time.sleep(2)


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    connect_to_broker(client)

    client.loop_start()
    print(f"Publishing measurements to: {MQTT_TOPIC}")

    try:
        while True:
            measurement = generate_measurement()
            payload = json.dumps(measurement)
            result = client.publish(MQTT_TOPIC, payload, qos=0)

            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(payload)
            else:
                print("Could not publish measurement. Waiting for connection...")

            time.sleep(PUBLISH_INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("Stopping sensor simulator")
    finally:
        client.disconnect()
        client.loop_stop()


if __name__ == "__main__":
    main()
