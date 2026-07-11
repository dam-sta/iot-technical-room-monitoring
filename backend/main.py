import json
import os
import time
from contextlib import asynccontextmanager

import paho.mqtt.client as mqtt
from fastapi import FastAPI


MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = 1883
MQTT_TOPIC = "technical-room/room-1/telemetry"

latest_measurement: dict | None = None


def on_connect(client, userdata, flags, reason_code, properties) -> None:
    if reason_code == 0:
        client.subscribe(MQTT_TOPIC)
        print(f"Subscribed to MQTT topic: {MQTT_TOPIC}")
    else:
        print(f"Could not connect to MQTT broker: {reason_code}")


def on_message(client, userdata, message) -> None:
    global latest_measurement

    latest_measurement = json.loads(message.payload.decode())
    print(f"Received measurement: {latest_measurement}")


def connect_to_broker(client: mqtt.Client) -> None:
    while True:
        try:
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
            return
        except OSError as error:
            print(f"Broker is not ready ({error}). Trying again in 2 seconds...")
            time.sleep(2)


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    connect_to_broker(mqtt_client)
    mqtt_client.loop_start()

    yield

    mqtt_client.disconnect()
    mqtt_client.loop_stop()


app = FastAPI(title="Technical Room Monitoring API", lifespan=lifespan)


@app.get("/measurements/latest")
def get_latest_measurement():
    if latest_measurement is None:
        return {"message": "No measurement received yet"}

    return latest_measurement
