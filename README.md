# IoT Technical Room Monitoring

A small IoT project for monitoring temperature and humidity in a technical
room. The current version uses a Python script as a virtual sensor and sends
measurements to a Mosquitto broker over MQTT.

## Architecture

```text
Python Sensor Simulator  -- MQTT -->  Mosquitto Broker
```

The simulator can later be replaced with a physical device without changing
the MQTT message format.

## Technologies

- Python 3.12
- Paho MQTT
- Eclipse Mosquitto
- Docker Compose

## Running the project

The project was developed in WSL with Ubuntu 24.04 and requires Docker with
Docker Compose.

Start the containers:

```bash
docker compose up --build
```

In another terminal, subscribe to the project topics:

```bash
docker compose exec mosquitto \
  mosquitto_sub -h localhost -t 'technical-room/#' -v
```

Stop and remove the containers:

```bash
docker compose down
```

## MQTT data

Measurements are published every 5 seconds with QoS 0.

Topic:

```text
technical-room/room-1/telemetry
```

Example payload:

```json
{
  "device_id": "sensor_technical_room_01",
  "temperature_c": 24.15,
  "humidity_percent": 48.3,
  "measured_at": "2026-07-10T18:30:00+00:00"
}
```

## Roadmap

- Receive MQTT messages in a FastAPI backend
- Store measurements in PostgreSQL
- Display current and historical data in a React dashboard
