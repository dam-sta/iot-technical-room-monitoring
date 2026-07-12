import json
import os
import time
from contextlib import asynccontextmanager

import paho.mqtt.client as mqtt
import psycopg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row


MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = 1883
MQTT_TOPIC = "technical-room/room-1/telemetry"

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://iot_user:iot_password@localhost:5432/iot_monitoring",
)


def on_connect(client, userdata, flags, reason_code, properties) -> None:
    if reason_code == 0:
        client.subscribe(MQTT_TOPIC)
        print(f"Subscribed to MQTT topic: {MQTT_TOPIC}")
    else:
        print(f"Could not connect to MQTT broker: {reason_code}")


def on_message(client, userdata, message) -> None:
    measurement = json.loads(message.payload.decode())
    save_measurement(measurement)
    print(f"Saved measurement: {measurement}")


def connect_to_broker(client: mqtt.Client) -> None:
    while True:
        try:
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
            return
        except OSError as error:
            print(f"Broker is not ready ({error}). Trying again in 2 seconds...")
            time.sleep(2)


def create_measurements_table() -> None:
    while True:
        try:
            with psycopg.connect(DATABASE_URL) as connection:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        CREATE TABLE IF NOT EXISTS measurements (
                            id SERIAL PRIMARY KEY,
                            device_id TEXT NOT NULL,
                            temperature_c DOUBLE PRECISION NOT NULL,
                            humidity_percent DOUBLE PRECISION NOT NULL,
                            measured_at TIMESTAMPTZ NOT NULL
                        )
                        """
                    )
            print("Connected to PostgreSQL")
            return
        except psycopg.OperationalError as error:
            print(f"Database is not ready ({error}). Trying again in 2 seconds...")
            time.sleep(2)


def save_measurement(measurement: dict) -> None:
    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO measurements (
                    device_id,
                    temperature_c,
                    humidity_percent,
                    measured_at
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    measurement["device_id"],
                    measurement["temperature_c"],
                    measurement["humidity_percent"],
                    measurement["measured_at"],
                ),
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_measurements_table()

    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    connect_to_broker(mqtt_client)
    mqtt_client.loop_start()

    yield

    mqtt_client.disconnect()
    mqtt_client.loop_stop()


app = FastAPI(title="Technical Room Monitoring API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/measurements/latest")
def get_latest_measurement():
    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, device_id, temperature_c, humidity_percent, measured_at
                FROM measurements
                ORDER BY measured_at DESC
                LIMIT 1
                """
            )
            measurement = cursor.fetchone()

    if measurement is None:
        return {"message": "No measurement received yet"}

    return measurement


@app.get("/measurements")
def get_measurements():
    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, device_id, temperature_c, humidity_percent, measured_at
                FROM measurements
                ORDER BY measured_at DESC
                LIMIT 50
                """
            )
            measurements = cursor.fetchall()

    return measurements
